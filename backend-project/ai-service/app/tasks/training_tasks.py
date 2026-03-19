"""
Celery tasks: Training pipeline.
Acumulăm corecții → antrenăm cu PEFT/LoRA → evaluăm → promovăm.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict
from uuid import uuid4

from loguru import logger

from app.tasks.celery_app import celery_app
from app.core.config import settings


@celery_app.task(bind=True, name="train_classifier")
def train_classifier_task(self):
    """
    Re-antrenare Document Classifier cu datele din corecții.
    1. Colectează training examples
    2. Fine-tune BERT cu PEFT/LoRA
    3. Evaluează pe validation set
    4. Promovează dacă acuratețea e mai bună
    """
    import asyncio
    return asyncio.run(_train_classifier(self))


async def _train_classifier(task):
    """Training pipeline pentru classifier."""
    logger.info("[Training] Start: Document Classifier")
    task.update_state(state="TRAINING", meta={"model": "classifier", "progress": 0})

    from app.core.database import AsyncSessionLocal
    from app.core.security import get_encryption
    from app.models.training_example import TrainingExample
    from app.models.model_version import ModelVersion
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        # 1. Colectare date
        stmt = select(TrainingExample).where(
            TrainingExample.used_in_training == False,
            TrainingExample.ocr_text_encrypted.isnot(None),
        )
        result = await db.execute(stmt)
        examples = result.scalars().all()

        if len(examples) < settings.MIN_CORRECTIONS_BEFORE_RETRAIN:
            return {
                "status": "skipped",
                "reason": f"Insuficiente exemple ({len(examples)}/{settings.MIN_CORRECTIONS_BEFORE_RETRAIN})",
            }

        logger.info(f"[Training] {len(examples)} exemple disponibile")
        task.update_state(state="TRAINING", meta={"model": "classifier", "progress": 20})

        # 2. Pregătire dataset
        try:
            enc = get_encryption()
        except Exception:
            enc = None

        from app.processors.classifier import DOCUMENT_CLASSES

        texts = []
        labels = []
        for ex in examples:
            try:
                text = enc.decrypt(ex.ocr_text_encrypted) if enc else ex.ocr_text_encrypted
                label = DOCUMENT_CLASSES.index(ex.document_type) if ex.document_type in DOCUMENT_CLASSES else 6
                texts.append(text)
                labels.append(label)
            except Exception as e:
                logger.warning(f"Skip training example {ex.id}: {e}")

        if len(texts) < 10:
            return {"status": "skipped", "reason": "Prea puține exemple valide"}

        task.update_state(state="TRAINING", meta={"model": "classifier", "progress": 40})

        # 3. Fine-tune
        version_id = str(uuid4())[:8]
        output_dir = str(settings.model_storage / "classifier" / f"v_{version_id}")

        metrics = _fine_tune_classifier(texts, labels, output_dir, task)

        task.update_state(state="EVALUATING", meta={"model": "classifier", "progress": 80})

        # 4. Salvare versiune
        model_version = ModelVersion(
            model_name="classifier",
            version=version_id,
            training_date=datetime.now(timezone.utc),
            dataset_size=len(texts),
            accuracy_metrics=metrics,
            model_path=output_dir,
            is_active=False,
        )
        db.add(model_version)

        # 5. Marcare exemple ca folosite
        for ex in examples:
            ex.used_in_training = True

        await db.commit()

        # 6. Auto-promote dacă acuratețea e mai bună
        from app.services.training_service import activate_model_version, cleanup_old_versions

        current_stmt = select(ModelVersion).where(
            ModelVersion.model_name == "classifier",
            ModelVersion.is_active == True,
        )
        current_result = await db.execute(current_stmt)
        current = current_result.scalar_one_or_none()

        should_promote = True
        if current and current.accuracy_metrics:
            old_acc = current.accuracy_metrics.get("accuracy", 0)
            new_acc = metrics.get("accuracy", 0)
            if new_acc <= old_acc:
                should_promote = False
                logger.info(f"[Training] Model nou ({new_acc:.4f}) nu e mai bun decât cel activ ({old_acc:.4f})")

        if should_promote:
            await activate_model_version(db, model_version.id)
            logger.info(f"[Training] Classifier v{version_id} promovat!")

        await cleanup_old_versions(db, "classifier")
        await db.commit()

        return {
            "status": "completed",
            "version": version_id,
            "metrics": metrics,
            "promoted": should_promote,
            "dataset_size": len(texts),
        }


def _fine_tune_classifier(texts, labels, output_dir, task=None):
    """Fine-tune BERT classifier cu PyTorch + HuggingFace Trainer."""
    try:
        import torch
        from transformers import (
            BertTokenizer,
            BertForSequenceClassification,
            Trainer,
            TrainingArguments,
        )
        from torch.utils.data import Dataset

        class TextDataset(Dataset):
            def __init__(self, encodings, labels):
                self.encodings = encodings
                self.labels = labels

            def __len__(self):
                return len(self.labels)

            def __getitem__(self, idx):
                item = {k: v[idx] for k, v in self.encodings.items()}
                item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
                return item

        # Load base model
        base_path = settings.model_storage / "bert_base"
        if base_path.exists():
            model_name = str(base_path)
        else:
            model_name = settings.CLASSIFIER_MODEL_NAME

        tokenizer = BertTokenizer.from_pretrained(model_name)
        model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=settings.CLASSIFIER_NUM_LABELS,
        )

        # Split train/val
        split_idx = int(len(texts) * 0.8)
        train_texts, val_texts = texts[:split_idx], texts[split_idx:]
        train_labels, val_labels = labels[:split_idx], labels[split_idx:]

        train_enc = tokenizer(
            train_texts, truncation=True, padding="max_length",
            max_length=settings.MAX_SEQUENCE_LENGTH, return_tensors="pt",
        )
        val_enc = tokenizer(
            val_texts, truncation=True, padding="max_length",
            max_length=settings.MAX_SEQUENCE_LENGTH, return_tensors="pt",
        )

        train_dataset = TextDataset(train_enc, train_labels)
        val_dataset = TextDataset(val_enc, val_labels)

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=settings.TRAINING_EPOCHS,
            per_device_train_batch_size=settings.TRAINING_BATCH_SIZE,
            learning_rate=settings.TRAINING_LEARNING_RATE,
            warmup_steps=settings.TRAINING_WARMUP_STEPS,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="accuracy",
            logging_steps=10,
            report_to="none",
        )

        from sklearn.metrics import accuracy_score, f1_score
        import numpy as np

        def compute_metrics(pred):
            preds = np.argmax(pred.predictions, axis=-1)
            acc = accuracy_score(pred.label_ids, preds)
            f1 = f1_score(pred.label_ids, preds, average="weighted")
            return {"accuracy": acc, "f1": f1}

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=compute_metrics,
        )

        trainer.train()
        eval_result = trainer.evaluate()

        # Save best model
        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir)

        return {
            "accuracy": eval_result.get("eval_accuracy", 0),
            "f1": eval_result.get("eval_f1", 0),
            "loss": eval_result.get("eval_loss", 0),
        }

    except Exception as e:
        logger.error(f"[Training] Eroare fine-tuning: {e}")
        return {"accuracy": 0, "f1": 0, "error": str(e)}


@celery_app.task(name="train_ner")
def train_ner_task():
    """Re-antrenare NER model cu corecțiile de entități."""
    logger.info("[Training] NER training - placeholder (same pattern as classifier)")
    return {"status": "not_implemented_yet"}

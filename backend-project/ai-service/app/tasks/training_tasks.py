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

        # Backend principal foloseste denumiri RO in DocumentType (factura, chitanta...).
        # AI service foloseste nume EN in DOCUMENT_CLASSES. Mapam RO → EN aici, altfel
        # toate exemplele cad la fallback "id_card" si modelul nu invata nimic.
        RO_TO_EN = {
            "factura": "invoice",
            "chitanta": "receipt",
            "contract": "contract",
            "declaratie": "tax_declaration",
            "stat_plata": "payroll",
            "extras_bancar": "bank_statement",
            "bon_fiscal": "receipt",            # bon fiscal e tot un fel de chitanta
            "certificat": "other",
            "proces_verbal": "other",
            "act_constitutiv": "other",
            "altele": "other",
        }
        DEFAULT_LABEL = DOCUMENT_CLASSES.index("other") if "other" in DOCUMENT_CLASSES else 6

        texts = []
        labels = []
        for ex in examples:
            try:
                text = enc.decrypt(ex.ocr_text_encrypted) if enc else ex.ocr_text_encrypted
                # Daca tipul e RO il mapam; daca e deja EN si exista, il folosim direct.
                doc_type_en = RO_TO_EN.get(ex.document_type, ex.document_type)
                if doc_type_en in DOCUMENT_CLASSES:
                    label = DOCUMENT_CLASSES.index(doc_type_en)
                else:
                    label = DEFAULT_LABEL
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


@celery_app.task(bind=True, name="train_ner")
def train_ner_task(self):
    """
    Re-antrenare NER model cu corecțiile de entități.
    1. Colectează training examples cu corecții de entități
    2. Fine-tune BERT Token Classification cu BIO tags
    3. Evaluează pe validation set
    4. Promovează dacă F1 e mai bun
    """
    import asyncio
    return asyncio.run(_train_ner(self))


async def _train_ner(task):
    """Training pipeline pentru NER extractor."""
    logger.info("[Training] Start: NER Extractor")
    task.update_state(state="TRAINING", meta={"model": "ner_extractor", "progress": 0})

    from app.core.database import AsyncSessionLocal
    from app.core.security import get_encryption
    from app.models.training_example import TrainingExample
    from app.models.model_version import ModelVersion
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        # 1. Colectare exemple cu corecții de entități
        stmt = select(TrainingExample).where(
            TrainingExample.used_in_training == False,
            TrainingExample.corrected_entities_encrypted.isnot(None),
            TrainingExample.ocr_text_encrypted.isnot(None),
        )
        result = await db.execute(stmt)
        examples = result.scalars().all()

        if len(examples) < settings.MIN_CORRECTIONS_BEFORE_RETRAIN:
            return {
                "status": "skipped",
                "reason": f"Insuficiente exemple NER ({len(examples)}/{settings.MIN_CORRECTIONS_BEFORE_RETRAIN})",
            }

        logger.info(f"[Training] {len(examples)} exemple NER disponibile")
        task.update_state(state="TRAINING", meta={"model": "ner_extractor", "progress": 20})

        # 2. Pregătire dataset
        try:
            enc = get_encryption()
        except Exception:
            enc = None

        texts = []
        entity_annotations = []
        for ex in examples:
            try:
                text = enc.decrypt(ex.ocr_text_encrypted) if enc else ex.ocr_text_encrypted
                corrected_raw = enc.decrypt(ex.corrected_entities_encrypted) if enc else ex.corrected_entities_encrypted
                entities = json.loads(corrected_raw)
                if text and entities:
                    texts.append(text)
                    entity_annotations.append(entities)
            except Exception as e:
                logger.warning(f"Skip NER training example {ex.id}: {e}")

        if len(texts) < 10:
            return {"status": "skipped", "reason": "Prea puține exemple NER valide"}

        task.update_state(state="TRAINING", meta={"model": "ner_extractor", "progress": 40})

        # 3. Fine-tune NER
        version_id = str(uuid4())[:8]
        output_dir = str(settings.model_storage / "ner_extractor" / f"v_{version_id}")

        metrics = _fine_tune_ner(texts, entity_annotations, output_dir, task)

        task.update_state(state="EVALUATING", meta={"model": "ner_extractor", "progress": 80})

        # 4. Salvare versiune
        model_version = ModelVersion(
            model_name="ner_extractor",
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

        # 6. Auto-promote dacă F1 e mai bun
        from app.services.training_service import activate_model_version, cleanup_old_versions

        current_stmt = select(ModelVersion).where(
            ModelVersion.model_name == "ner_extractor",
            ModelVersion.is_active == True,
        )
        current_result = await db.execute(current_stmt)
        current = current_result.scalar_one_or_none()

        should_promote = True
        if current and current.accuracy_metrics:
            old_f1 = current.accuracy_metrics.get("f1", 0)
            new_f1 = metrics.get("f1", 0)
            if new_f1 <= old_f1:
                should_promote = False
                logger.info(f"[Training] NER nou (F1={new_f1:.4f}) nu e mai bun decât cel activ (F1={old_f1:.4f})")

        if should_promote:
            await activate_model_version(db, model_version.id)
            logger.info(f"[Training] NER v{version_id} promovat!")

        await cleanup_old_versions(db, "ner_extractor")
        await db.commit()

        return {
            "status": "completed",
            "version": version_id,
            "metrics": metrics,
            "promoted": should_promote,
            "dataset_size": len(texts),
        }


def _text_to_bio_labels(text: str, entities: Dict, tokenizer) -> List[int]:
    """
    Convertește text + entități corectate în etichete BIO per token.
    entities: {"invoice_num": "FA-123", "total": "1500.00", ...}
    """
    from app.processors.ner_extractor import LABEL2ID

    encoded = tokenizer(text, return_offsets_mapping=True, add_special_tokens=False)
    offsets = encoded["offset_mapping"]
    labels = [LABEL2ID["O"]] * len(offsets)

    for field_name, value in entities.items():
        if not value or not isinstance(value, str):
            continue

        field_upper = field_name.upper()
        b_label = f"B-{field_upper}"
        i_label = f"I-{field_upper}"

        if b_label not in LABEL2ID:
            continue

        # Găsim valoarea în text (case-insensitive)
        text_lower = text.lower()
        value_lower = value.lower().strip()
        start_pos = text_lower.find(value_lower)

        if start_pos == -1:
            continue

        end_pos = start_pos + len(value_lower)

        # Mapăm pe tokeni
        first_token = True
        for idx, (tok_start, tok_end) in enumerate(offsets):
            if idx >= len(labels):
                break
            if tok_end <= start_pos or tok_start >= end_pos:
                continue
            if first_token:
                labels[idx] = LABEL2ID[b_label]
                first_token = False
            else:
                labels[idx] = LABEL2ID[i_label]

    return labels


def _fine_tune_ner(
    texts: List[str],
    entity_annotations: List[Dict],
    output_dir: str,
    task=None,
) -> Dict:
    """Fine-tune BERT Token Classification cu BIO tags."""
    try:
        import torch
        import numpy as np
        from transformers import (
            BertTokenizer,
            BertForTokenClassification,
            Trainer,
            TrainingArguments,
        )
        from torch.utils.data import Dataset
        from sklearn.metrics import f1_score, precision_score, recall_score

        from app.processors.ner_extractor import NER_LABELS, LABEL2ID, ID2LABEL

        class NERDataset(Dataset):
            def __init__(self, encodings, labels_list):
                self.encodings = encodings
                self.labels_list = labels_list

            def __len__(self):
                return len(self.labels_list)

            def __getitem__(self, idx):
                item = {k: v[idx] for k, v in self.encodings.items()}
                item["labels"] = torch.tensor(self.labels_list[idx], dtype=torch.long)
                return item

        # Load base model
        base_path = settings.model_storage / "bert_base"
        model_name = str(base_path) if base_path.exists() else settings.NER_MODEL_NAME

        tokenizer = BertTokenizer.from_pretrained(model_name)
        model = BertForTokenClassification.from_pretrained(
            model_name,
            num_labels=settings.NER_NUM_LABELS,
            id2label=ID2LABEL,
            label2id=LABEL2ID,
        )

        # Pregătire date: tokenizare + BIO labels
        all_labels = []
        for text, entities in zip(texts, entity_annotations):
            bio_labels = _text_to_bio_labels(text, entities, tokenizer)
            all_labels.append(bio_labels)

        # Tokenizare cu padding/truncation
        encodings = tokenizer(
            texts,
            truncation=True,
            padding="max_length",
            max_length=settings.MAX_SEQUENCE_LENGTH,
            return_tensors="pt",
        )

        # Align labels: -100 pentru [CLS], [SEP], padding (ignore la loss)
        padded_labels = []
        for labels in all_labels:
            final_labels = [-100]  # [CLS]
            final_labels.extend(labels[:settings.MAX_SEQUENCE_LENGTH - 2])
            final_labels.append(-100)  # [SEP]
            while len(final_labels) < settings.MAX_SEQUENCE_LENGTH:
                final_labels.append(-100)
            padded_labels.append(final_labels)

        # Split train/val
        split_idx = max(int(len(texts) * 0.8), 1)
        train_enc = {k: v[:split_idx] for k, v in encodings.items()}
        val_enc = {k: v[split_idx:] for k, v in encodings.items()}
        train_labels = padded_labels[:split_idx]
        val_labels = padded_labels[split_idx:]

        if not val_labels:
            val_enc = train_enc
            val_labels = train_labels

        train_dataset = NERDataset(train_enc, train_labels)
        val_dataset = NERDataset(val_enc, val_labels)

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=settings.TRAINING_EPOCHS,
            per_device_train_batch_size=settings.TRAINING_BATCH_SIZE,
            learning_rate=settings.TRAINING_LEARNING_RATE,
            warmup_steps=settings.TRAINING_WARMUP_STEPS,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            logging_steps=10,
            report_to="none",
        )

        def compute_metrics(pred):
            preds = np.argmax(pred.predictions, axis=-1)
            labels_arr = pred.label_ids

            true_flat = []
            pred_flat = []
            for p_seq, l_seq in zip(preds, labels_arr):
                for p, l in zip(p_seq, l_seq):
                    if l != -100:
                        true_flat.append(l)
                        pred_flat.append(p)

            f1 = f1_score(true_flat, pred_flat, average="weighted", zero_division=0)
            precision = precision_score(true_flat, pred_flat, average="weighted", zero_division=0)
            recall = recall_score(true_flat, pred_flat, average="weighted", zero_division=0)
            return {"f1": f1, "precision": precision, "recall": recall}

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=compute_metrics,
        )

        trainer.train()
        eval_result = trainer.evaluate()

        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir)

        return {
            "f1": eval_result.get("eval_f1", 0),
            "precision": eval_result.get("eval_precision", 0),
            "recall": eval_result.get("eval_recall", 0),
            "loss": eval_result.get("eval_loss", 0),
        }

    except Exception as e:
        logger.error(f"[Training] Eroare fine-tuning NER: {e}")
        return {"f1": 0, "precision": 0, "recall": 0, "error": str(e)}

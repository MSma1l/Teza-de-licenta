"""
Service: Training Pipeline - colectare date + re-antrenare modele.
"""

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.training_example import TrainingExample
from app.models.model_version import ModelVersion


async def get_training_stats(db: AsyncSession) -> Dict[str, Any]:
    """Statistici despre datele de antrenament disponibile."""
    # Total corecții
    total_stmt = select(func.count(TrainingExample.id))
    total = (await db.execute(total_stmt)).scalar() or 0

    # Corecții nefolosite
    unused_stmt = select(func.count(TrainingExample.id)).where(
        TrainingExample.used_in_training == False
    )
    unused = (await db.execute(unused_stmt)).scalar() or 0

    # Per model type
    type_correct_stmt = select(func.count(TrainingExample.id)).where(
        TrainingExample.type_was_correct == False
    )
    type_corrections = (await db.execute(type_correct_stmt)).scalar() or 0

    entity_stmt = select(func.count(TrainingExample.id)).where(
        TrainingExample.corrected_entities_encrypted.isnot(None)
    )
    entity_corrections = (await db.execute(entity_stmt)).scalar() or 0

    return {
        "total_examples": total,
        "unused_examples": unused,
        "type_corrections": type_corrections,
        "entity_corrections": entity_corrections,
        "min_required": settings.MIN_CORRECTIONS_BEFORE_RETRAIN,
        "can_retrain_classifier": type_corrections >= settings.MIN_CORRECTIONS_BEFORE_RETRAIN,
        "can_retrain_ner": entity_corrections >= settings.MIN_CORRECTIONS_BEFORE_RETRAIN,
    }


async def save_training_example(
    db: AsyncSession,
    document_id,
    document_type: str,
    ocr_text_encrypted: str,
    predicted_entities_encrypted: Optional[str],
    corrected_entities_encrypted: Optional[str],
    type_was_correct: bool,
    urgency_feedback: Optional[str],
    accountant_id,
) -> TrainingExample:
    """Salvează un exemplu de antrenament din corecțiile contabilului."""
    example = TrainingExample(
        document_id=document_id,
        document_type=document_type,
        ocr_text_encrypted=ocr_text_encrypted,
        predicted_entities_encrypted=predicted_entities_encrypted,
        corrected_entities_encrypted=corrected_entities_encrypted,
        type_was_correct=type_was_correct,
        urgency_feedback=urgency_feedback,
        accountant_id=accountant_id,
    )
    db.add(example)
    return example


async def get_model_versions(
    db: AsyncSession,
    model_name: Optional[str] = None,
) -> list:
    """Listează versiunile modelelor."""
    stmt = select(ModelVersion).order_by(ModelVersion.created_at.desc())
    if model_name:
        stmt = stmt.where(ModelVersion.model_name == model_name)
    result = await db.execute(stmt)
    return result.scalars().all()


async def activate_model_version(
    db: AsyncSession,
    model_id,
) -> ModelVersion:
    """Activează o versiune de model (și dezactivează cea curentă)."""
    stmt = select(ModelVersion).where(ModelVersion.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()

    if not model:
        raise ValueError(f"Model version {model_id} nu există")

    # Dezactivează toate versiunile acestui model
    all_stmt = select(ModelVersion).where(
        ModelVersion.model_name == model.model_name,
        ModelVersion.is_active == True,
    )
    all_result = await db.execute(all_stmt)
    for m in all_result.scalars().all():
        m.is_active = False

    # Activează versiunea selectată
    model.is_active = True

    # Creăm symlink/copie la directorul activ
    active_path = settings.model_storage / model.model_name / "active"
    if active_path.exists():
        shutil.rmtree(active_path)
    shutil.copytree(model.model_path, str(active_path))

    logger.info(f"Model {model.model_name} v{model.version} activat")
    return model


async def cleanup_old_versions(
    db: AsyncSession,
    model_name: str,
    keep: int = None,
):
    """Șterge versiunile vechi ale modelului (păstrează ultimele N)."""
    keep = keep or settings.MAX_MODEL_VERSIONS_KEEP

    stmt = (
        select(ModelVersion)
        .where(ModelVersion.model_name == model_name)
        .order_by(ModelVersion.created_at.desc())
    )
    result = await db.execute(stmt)
    versions = result.scalars().all()

    if len(versions) <= keep:
        return

    for old_version in versions[keep:]:
        if old_version.is_active:
            continue
        # Ștergem fișierele
        model_path = Path(old_version.model_path)
        if model_path.exists():
            shutil.rmtree(model_path)
        await db.delete(old_version)
        logger.info(f"Deleted old model version: {model_name} v{old_version.version}")

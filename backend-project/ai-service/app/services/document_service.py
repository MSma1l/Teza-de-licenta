"""
Service: Logica de procesare documente.
Auto-processing + manual queue.
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_encryption, compute_document_fingerprint
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.recommendation import Recommendation


def compute_file_hash(file_bytes: bytes) -> str:
    """SHA-256 hash al fișierului."""
    return hashlib.sha256(file_bytes).hexdigest()


async def should_auto_process(
    document: Document,
    entities: Dict,
    db: AsyncSession,
) -> bool:
    """
    Determină dacă documentul poate fi procesat automat.
    Condiții: tip cunoscut, confidence ridicat, urgență scăzută,
    vendor existent, fără duplicate, câmpuri complete, validare ok.
    """
    conditions = [
        document.document_type in ["receipt", "invoice"],
        document.avg_ocr_confidence is not None and document.avg_ocr_confidence > settings.AUTO_PROCESS_MIN_CONFIDENCE,
        document.urgency_score is not None and document.urgency_score < settings.AUTO_PROCESS_MAX_URGENCY,
        not document.has_flagged_fields,
        document.duplicate_of_id is None,
    ]

    # Verificăm dacă avem toate câmpurile esențiale
    required_fields = {"date", "total", "vendor"}
    extracted = set(entities.keys())
    conditions.append(required_fields.issubset(extracted))

    return all(conditions)


async def create_extracted_fields(
    db: AsyncSession,
    document_id: UUID,
    entities: Dict,
    encryption_key: Optional[str] = None,
) -> list:
    """Creează înregistrări ExtractedField din entitățile extrase."""
    enc = get_encryption(encryption_key)
    fields = []

    for field_name, values in entities.items():
        for val_info in values:
            is_flagged = val_info["confidence"] < settings.OCR_CONFIDENCE_THRESHOLD
            field = ExtractedField(
                document_id=document_id,
                field_name=field_name,
                value_encrypted=enc.encrypt(val_info["value"]),
                confidence=val_info["confidence"],
                is_flagged=is_flagged,
            )
            db.add(field)
            fields.append(field)

    return fields


async def check_duplicate(
    db: AsyncSession,
    company_id: UUID,
    fingerprint: str,
    file_hash: str,
) -> Optional[UUID]:
    """Verifică dacă există un document duplicat exact."""
    # Check exact hash
    stmt = select(Document).where(
        Document.company_id == company_id,
        Document.file_hash == file_hash,
        Document.status != "rejected",
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return existing.id

    # Check fingerprint
    if fingerprint:
        stmt = select(Document).where(
            Document.company_id == company_id,
            Document.fingerprint == fingerprint,
            Document.status != "rejected",
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing.id

    return None

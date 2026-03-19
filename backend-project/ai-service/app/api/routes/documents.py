"""
API Routes: Documente - upload, queue, detalii, approve, correct, reject, escalate.
"""

import os
import hashlib
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from loguru import logger
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_encryption
from app.api.deps import get_current_user, require_role, get_company_filter
from app.models.user import User
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.recommendation import Recommendation
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentResponse,
    DocumentQueueItem,
    DocumentCorrection,
    DocumentApproval,
    DocumentRejection,
    QueueStats,
    ExtractedFieldResponse,
    RecommendationResponse,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/png",
    "image/tiff",
    "image/jpeg",
]


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload un document scanat pentru procesare OCR."""
    # Validare tip fișier
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tip fișier neacceptat: {file.content_type}. Acceptat: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Citire fișier
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fișier prea mare")

    # Salvare pe disc
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(user.company_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{file_hash}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Criptare path
    try:
        enc = get_encryption()
        file_path_encrypted = enc.encrypt(file_path)
    except Exception:
        file_path_encrypted = file_path

    # Creare document în DB
    doc = Document(
        company_id=user.company_id,
        uploaded_by=user.id,
        original_filename=file.filename,
        file_hash=file_hash,
        file_path_encrypted=file_path_encrypted,
        file_size=file_size,
        mime_type=file.content_type,
        status="uploaded",
    )
    db.add(doc)
    await db.flush()

    # Lansare task Celery
    from app.tasks.document_tasks import process_document_task
    task = process_document_task.delay(
        document_id=str(doc.id),
        company_id=str(user.company_id),
        file_path=file_path,
        filename=file.filename,
    )

    doc.status = "ocr_processing"
    await db.commit()

    logger.info(f"Document uploaded: {doc.id} by user {user.id}")

    return DocumentUploadResponse(
        id=doc.id,
        status="ocr_processing",
        message="Document încărcat. Procesarea a început.",
        task_id=task.id,
    )


@router.get("/queue", response_model=list[DocumentQueueItem])
async def get_document_queue(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Obține queue-ul de documente, sortat pe urgency DESC."""
    stmt = (
        select(Document)
        .where(Document.company_id == company_id)
        .order_by(desc(Document.urgency_score))
        .offset(offset)
        .limit(limit)
    )

    if status_filter:
        stmt = stmt.where(Document.status == status_filter)
    else:
        stmt = stmt.where(Document.status.in_([
            "pending_approval",
            "requires_manual_completion",
            "duplicate_detected",
        ]))

    result = await db.execute(stmt)
    docs = result.scalars().all()

    return [
        DocumentQueueItem(
            id=d.id,
            original_filename=d.original_filename,
            document_type=d.document_type,
            status=d.status,
            urgency_score=d.urgency_score,
            avg_ocr_confidence=d.avg_ocr_confidence,
            has_flagged_fields=d.has_flagged_fields,
            assigned_to=d.assigned_to,
            created_at=d.created_at,
        )
        for d in docs
    ]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    company_id: UUID = Depends(get_company_filter),
):
    """Detalii complete document."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    return doc


@router.get("/{document_id}/fields", response_model=list[ExtractedFieldResponse])
async def get_document_fields(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    company_id: UUID = Depends(get_company_filter),
):
    """Câmpuri extrase + confidence."""
    # Verifică accesul
    doc_stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    doc_result = await db.execute(doc_stmt)
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document negăsit")

    stmt = select(ExtractedField).where(ExtractedField.document_id == document_id)
    result = await db.execute(stmt)
    fields = result.scalars().all()

    # Decriptare valori
    try:
        enc = get_encryption()
        return [
            ExtractedFieldResponse(
                id=f.id,
                field_name=f.field_name,
                value=enc.decrypt(f.value_encrypted),
                confidence=f.confidence,
                is_flagged=f.is_flagged,
                was_corrected=f.was_corrected,
            )
            for f in fields
        ]
    except Exception:
        return [
            ExtractedFieldResponse(
                id=f.id,
                field_name=f.field_name,
                value=f.value_encrypted,
                confidence=f.confidence,
                is_flagged=f.is_flagged,
                was_corrected=f.was_corrected,
            )
            for f in fields
        ]


@router.get("/{document_id}/recommendations", response_model=list[RecommendationResponse])
async def get_recommendations(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    company_id: UUID = Depends(get_company_filter),
):
    """Recomandări AI pentru document."""
    stmt = select(Recommendation).where(Recommendation.document_id == document_id)
    result = await db.execute(stmt)
    recs = result.scalars().all()

    try:
        enc = get_encryption()
        return [
            RecommendationResponse(
                id=r.id,
                rec_type=r.rec_type,
                content=enc.decrypt(r.content_encrypted),
                confidence=r.confidence,
                was_accepted=r.was_accepted,
            )
            for r in recs
        ]
    except Exception:
        return [
            RecommendationResponse(
                id=r.id,
                rec_type=r.rec_type,
                content=r.content_encrypted,
                confidence=r.confidence,
                was_accepted=r.was_accepted,
            )
            for r in recs
        ]


@router.post("/{document_id}/approve")
async def approve_document(
    document_id: UUID,
    body: DocumentApproval,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Aprobă un document procesat."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    doc.status = "approved"
    doc.approved_by = user.id
    doc.approved_at = datetime.now(timezone.utc)

    # Audit log
    from app.services.audit_service import append_audit_log
    await append_audit_log(db, "document_approve", user.id, document_id, body.notes or "")

    await db.commit()
    return {"status": "approved", "document_id": str(document_id)}


@router.post("/{document_id}/correct")
async def correct_document(
    document_id: UUID,
    body: DocumentCorrection,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Trimite corecții pentru câmpuri (generează training example)."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    # Corectare tip document
    type_was_correct = True
    if body.document_type and body.document_type != doc.document_type:
        doc.document_type = body.document_type
        type_was_correct = False

    # Corectare câmpuri
    if body.fields:
        try:
            enc = get_encryption()
        except Exception:
            logger.warning("Encryption unavailable - storing values without encryption")
            enc = None

        for field_name, new_value in body.fields.items():
            field_stmt = select(ExtractedField).where(
                ExtractedField.document_id == document_id,
                ExtractedField.field_name == field_name,
            )
            field_result = await db.execute(field_stmt)
            field = field_result.scalar_one_or_none()

            if field:
                field.original_value_encrypted = field.value_encrypted
                # Criptăm noua valoare; dacă enc nu e disponibil, stocăm ca text
                # În producție ENCRYPTION_KEY_DEFAULT trebuie setat obligatoriu
                field.value_encrypted = enc.encrypt(new_value) if enc else new_value
                field.was_corrected = True
                field.corrected_by = user.id
                field.corrected_at = datetime.now(timezone.utc)

    # Salvare training example
    from app.services.training_service import save_training_example
    import json

    await save_training_example(
        db=db,
        document_id=document_id,
        document_type=doc.document_type,
        ocr_text_encrypted=doc.raw_ocr_text_encrypted or "",
        predicted_entities_encrypted=None,
        corrected_entities_encrypted=json.dumps(body.fields) if body.fields else None,
        type_was_correct=type_was_correct,
        urgency_feedback=body.urgency_feedback,
        accountant_id=user.id,
    )

    # Audit log
    from app.services.audit_service import append_audit_log
    await append_audit_log(
        db, "field_correction", user.id, document_id,
        json.dumps({"fields": list(body.fields.keys()) if body.fields else []})
    )

    await db.commit()
    return {"status": "corrected", "document_id": str(document_id)}


@router.post("/{document_id}/reject")
async def reject_document(
    document_id: UUID,
    body: DocumentRejection,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Respinge un document."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    doc.status = "rejected"
    doc.rejection_reason = body.reason

    from app.services.audit_service import append_audit_log
    await append_audit_log(db, "document_reject", user.id, document_id, body.reason)

    await db.commit()
    return {"status": "rejected", "document_id": str(document_id)}


@router.post("/{document_id}/escalate")
async def escalate_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Escaladează documentul la manager."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    doc.status = "escalated"

    from app.services.audit_service import append_audit_log
    await append_audit_log(db, "document_escalate", user.id, document_id)

    await db.commit()
    return {"status": "escalated", "document_id": str(document_id)}

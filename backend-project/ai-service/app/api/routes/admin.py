"""
API Routes: Admin - audit log, system health.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/audit/log")
async def get_audit_log(
    action_type: Optional[str] = Query(None),
    user_id: Optional[UUID] = Query(None),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Audit trail - append-only, tamper-evident."""
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit)

    if action_type:
        stmt = stmt.where(AuditLog.action_type == action_type)
    if user_id:
        stmt = stmt.where(AuditLog.user_id == user_id)

    result = await db.execute(stmt)
    entries = result.scalars().all()

    return [
        {
            "id": str(e.id),
            "action_type": e.action_type,
            "user_id": str(e.user_id),
            "document_id": str(e.document_id) if e.document_id else None,
            "ip_address": e.ip_address,
            "timestamp": e.timestamp.isoformat(),
            "entry_hash": e.entry_hash,
        }
        for e in entries
    ]


@router.get("/audit/verify")
async def verify_audit(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Verifică integritatea lanțului audit (blockchain-style)."""
    return await verify_audit_chain(db)


@router.get("/system/health")
async def system_health(
    admin: User = Depends(require_role("admin", "manager")),
):
    """Health check complet - service + modele + componente."""
    health = {
        "status": "ok",
        "database": "unknown",
        "redis": "unknown",
        "ocr_engine": "unknown",
        "classifier_model": "unknown",
        "ner_model": "unknown",
        "urgency_model": "unknown",
        "faiss_index": "unknown",
        "celery_workers": 0,
    }

    # Database
    try:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await db.execute(select(1))
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {e}"
        health["status"] = "degraded"

    # Redis
    try:
        import redis
        from app.core.config import settings
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        health["redis"] = "connected"
    except Exception:
        health["redis"] = "disconnected"
        health["status"] = "degraded"

    # OCR
    try:
        from app.processors.ocr_processor import ocr_processor
        health["ocr_engine"] = "loaded" if ocr_processor._ocr_engine else "ready (lazy)"
    except Exception:
        health["ocr_engine"] = "error"

    # Models
    try:
        from app.processors.classifier import document_classifier
        health["classifier_model"] = "ml_loaded" if document_classifier._model_loaded else "keyword_fallback"
    except Exception:
        health["classifier_model"] = "error"

    try:
        from app.processors.ner_extractor import ner_extractor
        health["ner_model"] = "ml_loaded" if ner_extractor._model_loaded else "regex_fallback"
    except Exception:
        health["ner_model"] = "error"

    try:
        from app.processors.urgency_scorer import urgency_scorer
        health["urgency_model"] = "ml_loaded" if urgency_scorer._ml_loaded else "rule_based"
    except Exception:
        health["urgency_model"] = "error"

    # FAISS
    try:
        from app.processors.recommender import document_recommender
        stats = document_recommender.get_stats()
        health["faiss_index"] = f"{stats['total_documents']} documents"
    except Exception:
        health["faiss_index"] = "not_loaded"

    # Celery workers
    try:
        from app.tasks.celery_app import celery_app
        inspect = celery_app.control.inspect()
        active = inspect.active()
        health["celery_workers"] = len(active) if active else 0
    except Exception:
        health["celery_workers"] = 0

    return health

"""
API Routes: Queue management - statistici, assignment.
"""

from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role, get_company_filter
from app.models.user import User
from app.models.document import Document
from app.schemas.document import QueueStats

router = APIRouter(prefix="/queue", tags=["Queue"])


@router.get("/stats", response_model=QueueStats)
async def get_queue_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Statistici despre queue-ul de documente."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Total pending
    pending_stmt = select(func.count(Document.id)).where(
        Document.company_id == company_id,
        Document.status.in_(["pending_approval", "requires_manual_completion", "duplicate_detected"]),
    )
    total_pending = (await db.execute(pending_stmt)).scalar() or 0

    # Total in review
    review_stmt = select(func.count(Document.id)).where(
        Document.company_id == company_id,
        Document.status == "in_review",
    )
    total_in_review = (await db.execute(review_stmt)).scalar() or 0

    # Approved today
    approved_stmt = select(func.count(Document.id)).where(
        Document.company_id == company_id,
        Document.status == "approved",
        Document.approved_at >= today_start,
    )
    total_approved = (await db.execute(approved_stmt)).scalar() or 0

    # Rejected today
    rejected_stmt = select(func.count(Document.id)).where(
        Document.company_id == company_id,
        Document.status == "rejected",
        Document.updated_at >= today_start,
    )
    total_rejected = (await db.execute(rejected_stmt)).scalar() or 0

    # Average urgency
    avg_stmt = select(func.avg(Document.urgency_score)).where(
        Document.company_id == company_id,
        Document.status.in_(["pending_approval", "requires_manual_completion"]),
    )
    avg_urgency = (await db.execute(avg_stmt)).scalar() or 0.0

    return QueueStats(
        total_pending=total_pending,
        total_in_review=total_in_review,
        total_approved_today=total_approved,
        total_rejected_today=total_rejected,
        avg_urgency=round(avg_urgency, 2),
        avg_processing_time_seconds=None,
    )


@router.put("/{document_id}/assign")
async def assign_document(
    document_id: UUID,
    accountant_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Asignează un document unui contabil."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    # Verifică că contabilul există și e din aceeași companie
    acc_stmt = select(User).where(
        User.id == accountant_id,
        User.company_id == company_id,
        User.role.in_(["contabil", "manager"]),
    )
    acc_result = await db.execute(acc_stmt)
    if not acc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Contabil negăsit")

    doc.assigned_to = accountant_id
    await db.commit()

    return {"status": "assigned", "document_id": str(document_id), "assigned_to": str(accountant_id)}

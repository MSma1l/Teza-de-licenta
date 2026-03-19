"""
API Routes: Rapoarte contabile.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role, get_company_filter
from app.models.user import User
from app.models.document import Document

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/journal")
async def accounting_journal(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Export jurnal contabil pentru o perioadă."""
    stmt = select(Document).where(
        Document.company_id == company_id,
        Document.status == "approved",
    )

    if start_date:
        stmt = stmt.where(Document.approved_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        stmt = stmt.where(Document.approved_at <= datetime.combine(end_date, datetime.max.time()))

    stmt = stmt.order_by(Document.approved_at)
    result = await db.execute(stmt)
    docs = result.scalars().all()

    entries = []
    for doc in docs:
        entries.append({
            "document_id": str(doc.id),
            "date": doc.approved_at.isoformat() if doc.approved_at else None,
            "document_type": doc.document_type,
            "filename": doc.original_filename,
            "urgency_score": doc.urgency_score,
        })

    return {
        "period": {
            "start": start_date.isoformat() if start_date else None,
            "end": end_date.isoformat() if end_date else None,
        },
        "total_entries": len(entries),
        "entries": entries,
    }


@router.get("/summary")
async def period_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("contabil", "manager", "admin")),
    company_id: UUID = Depends(get_company_filter),
):
    """Statistici sumare pe perioadă."""
    base = select(Document).where(Document.company_id == company_id)

    if start_date:
        base = base.where(Document.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        base = base.where(Document.created_at <= datetime.combine(end_date, datetime.max.time()))

    # Total per status
    status_stmt = select(
        Document.status,
        func.count(Document.id),
    ).where(Document.company_id == company_id).group_by(Document.status)
    status_result = await db.execute(status_stmt)
    status_counts = {row[0]: row[1] for row in status_result}

    # Total per document type
    type_stmt = select(
        Document.document_type,
        func.count(Document.id),
    ).where(
        Document.company_id == company_id,
        Document.document_type.isnot(None),
    ).group_by(Document.document_type)
    type_result = await db.execute(type_stmt)
    type_counts = {row[0]: row[1] for row in type_result}

    # Average confidence
    avg_conf = (await db.execute(
        select(func.avg(Document.avg_ocr_confidence)).where(
            Document.company_id == company_id,
        )
    )).scalar() or 0.0

    return {
        "by_status": status_counts,
        "by_document_type": type_counts,
        "avg_ocr_confidence": round(avg_conf, 4),
        "total_documents": sum(status_counts.values()),
    }

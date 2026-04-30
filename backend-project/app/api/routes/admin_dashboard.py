"""
Endpoint-uri pentru Admin Dashboard — agregari care nu existau in alte routere.
Toate cer rol ADMIN sau SUPER_ADMIN.
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.accountant_client import AccountantClient
from app.models.audit_log import AuditLog
from app.api.deps import require_role

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/users-by-role")
def stats_users_by_role(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Numarul de utilizatori grupati pe rol."""
    rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    by_role = {role: count for role, count in rows}
    total = sum(by_role.values())
    return {
        "total": total,
        "admin": by_role.get(UserRole.ADMIN.value, 0) + by_role.get(UserRole.SUPER_ADMIN.value, 0),
        "contabil": by_role.get(UserRole.CONTABIL.value, 0),
        "client": by_role.get(UserRole.CLIENT.value, 0),
    }


@router.get("/documents-stats")
def stats_documents(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Numarul de documente grupate pe status si pe tip."""
    total = db.query(func.count(Document.id)).scalar() or 0

    by_status_rows = db.query(Document.status, func.count(Document.id)).group_by(Document.status).all()
    by_type_rows = db.query(Document.document_type, func.count(Document.id)).group_by(Document.document_type).all()

    return {
        "total": total,
        "by_status": {status: count for status, count in by_status_rows},
        "by_type": {dtype: count for dtype, count in by_type_rows},
    }


@router.get("/documents-timeseries")
def stats_documents_timeseries(
    days: int = 7,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Cate documente s-au creat pe fiecare din ultimele `days` zile."""
    days = max(1, min(days, 90))
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # group by date(created_at)
    rows = (
        db.query(func.date(Document.created_at).label("zi"), func.count(Document.id))
        .filter(Document.created_at >= cutoff)
        .group_by("zi")
        .all()
    )
    counts_by_date = {str(zi): count for zi, count in rows}

    # umplu zilele lipsa cu 0 pentru un grafic continuu
    today = datetime.now(timezone.utc).date()
    series = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        series.append({"date": day.isoformat(), "count": counts_by_date.get(day.isoformat(), 0)})

    return {"days": days, "series": series}


@router.get("/audit-log")
def stats_audit_log(
    user_id: str | None = None,
    limit: int = 50,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Audit log — optional filtrat pe user_id. Folosit de Dashboard si UserDetailModal.

    Duplica functional /admin/audit/log din AI service, dar evita type-mismatch UUID
    intre serviciul AI (UUID columns) si DB-ul real (varchar(36) din main backend)."""
    limit = max(1, min(limit, 500))
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    rows = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "action_type": r.action_type,
            "user_id": r.user_id,
            "document_id": r.document_id,
            "ip_address": r.ip_address,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "entry_hash": r.entry_hash,
        }
        for r in rows
    ]


@router.get("/top-contabili")
def stats_top_contabili(
    limit: int = 5,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Top contabili dupa numarul de clienti activi."""
    limit = max(1, min(limit, 50))
    rows = (
        db.query(
            User.id,
            User.username,
            User.full_name,
            func.count(AccountantClient.client_id).label("nr_clienti"),
        )
        .outerjoin(
            AccountantClient,
            (AccountantClient.accountant_id == User.id) & (AccountantClient.is_active == True),
        )
        .filter(User.role == UserRole.CONTABIL)
        .group_by(User.id, User.username, User.full_name)
        .order_by(func.count(AccountantClient.client_id).desc())
        .limit(limit)
        .all()
    )

    return {
        "top": [
            {
                "id": uid,
                "username": uname,
                "full_name": fname,
                "client_count": int(count),
            }
            for uid, uname, fname, count in rows
        ]
    }

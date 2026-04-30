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
from app.models.document import Document, DocumentStatus
from app.models.accountant_client import AccountantClient
from app.models.audit_log import AuditLog
from app.models.report import Report
from app.models.faq import ChatConversation, ChatMessage
from app.models.consultation_request import ConsultationRequest, ConsultationStatus
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


@router.get("/staff-activity")
def staff_activity(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Activitate detaliata pentru fiecare CONTABIL si RECEPTIONIST.
    Returnat ca doua liste paralele (contabili / receptionisti) — admin
    monitorizeaza productivitatea fiecaruia.
    """
    # === CONTABILI ===
    contabili = db.query(User).filter(User.role == UserRole.CONTABIL).all()
    contabili_out = []
    for c in contabili:
        client_ids_rows = db.query(AccountantClient.client_id).filter(
            AccountantClient.accountant_id == c.id,
            AccountantClient.is_active == True,
        ).all()
        client_ids = [r[0] for r in client_ids_rows]

        if client_ids:
            docs_aprobate = db.query(func.count(Document.id)).filter(
                Document.owner_id.in_(client_ids),
                Document.status == DocumentStatus.APROBAT.value,
            ).scalar() or 0
            docs_pending = db.query(func.count(Document.id)).filter(
                Document.owner_id.in_(client_ids),
                Document.status.in_([
                    DocumentStatus.INCARCAT.value,
                    DocumentStatus.IN_PROCESARE.value,
                    DocumentStatus.OCR_COMPLET.value,
                    DocumentStatus.CLASIFICAT.value,
                    DocumentStatus.EXTRAS.value,
                    DocumentStatus.PENDING_APPROVAL.value,
                ])
            ).scalar() or 0
        else:
            docs_aprobate = docs_pending = 0

        rapoarte_total = db.query(func.count(Report.id)).filter(Report.created_by == c.id).scalar() or 0
        chat_raspunse = db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.sender_type == "contabil",
            ChatMessage.conversation_id.in_(
                db.query(ChatConversation.id).filter(ChatConversation.escalated_to == c.id)
            )
        ).scalar() or 0

        contabili_out.append({
            "id": c.id,
            "username": c.username,
            "full_name": c.full_name,
            "is_active": c.is_active,
            "last_login": c.last_login.isoformat() if c.last_login else None,
            "clienti_asignati": len(client_ids),
            "documente_aprobate": int(docs_aprobate),
            "documente_in_lucru": int(docs_pending),
            "rapoarte_create": int(rapoarte_total),
            "chat_raspunse": int(chat_raspunse),
        })

    # === RECEPTIONISTI ===
    receptionisti = db.query(User).filter(User.role == UserRole.RECEPTIONIST).all()
    receptionisti_out = []
    for r in receptionisti:
        cereri_total = db.query(func.count(ConsultationRequest.id)).filter(
            ConsultationRequest.assigned_to == r.id
        ).scalar() or 0
        cereri_inchise = db.query(func.count(ConsultationRequest.id)).filter(
            ConsultationRequest.assigned_to == r.id,
            ConsultationRequest.status.in_([ConsultationStatus.INCHIS_OK.value, ConsultationStatus.INCHIS_RESPINS.value]),
        ).scalar() or 0
        chat_raspunse = db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.sender_type == "contabil",  # receptionist replies are stored as 'contabil' for now
            ChatMessage.conversation_id.in_(
                db.query(ChatConversation.id).filter(ChatConversation.escalated_to == r.id)
            )
        ).scalar() or 0

        receptionisti_out.append({
            "id": r.id,
            "username": r.username,
            "full_name": r.full_name,
            "is_active": r.is_active,
            "last_login": r.last_login.isoformat() if r.last_login else None,
            "cereri_preluate": int(cereri_total),
            "cereri_inchise": int(cereri_inchise),
            "chat_raspunse": int(chat_raspunse),
        })

    # === Cereri consultatie agregate ===
    consultatii_status = (
        db.query(ConsultationRequest.status, func.count(ConsultationRequest.id))
        .group_by(ConsultationRequest.status)
        .all()
    )
    consultatii_total = sum(c for _, c in consultatii_status)
    consultatii_by_status = {s: c for s, c in consultatii_status}

    return {
        "contabili": contabili_out,
        "receptionisti": receptionisti_out,
        "consultatii": {
            "total": consultatii_total,
            "by_status": consultatii_by_status,
        },
    }


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

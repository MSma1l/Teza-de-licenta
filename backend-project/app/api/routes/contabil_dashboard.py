"""
Endpoint-uri pentru ContabilDashboard — agregari pentru pagina principala
a contabilului. Toate cer rolul CONTABIL (sau ADMIN/SUPER_ADMIN pentru debug).
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document, DocumentStatus
from app.models.accountant_client import AccountantClient
from app.models.report import Report
from app.models.faq import ChatConversation
from app.api.deps import require_role

router = APIRouter(prefix="/contabil/dashboard", tags=["Contabil Dashboard"])


def _client_ids_for(db: Session, contabil_id: str) -> list[str]:
    """Lista id-urilor clientilor activi asignati la acest contabil."""
    rows = db.query(AccountantClient.client_id).filter(
        AccountantClient.accountant_id == contabil_id,
        AccountantClient.is_active == True,
    ).all()
    return [r[0] for r in rows]


@router.get("/overview")
def contabil_overview(
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Statistici generale pentru pagina de start a contabilului."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)

    # Numar clienti
    nr_clienti = len(client_ids)

    # Documente (toate clientilor) — split pe statusuri relevante
    if client_ids:
        docs_q = db.query(Document).filter(Document.owner_id.in_(client_ids))
        nr_total_docs = docs_q.count()
        nr_in_coada = docs_q.filter(
            Document.status.in_([
                DocumentStatus.INCARCAT.value,
                DocumentStatus.IN_PROCESARE.value,
                DocumentStatus.OCR_COMPLET.value,
                DocumentStatus.CLASIFICAT.value,
                DocumentStatus.EXTRAS.value,
                DocumentStatus.PENDING_APPROVAL.value,
            ])
        ).count()
        nr_aprobate = docs_q.filter(Document.status == DocumentStatus.APROBAT.value).count()
        nr_flagged = docs_q.filter(Document.has_flagged_fields == True).count()
    else:
        nr_total_docs = nr_in_coada = nr_aprobate = nr_flagged = 0

    # Rapoarte create de contabil
    nr_rapoarte = db.query(Report).filter(Report.created_by == cid).count()

    # Conversatii escaladate (deschise) catre acest contabil sau orice contabil
    nr_escalated_open = (
        db.query(ChatConversation)
        .filter(ChatConversation.is_escalated == True, ChatConversation.is_resolved == False)
        .count()
    )

    return {
        "clienti": nr_clienti,
        "documente_total": nr_total_docs,
        "documente_coada": nr_in_coada,
        "documente_aprobate": nr_aprobate,
        "documente_flagged": nr_flagged,
        "rapoarte_create": nr_rapoarte,
        "chat_escalated_open": nr_escalated_open,
    }


@router.get("/clienti")
def contabil_clienti(
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Listă clienti asignati cu un mini-rezumat (nr documente, ultimul activ)."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)
    if not client_ids:
        return {"clienti": []}

    clienti = db.query(User).filter(User.id.in_(client_ids)).all()

    # Numar documente per client
    docs_count_rows = (
        db.query(Document.owner_id, func.count(Document.id))
        .filter(Document.owner_id.in_(client_ids))
        .group_by(Document.owner_id)
        .all()
    )
    docs_per_client = {oid: count for oid, count in docs_count_rows}

    rezultate = []
    for c in clienti:
        rezultate.append({
            "id": c.id,
            "username": c.username,
            "full_name": c.full_name,
            "email": c.email,
            "documents_count": docs_per_client.get(c.id, 0),
            "last_login": c.last_login.isoformat() if c.last_login else None,
        })

    # Sortare: cei cu cele mai multe documente sus
    rezultate.sort(key=lambda x: x["documents_count"], reverse=True)
    return {"clienti": rezultate}


@router.get("/coada-urgente")
def contabil_coada_urgente(
    limit: int = 5,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Top documente urgente din coada clientilor."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)
    if not client_ids:
        return {"documente": []}

    docs = (
        db.query(Document)
        .filter(Document.owner_id.in_(client_ids))
        .filter(Document.status.in_([
            DocumentStatus.INCARCAT.value,
            DocumentStatus.IN_PROCESARE.value,
            DocumentStatus.OCR_COMPLET.value,
            DocumentStatus.CLASIFICAT.value,
            DocumentStatus.EXTRAS.value,
            DocumentStatus.PENDING_APPROVAL.value,
        ]))
        .order_by(Document.urgency_score.desc().nullslast(), Document.created_at.desc())
        .limit(max(1, min(limit, 20)))
        .all()
    )

    return {
        "documente": [
            {
                "id": d.id,
                "title": d.title,
                "document_type": d.document_type.value if hasattr(d.document_type, 'value') else d.document_type,
                "status": d.status.value if hasattr(d.status, 'value') else d.status,
                "urgency_score": d.urgency_score or 0.0,
                "owner_id": d.owner_id,
                "has_flagged_fields": d.has_flagged_fields,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]
    }


@router.get("/timeseries")
def contabil_timeseries(
    days: int = 7,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Documente procesate (status APROBAT) in ultimele N zile pentru clientii contabilului."""
    days = max(1, min(days, 90))
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)
    if not client_ids:
        return {"days": days, "series": [{"date": (datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat(), "count": 0} for i in range(days - 1, -1, -1)]}

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(Document.created_at).label("zi"), func.count(Document.id))
        .filter(Document.owner_id.in_(client_ids))
        .filter(Document.created_at >= cutoff)
        .group_by("zi")
        .all()
    )
    counts_by_date = {str(zi): count for zi, count in rows}

    today = datetime.now(timezone.utc).date()
    series = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        series.append({"date": day.isoformat(), "count": counts_by_date.get(day.isoformat(), 0)})

    return {"days": days, "series": series}

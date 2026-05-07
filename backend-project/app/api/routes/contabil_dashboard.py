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
from app.models.audit_log import AuditLog
from app.api.deps import require_role
from fastapi import HTTPException
from pydantic import BaseModel

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


@router.get("/performance")
def contabil_performance(
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Performance contabil: saptamana asta vs saptamana trecuta."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    last_week_start = week_start - timedelta(days=7)

    def _count_docs(start: datetime, end: datetime) -> int:
        if not client_ids:
            return 0
        return db.query(func.count(Document.id)).filter(
            Document.owner_id.in_(client_ids),
            Document.created_at >= start,
            Document.created_at < end,
        ).scalar() or 0

    def _count_aprobate(start: datetime, end: datetime) -> int:
        if not client_ids:
            return 0
        return db.query(func.count(Document.id)).filter(
            Document.owner_id.in_(client_ids),
            Document.status == DocumentStatus.APROBAT.value,
            Document.created_at >= start,
            Document.created_at < end,
        ).scalar() or 0

    def _count_rapoarte(start: datetime, end: datetime) -> int:
        return db.query(func.count(Report.id)).filter(
            Report.created_by == cid,
            Report.created_at >= start,
            Report.created_at < end,
        ).scalar() or 0

    saptamana_asta = {
        "documente_noi": _count_docs(week_start, now),
        "documente_aprobate": _count_aprobate(week_start, now),
        "rapoarte_create": _count_rapoarte(week_start, now),
    }
    saptamana_trecuta = {
        "documente_noi": _count_docs(last_week_start, week_start),
        "documente_aprobate": _count_aprobate(last_week_start, week_start),
        "rapoarte_create": _count_rapoarte(last_week_start, week_start),
    }

    def _delta_pct(curr: int, prev: int) -> int | None:
        if prev == 0:
            return None if curr == 0 else 100
        return round(((curr - prev) / prev) * 100)

    return {
        "saptamana_asta": saptamana_asta,
        "saptamana_trecuta": saptamana_trecuta,
        "delta_pct": {
            "documente_noi": _delta_pct(saptamana_asta["documente_noi"], saptamana_trecuta["documente_noi"]),
            "documente_aprobate": _delta_pct(saptamana_asta["documente_aprobate"], saptamana_trecuta["documente_aprobate"]),
            "rapoarte_create": _delta_pct(saptamana_asta["rapoarte_create"], saptamana_trecuta["rapoarte_create"]),
        },
    }


@router.get("/activity-feed")
def contabil_activity_feed(
    limit: int = 15,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Activitate recenta la clientii contabilului — documente noi, status changes, audit log."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)
    if not client_ids:
        return {"events": []}

    limit = max(1, min(limit, 50))

    # Documente create / status schimbat in ultimele 7 zile
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    docs = (
        db.query(Document)
        .filter(Document.owner_id.in_(client_ids))
        .filter(Document.created_at >= cutoff)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .all()
    )
    # Mapa client id → nume
    clients = db.query(User).filter(User.id.in_(client_ids)).all()
    cmap = {c.id: (c.full_name or c.username) for c in clients}

    events = []
    for d in docs:
        events.append({
            "type": "document_uploaded",
            "title": d.title or d.file_name,
            "client_name": cmap.get(d.owner_id, "—"),
            "owner_id": d.owner_id,
            "document_id": d.id,
            "status": d.status.value if hasattr(d.status, 'value') else d.status,
            "timestamp": d.created_at.isoformat() if d.created_at else None,
        })

    return {"events": events}


@router.get("/inactive-clients")
def contabil_inactive_clients(
    days_threshold: int = 14,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Clienti care nu au urcat documente noi de mai mult de N zile."""
    cid = current_user.id
    client_ids = _client_ids_for(db, cid)
    if not client_ids:
        return {"inactive": [], "threshold_days": days_threshold}

    cutoff = datetime.now(timezone.utc) - timedelta(days=days_threshold)
    clients = db.query(User).filter(User.id.in_(client_ids)).all()

    # Pentru fiecare client, ultima data cand a urcat ceva
    last_doc_rows = (
        db.query(Document.owner_id, func.max(Document.created_at))
        .filter(Document.owner_id.in_(client_ids))
        .group_by(Document.owner_id)
        .all()
    )
    last_by_client = {oid: dt for oid, dt in last_doc_rows}

    inactive = []
    for c in clients:
        ultim = last_by_client.get(c.id)
        if not ultim or ultim < cutoff:
            zile = (datetime.now(timezone.utc) - ultim).days if ultim else None
            inactive.append({
                "id": c.id,
                "username": c.username,
                "full_name": c.full_name,
                "email": c.email,
                "last_doc_at": ultim.isoformat() if ultim else None,
                "days_since_last": zile,
            })

    inactive.sort(key=lambda x: x["days_since_last"] if x["days_since_last"] is not None else 999, reverse=True)
    return {"inactive": inactive, "threshold_days": days_threshold}


# === Note interne pe client ===

class ClientNotesUpdate(BaseModel):
    notes: str


@router.get("/client/{client_id}/notes")
def get_client_notes(
    client_id: str,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Note interne pe care contabilul le-a notat pentru un client."""
    link = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == current_user.id,
        AccountantClient.client_id == client_id,
        AccountantClient.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Clientul nu este asignat contabilului")
    return {"notes": link.internal_notes or "", "updated_at": link.updated_at.isoformat() if link.updated_at else None}


@router.put("/client/{client_id}/notes")
def set_client_notes(
    client_id: str,
    data: ClientNotesUpdate,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Salveaza note interne pentru un client (preferinte, particularitati fiscale, contact)."""
    link = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == current_user.id,
        AccountantClient.client_id == client_id,
        AccountantClient.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Clientul nu este asignat contabilului")
    link.internal_notes = data.notes
    db.commit()
    return {"status": "ok", "notes": link.internal_notes}


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

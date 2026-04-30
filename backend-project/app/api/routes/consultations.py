"""
Endpoint-uri pentru cereri de consultatie (formular public + panou receptionist).

Public:
  POST /consultations             — orice vizitator submite formular
Receptionist/admin:
  GET  /consultations             — lista cu filtru pe status
  GET  /consultations/{id}        — detalii
  PATCH /consultations/{id}       — schimba status / note / preia
  DELETE /consultations/{id}      — sterge (admin only)
"""
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.consultation_request import ConsultationRequest, ConsultationStatus
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.api.deps import get_current_user, require_role


router = APIRouter(tags=["Consultatii"])


# === Schemas ===

class ConsultationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    company_name: str | None = Field(default=None, max_length=200)
    message: str | None = None


class ConsultationUpdate(BaseModel):
    status: Literal["noua", "in_lucru", "contactat", "programat", "inchis_ok", "inchis_respins"] | None = None
    internal_notes: str | None = None
    assigned_to: str | None = None


class ConsultationResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str | None
    company_name: str | None
    message: str | None
    status: str
    assigned_to: str | None
    internal_notes: str | None
    source_ip: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Public endpoint ===

@router.post("/consultations", response_model=ConsultationResponse, status_code=201)
def create_consultation(
    data: ConsultationCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Public — orice vizitator de pe pagina poate trimite o cerere de consultatie."""
    ip = request.client.host if request.client else None

    cr = ConsultationRequest(
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=(data.phone or "").strip() or None,
        company_name=(data.company_name or "").strip() or None,
        message=(data.message or "").strip() or None,
        status=ConsultationStatus.NOUA,
        source_ip=ip,
    )
    db.add(cr)
    db.flush()

    # Creeaza notificare pentru toti receptionistii activi
    receptionists = db.query(User).filter(
        User.role == UserRole.RECEPTIONIST,
        User.is_active == True,
    ).all()
    for r in receptionists:
        db.add(Notification(
            user_id=r.id,
            title="Cerere noua de consultatie",
            message=f"{cr.full_name} ({cr.email}) — {cr.company_name or 'fara companie'}",
            notification_type=NotificationType.URGENT,
        ))

    db.commit()
    db.refresh(cr)
    return cr


# === Receptionist / admin endpoints ===

def _allowed_staff(current_user: User) -> bool:
    role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    return role in ("receptionist", "admin", "super_admin")


@router.get("/consultations", response_model=list[ConsultationResponse])
def list_consultations(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _allowed_staff(current_user):
        raise HTTPException(status_code=403, detail="Doar receptionistii si adminii pot vedea cereri")
    query = db.query(ConsultationRequest)
    if status_filter:
        query = query.filter(ConsultationRequest.status == status_filter)
    return query.order_by(ConsultationRequest.created_at.desc()).limit(limit).all()


@router.get("/consultations/{consultation_id}", response_model=ConsultationResponse)
def get_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _allowed_staff(current_user):
        raise HTTPException(status_code=403, detail="Acces restrictionat")
    cr = db.query(ConsultationRequest).filter(ConsultationRequest.id == consultation_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Cerere negasita")
    return cr


@router.patch("/consultations/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(
    consultation_id: str,
    data: ConsultationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _allowed_staff(current_user):
        raise HTTPException(status_code=403, detail="Acces restrictionat")
    cr = db.query(ConsultationRequest).filter(ConsultationRequest.id == consultation_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Cerere negasita")

    if data.status is not None:
        try:
            cr.status = ConsultationStatus(data.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Status invalid: {data.status}")
    if data.internal_notes is not None:
        cr.internal_notes = data.internal_notes
    if data.assigned_to is not None:
        cr.assigned_to = data.assigned_to or None

    cr.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cr)
    return cr


@router.delete("/consultations/{consultation_id}", status_code=204)
def delete_consultation(
    consultation_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    cr = db.query(ConsultationRequest).filter(ConsultationRequest.id == consultation_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Cerere negasita")
    db.delete(cr)
    db.commit()
    return None

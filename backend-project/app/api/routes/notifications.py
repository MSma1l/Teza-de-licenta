from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Literal

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.models.accountant_client import AccountantClient
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/notifications", tags=["Notificări"])


class CreateNotificationRequest(BaseModel):
    user_id: str
    title: str = Field(min_length=2, max_length=300)
    message: str = Field(min_length=2)
    notification_type: Literal["URGENT", "WARNING", "INFO", "urgent", "warning", "info"] = "INFO"


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: CreateNotificationRequest,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Contabilul/admin trimite o notificare unui user (solicitare acte, anunt, etc.)."""
    target = db.query(User).filter(User.id == data.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Utilizator destinatar negasit")

    # Contabilul poate notifica DOAR clientii sai. Admin poate notifica pe oricine.
    if current_user.role == UserRole.CONTABIL:
        link = db.query(AccountantClient).filter(
            AccountantClient.accountant_id == current_user.id,
            AccountantClient.client_id == data.user_id,
            AccountantClient.is_active == True,
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Poti notifica doar clientii asignati tie")

    try:
        ntype = NotificationType(data.notification_type.lower())
    except ValueError:
        ntype = NotificationType.INFO

    notif = Notification(
        user_id=target.id,
        title=data.title,
        message=data.message,
        notification_type=ntype,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.get("/", response_model=NotificationListResponse)
def list_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = query.count()
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return NotificationListResponse(notifications=notifications, total=total)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificarea nu a fost găsită")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "Toate notificările au fost marcate ca citite"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificarea nu a fost găsită")

    db.delete(notif)
    db.commit()

"""
QR Login API - similar WhatsApp Web.

Endpoints:
- POST /qr-login/initiate         (PUBLIC)  -> creeaza sesiune, primeste qr_token + session_token
- GET  /qr-login/qr/{qr_token}    (PUBLIC)  -> imaginea PNG cu QR
- GET  /qr-login/status/{token}   (PUBLIC)  -> polling: pending / approved + tokens
- POST /qr-login/approve          (AUTH)    -> mobile aproba sesiunea
- POST /qr-login/reject           (AUTH)    -> mobile respinge sesiunea
"""
import io
import secrets
from datetime import datetime, timezone

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.api.deps import get_current_user
from app.models.user import User
from app.models.qr_login import QRLoginSession

router = APIRouter(prefix="/qr-login", tags=["QR Login"])


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class InitiateResponse(BaseModel):
    session_token: str
    qr_token: str
    expires_at: datetime


class StatusResponse(BaseModel):
    status: str  # 'pending' | 'approved' | 'expired' | 'rejected'
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"


class ApproveRequest(BaseModel):
    qr_token: str = Field(min_length=10, max_length=80)


@router.post("/initiate", response_model=InitiateResponse)
def initiate_qr_login(request: Request, db: Session = Depends(get_db)):
    """Browser-ul (anonim) initiaza o sesiune QR."""
    session_token = secrets.token_urlsafe(32)
    qr_token = secrets.token_urlsafe(24)

    ip = (request.client.host if request.client else "unknown")[:45]
    ua = (request.headers.get("user-agent") or "")[:500]

    sess = QRLoginSession(
        session_token=session_token,
        qr_token=qr_token,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    return InitiateResponse(
        session_token=sess.session_token,
        qr_token=sess.qr_token,
        expires_at=sess.expires_at,
    )


@router.get("/qr/{qr_token}")
def get_qr_image(qr_token: str, db: Session = Depends(get_db)):
    """PNG cu QR-ul pentru sesiunea de login. Public."""
    sess = db.query(QRLoginSession).filter(QRLoginSession.qr_token == qr_token).first()
    if not sess:
        raise HTTPException(status_code=404, detail="QR negasit")

    payload = f"aicontabil://login/{qr_token}"
    img = qrcode.make(payload, box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/status/{session_token}", response_model=StatusResponse)
def get_login_status(session_token: str, db: Session = Depends(get_db)):
    """Browser-ul polleaza statusul. Cand e aprobat, primeste tokens."""
    sess = (
        db.query(QRLoginSession)
        .filter(QRLoginSession.session_token == session_token)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Sesiune negasita")

    now = datetime.now(timezone.utc)
    if not sess.is_approved and _aware(sess.expires_at) < now:
        sess.is_expired = True
        db.commit()
        return StatusResponse(status="expired")

    if sess.is_expired:
        return StatusResponse(status="expired")

    if not sess.is_approved or not sess.user_id:
        return StatusResponse(status="pending")

    if sess.is_consumed:
        return StatusResponse(status="expired")

    # Aprobat - genereaza tokens si marcheaza ca consumed (one-time use)
    user = db.query(User).filter(User.id == sess.user_id).first()
    if not user or not user.is_active:
        sess.is_expired = True
        db.commit()
        return StatusResponse(status="expired")

    token_data = {"sub": user.id, "role": user.role}
    access = create_access_token(token_data)
    refresh = create_refresh_token(token_data)

    sess.is_consumed = True
    db.commit()

    return StatusResponse(
        status="approved",
        access_token=access,
        refresh_token=refresh,
    )


@router.post("/approve")
def approve_qr_login(
    data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mobile (logat) aproba sesiunea QR scanata."""
    raw = data.qr_token.strip()
    if raw.startswith("aicontabil://login/"):
        raw = raw.replace("aicontabil://login/", "")

    sess = db.query(QRLoginSession).filter(QRLoginSession.qr_token == raw).first()
    if not sess:
        raise HTTPException(status_code=404, detail="QR invalid")

    now = datetime.now(timezone.utc)
    if _aware(sess.expires_at) < now:
        sess.is_expired = True
        db.commit()
        raise HTTPException(status_code=410, detail="QR-ul a expirat")

    if sess.is_approved or sess.is_consumed:
        raise HTTPException(status_code=409, detail="Sesiunea a fost deja folosita")

    sess.is_approved = True
    sess.user_id = current_user.id
    sess.approved_at = now
    db.commit()

    return {
        "success": True,
        "message": "Logare aprobata. Browser-ul va fi autentificat in cateva secunde.",
        "device_info": {
            "ip": sess.ip_address,
            "user_agent": sess.user_agent,
        },
    }


@router.post("/reject")
def reject_qr_login(
    data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mobile respinge sesiunea QR scanata."""
    raw = data.qr_token.strip()
    if raw.startswith("aicontabil://login/"):
        raw = raw.replace("aicontabil://login/", "")

    sess = db.query(QRLoginSession).filter(QRLoginSession.qr_token == raw).first()
    if not sess:
        raise HTTPException(status_code=404, detail="QR invalid")

    sess.is_expired = True
    db.commit()
    return {"success": True, "message": "Sesiunea a fost respinsa"}

"""
Two-Factor Authentication API - cu suport pentru cod numeric SAU QR scan.

Endpoint-uri:
- POST /2fa/request          -> Web cere o provocare, primeste cod 10-99 + qr_token
- GET  /2fa/qr/{qr_token}    -> PNG cu QR code (poate fi afisat in <img> pe Web)
- GET  /2fa/pending          -> Mobile vede provocarile in asteptare
- POST /2fa/verify           -> Mobile trimite codul introdus de user
- POST /2fa/verify-qr        -> Mobile scaneaza QR si trimite token direct
- GET  /2fa/status/{id}      -> Web verifica daca provocarea a fost confirmata
"""
import io
import random
import secrets
from datetime import datetime, timezone

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.two_factor import TwoFactorChallenge
from app.schemas.two_factor import (
    TwoFactorRequest,
    TwoFactorChallengeResponse,
    TwoFactorVerify,
    TwoFactorPendingChallenge,
    TwoFactorVerifyResponse,
)
from pydantic import BaseModel, Field

router = APIRouter(prefix="/2fa", tags=["Two-Factor Authentication"])

MAX_ATTEMPTS = 3


class TwoFactorVerifyQR(BaseModel):
    qr_token: str = Field(min_length=10, max_length=64)


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _expire_old_challenges(db: Session, user_id: str) -> None:
    """Marcheaza provocarile expirate."""
    now = datetime.now(timezone.utc)
    expirate = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.user_id == user_id,
            TwoFactorChallenge.is_expired == False,
        )
        .all()
    )
    for ch in expirate:
        if _aware(ch.expires_at) and _aware(ch.expires_at) < now:
            ch.is_expired = True
    db.commit()


@router.post("/request", response_model=TwoFactorChallengeResponse)
def request_2fa(
    data: TwoFactorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creeaza o provocare 2FA. Web primeste cod 10-99 + token QR de afisat."""
    _expire_old_challenges(db, current_user.id)

    code = random.randint(100000, 999999)
    qr_token = secrets.token_urlsafe(32)
    challenge = TwoFactorChallenge(
        user_id=current_user.id,
        code=code,
        qr_token=qr_token,
        action_type=data.action_type,
        action_description=data.action_description,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return TwoFactorChallengeResponse(
        challenge_id=challenge.id,
        code=challenge.code,
        qr_token=challenge.qr_token,
        expires_at=challenge.expires_at,
        action_type=challenge.action_type,
        action_description=challenge.action_description,
    )


@router.get("/qr/{qr_token}")
def get_qr_image(
    qr_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returneaza un PNG cu QR-ul provocarii. Doar owner-ul poate vedea."""
    challenge = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.qr_token == qr_token,
            TwoFactorChallenge.user_id == current_user.id,
        )
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="QR token negasit")

    # Continutul codat in QR: prefix custom + token
    qr_payload = f"aicontabil://2fa/{qr_token}"

    img = qrcode.make(qr_payload, box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/pending", response_model=list[TwoFactorPendingChallenge])
def get_pending_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mobile: lista provocarilor in asteptare pentru utilizatorul curent."""
    _expire_old_challenges(db, current_user.id)
    challenges = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.user_id == current_user.id,
            TwoFactorChallenge.is_verified == False,
            TwoFactorChallenge.is_expired == False,
        )
        .order_by(TwoFactorChallenge.created_at.desc())
        .all()
    )
    return challenges


@router.post("/verify", response_model=TwoFactorVerifyResponse)
def verify_2fa(
    data: TwoFactorVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mobile trimite codul numeric (10-99) introdus manual."""
    challenge = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.id == data.challenge_id,
            TwoFactorChallenge.user_id == current_user.id,
        )
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Provocare negasita")

    now = datetime.now(timezone.utc)
    if _aware(challenge.expires_at) < now or challenge.is_expired:
        challenge.is_expired = True
        db.commit()
        raise HTTPException(status_code=410, detail="Codul a expirat")

    if challenge.is_verified:
        raise HTTPException(status_code=409, detail="Provocarea a fost deja confirmata")

    if challenge.attempts >= MAX_ATTEMPTS:
        challenge.is_expired = True
        db.commit()
        raise HTTPException(
            status_code=429,
            detail="Prea multe incercari. Provocarea a fost anulata.",
        )

    challenge.attempts += 1
    if challenge.code != data.code:
        db.commit()
        ramase = MAX_ATTEMPTS - challenge.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Cod incorect. Mai aveti {ramase} incercari.",
        )

    challenge.is_verified = True
    challenge.verified_at = now
    db.commit()
    return TwoFactorVerifyResponse(success=True, message="Provocare confirmata cu succes")


@router.post("/verify-qr", response_model=TwoFactorVerifyResponse)
def verify_2fa_qr(
    data: TwoFactorVerifyQR,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mobile scaneaza QR si trimite token-ul.
    Acceptam si payload "aicontabil://2fa/<token>" sau token-ul direct.
    """
    raw = data.qr_token.strip()
    if raw.startswith("aicontabil://2fa/"):
        raw = raw.replace("aicontabil://2fa/", "")

    challenge = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.qr_token == raw,
            TwoFactorChallenge.user_id == current_user.id,
        )
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="QR invalid sau apartine altui utilizator")

    now = datetime.now(timezone.utc)
    if _aware(challenge.expires_at) < now or challenge.is_expired:
        challenge.is_expired = True
        db.commit()
        raise HTTPException(status_code=410, detail="QR-ul a expirat")

    if challenge.is_verified:
        raise HTTPException(status_code=409, detail="Provocarea a fost deja confirmata")

    challenge.is_verified = True
    challenge.verified_at = now
    db.commit()
    return TwoFactorVerifyResponse(success=True, message="Provocare confirmata prin QR")


@router.get("/status/{challenge_id}")
def get_challenge_status(
    challenge_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Web verifica daca provocarea a fost confirmata din mobile."""
    challenge = (
        db.query(TwoFactorChallenge)
        .filter(
            TwoFactorChallenge.id == challenge_id,
            TwoFactorChallenge.user_id == current_user.id,
        )
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Provocare negasita")

    now = datetime.now(timezone.utc)
    if not challenge.is_verified and _aware(challenge.expires_at) < now:
        challenge.is_expired = True
        db.commit()

    return {
        "verified": challenge.is_verified,
        "expired": challenge.is_expired,
        "attempts": challenge.attempts,
    }

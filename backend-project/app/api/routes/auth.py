"""
Autentificare cu rate limiting si protectie anti-brute force.

Politica de securitate:
- Max 3 incercari consecutive de parola gresita
- Lockout 2 minute dupa atingerea limitei
- Mesaje specifice: user inexistent vs parola gresita
- Tracking pe (username, ip) pentru a evita bloc de retea
- Reset counter la autentificare reusita

Note: Pentru rate limiting distribuit (mai multe instante backend),
foloseste slowapi + Redis. Aceasta implementare e suficienta pentru
un singur backend.
"""
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.models.user import User, UserRole
from app.models.login_attempt import LoginAttempt
from app.models.two_factor import TwoFactorChallenge
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

import random
import secrets

router = APIRouter(prefix="/auth", tags=["Autentificare"])

MAX_FAILED_ATTEMPTS = 3
LOCKOUT_MINUTES = 2


def _client_ip(request: Request) -> str:
    """Extrage IP-ul clientului. Suporta proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()[:45]
    return (request.client.host if request.client else "unknown")[:45]


def _get_or_create_attempt(db: Session, username: str, ip: str) -> LoginAttempt:
    attempt = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.username == username, LoginAttempt.ip_address == ip)
        .first()
    )
    if not attempt:
        attempt = LoginAttempt(username=username, ip_address=ip)
        db.add(attempt)
        db.flush()
    return attempt


def _aware(dt: datetime | None) -> datetime | None:
    """Asigura ca un datetime are timezone (UTC). SQLite returneaza naive datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _check_lockout(attempt: LoginAttempt) -> None:
    """Ridica HTTPException 429 daca utilizatorul e blocat."""
    now = datetime.now(timezone.utc)
    locked_until = _aware(attempt.locked_until)

    if attempt.is_locked and locked_until and locked_until > now:
        secunde_ramase = int((locked_until - now).total_seconds())
        minute = secunde_ramase // 60
        secunde = secunde_ramase % 60
        timp_str = f"{minute}m {secunde}s" if minute > 0 else f"{secunde}s"
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Prea multe incercari esuate. Asteptati {timp_str} inainte de a reincerca.",
        )
    # Daca lockout-ul a expirat, reseteaza
    if attempt.is_locked and locked_until and locked_until <= now:
        attempt.is_locked = False
        attempt.failed_count = 0
        attempt.locked_until = None


def _record_failed(db: Session, attempt: LoginAttempt) -> int:
    """Inregistreaza o incercare esuata. Returneaza incercarile ramase."""
    attempt.failed_count += 1
    attempt.last_attempt_at = datetime.now(timezone.utc)
    if attempt.failed_count >= MAX_FAILED_ATTEMPTS:
        attempt.is_locked = True
        attempt.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
    db.commit()
    return max(0, MAX_FAILED_ATTEMPTS - attempt.failed_count)


def _reset_attempts(db: Session, username: str, ip: str) -> None:
    """Sterge toate incercarile esuate dupa autentificare reusita."""
    db.query(LoginAttempt).filter(
        LoginAttempt.username == username,
        LoginAttempt.ip_address == ip,
    ).delete()
    db.commit()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Inregistrare cont nou. Pydantic valideaza schema (max_length, parola complexa)."""
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        if existing.username == data.username:
            raise HTTPException(status_code=400, detail="Username-ul este deja folosit")
        raise HTTPException(status_code=400, detail="Email-ul este deja folosit")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        phone=data.phone,
        full_name=data.full_name,
        role=UserRole.CLIENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


ROLES_REQUIRING_2FA = {UserRole.CONTABIL, UserRole.ADMIN, UserRole.SUPER_ADMIN}


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Autentificare cu mesaje clare si protectie anti-brute force.

    Erori posibile:
    - 401 "Nu exista un cont cu acest nume sau email"
    - 401 "Parola incorecta. Mai aveti X incercari."
    - 403 "Contul este dezactivat"
    - 429 "Prea multe incercari. Asteptati Xm Ys."
    """
    ip = _client_ip(request)
    username = data.username.strip()
    attempt = _get_or_create_attempt(db, username, ip)

    # Verifica daca e blocat
    _check_lockout(attempt)

    # Cauta user dupa username sau email
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    # User inexistent
    if not user:
        ramase = _record_failed(db, attempt)
        if ramase > 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Nu exista un cont cu acest nume sau email. Mai aveti {ramase} incercari.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nu exista un cont cu acest nume sau email.",
        )

    # Parola gresita
    if not verify_password(data.password, user.password_hash):
        ramase = _record_failed(db, attempt)
        if ramase > 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Parola incorecta. Mai aveti {ramase} incercari.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Parola incorecta. Contul a fost blocat pentru {LOCKOUT_MINUTES} minute.",
        )

    # Cont dezactivat
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contul este dezactivat. Contactati administratorul.",
        )

    # Succes - reset incercari
    _reset_attempts(db, username, ip)

    # Contabil/Admin/Super_Admin necesita 2FA obligatoriu
    if user.role in ROLES_REQUIRING_2FA:
        code = random.randint(100000, 999999)
        qr_token = secrets.token_urlsafe(32)
        challenge = TwoFactorChallenge(
            user_id=user.id,
            code=code,
            qr_token=qr_token,
            action_type="login_2fa",
            action_description=f"Confirmare logare ca {user.role.value}",
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        return {
            "requires_2fa": True,
            "challenge_id": challenge.id,
            "code": challenge.code,
            "qr_token": challenge.qr_token,
            "expires_at": str(challenge.expires_at),
            "message": f"Confirma logarea din aplicatia mobila. Codul: {code}",
        }

    # Client — logare directa fara 2FA
    token_data = {"sub": user.id, "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login/complete-2fa", response_model=TokenResponse)
def complete_login_2fa(challenge_id: str, db: Session = Depends(get_db)):
    """
    Finalizeaza logarea dupa ce 2FA a fost confirmat din mobile.
    Web apeleaza acest endpoint dupa ce polling-ul pe /2fa/status returneaza verified=true.
    """
    challenge = db.query(TwoFactorChallenge).filter(
        TwoFactorChallenge.id == challenge_id,
        TwoFactorChallenge.action_type == "login_2fa",
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Provocare 2FA negasita")

    if not challenge.is_verified:
        raise HTTPException(status_code=403, detail="Provocarea 2FA nu a fost inca confirmata")

    now = datetime.now(timezone.utc)
    if _aware(challenge.expires_at) and _aware(challenge.expires_at) < now:
        raise HTTPException(status_code=410, detail="Provocarea a expirat")

    user = db.query(User).filter(User.id == challenge.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilizator invalid")

    token_data = {"sub": user.id, "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(data.refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Refresh token invalid sau expirat")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilizator invalid")

    token_data = {"sub": user.id, "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Autentificare"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Verifică dacă username-ul sau email-ul există deja
    existing = db.query(User).filter((User.username == data.username) | (User.email == data.email)).first()
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


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Caută user după username sau email
    user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.username)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credențiale invalide")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Contul este dezactivat")

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

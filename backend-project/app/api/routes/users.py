from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, hash_password
from app.models.user import User, UserRole
from app.models.accountant_client import AccountantClient
from app.schemas.user import UserResponse, UserUpdateRequest, PasswordChangeRequest, UserListResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Utilizatori"])


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(data: UserUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email-ul este deja folosit")
        current_user.email = data.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
def change_password(data: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Parola curentă este incorectă")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Parolele noi nu coincid")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Parola nouă trebuie să aibă minim 6 caractere")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Parola a fost schimbată cu succes"}


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tip de fișier nepermis. Acceptăm: JPEG, PNG, WebP")

    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"Fișierul depășește limita de {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, "avatars", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)

    current_user.avatar_url = f"/storage/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


# --- Admin & Contabil routes ---

@router.get("/", response_model=UserListResponse)
def list_users(
    role: str | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CONTABIL)),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    return UserListResponse(users=users, total=total)


@router.get("/my-clients", response_model=UserListResponse)
def get_my_clients(
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Returnează lista de clienți asignați contabilului curent."""
    links = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == current_user.id,
        AccountantClient.is_active == True,
    ).all()
    client_ids = [link.client_id for link in links]
    clients = db.query(User).filter(User.id.in_(client_ids)).all() if client_ids else []
    return UserListResponse(users=clients, total=len(clients))


@router.post("/assign-client")
def assign_client(
    client_id: str,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Contabilul își asignează un client."""
    client = db.query(User).filter(User.id == client_id, User.role == UserRole.CLIENT).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client negăsit")

    existing = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == current_user.id,
        AccountantClient.client_id == client_id,
    ).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="Clientul este deja asignat")
        existing.is_active = True
        db.commit()
        return {"message": "Client reasignat cu succes"}

    link = AccountantClient(accountant_id=current_user.id, client_id=client_id)
    db.add(link)
    db.commit()
    return {"message": "Client asignat cu succes"}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CONTABIL)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")
    return user

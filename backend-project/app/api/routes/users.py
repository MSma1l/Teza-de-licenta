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
def change_password(
    data: PasswordChangeRequest,
    challenge_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Schimba parola. Necesita 2FA confirmat.

    Flux:
    1. Web cere POST /2fa/request cu action_type="change_password"
    2. Pe web apare pin-ul de 8 cifre
    3. Mobile vede provocarea si introduce pin-ul
    4. Web polleaza /2fa/status — cand verified=true, trimite change-password cu challenge_id
    """
    # Verifica 2FA daca e furnizat
    if challenge_id:
        from app.models.two_factor import TwoFactorChallenge
        challenge = db.query(TwoFactorChallenge).filter(
            TwoFactorChallenge.id == challenge_id,
            TwoFactorChallenge.user_id == current_user.id,
            TwoFactorChallenge.action_type == "change_password",
        ).first()
        if not challenge or not challenge.is_verified:
            raise HTTPException(status_code=403, detail="Provocarea 2FA nu a fost confirmata")

    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Parola curenta este incorecta")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Parolele noi nu coincid")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Parola noua trebuie sa aiba minim 8 caractere")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Parola a fost schimbata cu succes"}


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


# --- Contabili disponibili (orice user logat) ---

@router.get("/accountants", response_model=UserListResponse)
def list_accountants(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista contabililor activi — disponibili pentru asignare de catre clienti."""
    accountants = db.query(User).filter(
        User.role == UserRole.CONTABIL,
        User.is_active == True,
    ).order_by(User.full_name, User.username).all()
    return UserListResponse(users=accountants, total=len(accountants))


@router.post("/choose-accountant")
def choose_accountant(
    accountant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clientul alege un contabil. Creeaza legatura accountant-client."""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Doar clientii pot alege un contabil")

    accountant = db.query(User).filter(
        User.id == accountant_id,
        User.role == UserRole.CONTABIL,
        User.is_active == True,
    ).first()
    if not accountant:
        raise HTTPException(status_code=404, detail="Contabilul nu a fost gasit")

    # Verifica daca exista deja legatura
    existing = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == accountant_id,
        AccountantClient.client_id == current_user.id,
        AccountantClient.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Esti deja asignat la acest contabil")

    link = AccountantClient(
        accountant_id=accountant_id,
        client_id=current_user.id,
    )
    db.add(link)
    db.commit()
    return {"success": True, "message": "Contabil asignat cu succes", "accountant_id": accountant_id}


# --- Admin & Contabil routes ---

@router.get("/", response_model=UserListResponse)
def list_users(
    role: str | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTABIL)),
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


# --- Admin: schimbare rol ---

from pydantic import BaseModel, Field


class RoleChangeRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|contabil|client)$")


@router.patch("/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: str,
    data: RoleChangeRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin schimba rolul unui utilizator (promoveaza client -> contabil, etc.)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")

    # Normalizare enum — DB stocheaza UPPERCASE
    role_normalizat = data.role.upper()
    try:
        user.role = UserRole[role_normalizat]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Rol invalid: {data.role}")

    db.commit()
    db.refresh(user)
    return user


class CreateContabilRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None
    phone: str | None = None


class AdminAssignRequest(BaseModel):
    contabil_id: str
    client_id: str


class AdminResetPasswordRequest(BaseModel):
    new_password: str | None = Field(default=None, min_length=8, max_length=128)


def _generate_temp_password(length: int = 12) -> str:
    """Genereaza o parola temporara robusta: minim 1 cifra + 1 simbol + 1 majuscula."""
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + "!@#$%&*?"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in pwd) and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)):
            return pwd


@router.post("/{user_id}/admin-reset-password")
def admin_reset_password(
    user_id: str,
    data: AdminResetPasswordRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin reseteaza parola unui user. Daca nu se specifica una, o genereaza.
    Parola in clar e returnata o singura data — admin trebuie sa o transmita user-ului."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    new_password = data.new_password or _generate_temp_password()
    user.password_hash = hash_password(new_password)
    db.commit()
    return {
        "user_id": user.id,
        "username": user.username,
        "new_password": new_password,
        "message": "Parola a fost resetata. Transmite parola in mod sigur catre utilizator.",
    }


@router.post("/admin/assign-client")
def admin_assign_client(
    data: AdminAssignRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin asigneaza un CLIENT la un CONTABIL specific."""
    contabil = db.query(User).filter(
        User.id == data.contabil_id,
        User.role == UserRole.CONTABIL,
    ).first()
    if not contabil:
        raise HTTPException(status_code=404, detail="Contabil negasit")

    client = db.query(User).filter(
        User.id == data.client_id,
        User.role == UserRole.CLIENT,
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client negasit")

    # reactivate daca exista deja inactive
    existing = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == contabil.id,
        AccountantClient.client_id == client.id,
    ).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="Clientul este deja asignat acestui contabil")
        existing.is_active = True
        db.commit()
        return {"message": "Client reasignat cu succes"}

    link = AccountantClient(accountant_id=contabil.id, client_id=client.id)
    db.add(link)
    db.commit()
    return {"message": "Client asignat contabilului cu succes"}


@router.delete("/admin/assign-client")
def admin_unassign_client(
    data: AdminAssignRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin dezasigneaza un client de la un contabil (setez is_active=False)."""
    link = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == data.contabil_id,
        AccountantClient.client_id == data.client_id,
        AccountantClient.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Asignare negasita")
    link.is_active = False
    db.commit()
    return {"message": "Client dezasignat de la contabil"}


@router.get("/contabil/{contabil_id}/clients", response_model=UserListResponse)
def list_clients_of_contabil(
    contabil_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin vede ce clienti are asignati un contabil anume."""
    contabil = db.query(User).filter(User.id == contabil_id).first()
    if not contabil:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    links = db.query(AccountantClient).filter(
        AccountantClient.accountant_id == contabil.id,
        AccountantClient.is_active == True,
    ).all()
    client_ids = [l.client_id for l in links]
    clients = db.query(User).filter(User.id.in_(client_ids)).all() if client_ids else []
    return UserListResponse(users=clients, total=len(clients))


@router.post("/create-contabil", response_model=UserResponse, status_code=201)
def create_contabil(
    data: CreateContabilRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin creeaza un cont nou direct cu rol CONTABIL."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email-ul este deja folosit")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username-ul este deja folosit")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole.CONTABIL,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

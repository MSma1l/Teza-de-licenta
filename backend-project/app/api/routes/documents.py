from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.document import Document, DocumentStatus
from app.models.accountant_client import AccountantClient
from app.schemas.document import DocumentResponse, DocumentUpdateRequest, DocumentListResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documente"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    document_type: str = Form("altele"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = [
        "image/jpeg", "image/png", "image/webp",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tip de fișier nepermis")

    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"Fișierul depășește {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, "documents", safe_filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)

    doc = Document(
        owner_id=current_user.id,
        title=title,
        description=description,
        document_type=document_type,
        status=DocumentStatus.INCARCAT,
        file_path=filepath,
        file_name=file.filename or safe_filename,
        file_size=len(content),
        mime_type=file.content_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    document_type: str | None = None,
    doc_status: str | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Document)

    # Clientul vede doar documentele proprii, contabilul vede și ale clienților săi
    if current_user.role == UserRole.CLIENT:
        query = query.filter(Document.owner_id == current_user.id)
    elif current_user.role == UserRole.CONTABIL:
        client_links = db.query(AccountantClient.client_id).filter(
            AccountantClient.accountant_id == current_user.id,
            AccountantClient.is_active == True,
        ).all()
        client_ids = [link.client_id for link in client_links]
        client_ids.append(current_user.id)
        query = query.filter(Document.owner_id.in_(client_ids))
    # Admin vede tot

    if document_type:
        query = query.filter(Document.document_type == document_type)
    if doc_status:
        query = query.filter(Document.status == doc_status)

    total = query.count()
    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return DocumentListResponse(documents=documents, total=total)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    # Verifică acces
    if current_user.role == UserRole.CLIENT and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest document")

    return doc


# --- Helpers de securitate pentru rescan ---

_ALLOWED_RESCAN_MIMES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}

# Extensii tolerate corespunzatoare mime-urilor de mai sus (totul lowercase).
_ALLOWED_RESCAN_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}

# Stari in care NU permitem rescan (documentul e deja validat / trimis / arhivat).
_STARI_BLOCATE_RESCAN = {
    DocumentStatus.APROBAT,
    DocumentStatus.ARHIVAT,
    DocumentStatus.RESPINS,
}


def _verifica_acces_rescan(current_user: User, doc: Document, db: Session) -> None:
    """Autorizare granulara pt rescan, diferita de cea de GET (mai stricta)."""
    if current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        return
    if current_user.role == UserRole.CLIENT:
        if doc.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Nu ai acces la acest document")
        return
    if current_user.role == UserRole.CONTABIL:
        # Contabilul poate rescana doar documentele clientilor asignati (activi).
        asignat = (
            db.query(AccountantClient)
            .filter(
                AccountantClient.accountant_id == current_user.id,
                AccountantClient.client_id == doc.owner_id,
                AccountantClient.is_active == True,
            )
            .first()
        )
        if not asignat:
            raise HTTPException(status_code=403, detail="Documentul nu apartine unui client asignat")
        return
    raise HTTPException(status_code=403, detail="Rol nepermis pentru rescan")


def _valideaza_continut_fisier(content: bytes, mime_type: str | None) -> None:
    """Verificare magic bytes — blocheaza content-type spoofing."""
    if not content or len(content) < 8:
        raise HTTPException(status_code=400, detail="Fisier gol sau prea mic")
    if mime_type == "application/pdf":
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Continutul nu este un PDF valid")
    elif mime_type == "image/jpeg":
        if not content.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=400, detail="Continutul nu este o imagine JPEG valida")
    elif mime_type == "image/png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=400, detail="Continutul nu este o imagine PNG valida")
    elif mime_type == "image/webp":
        if not (content[:4] == b"RIFF" and content[8:12] == b"WEBP"):
            raise HTTPException(status_code=400, detail="Continutul nu este o imagine WebP valida")


def _extensie_sigura(filename: str | None, mime_type: str | None) -> str:
    """Intoarce o extensie whitelisted, fallback pe MIME — fara path traversal."""
    if filename:
        ext = os.path.splitext(os.path.basename(filename))[1].lower()
        if ext in _ALLOWED_RESCAN_EXTENSIONS:
            return ext
    mapa = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }
    return mapa.get(mime_type or "", ".bin")


def _nume_afisat_sigur(filename: str | None) -> str:
    """Numele folosit doar pentru afisare in UI — fara path separators."""
    if not filename:
        return "document"
    nume = os.path.basename(filename)
    # pastreaza doar caractere vizibile rezonabile, max 200
    curat = "".join(c for c in nume if c.isprintable() and c not in ("\\", "/"))
    return curat[:200] or "document"


@router.put("/{document_id}/rescan", response_model=DocumentResponse)
async def rescan_document(
    document_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Inlocuieste fisierul unui document existent si reporneste pipeline-ul OCR.
    Folosit cand calitatea OCR a fost slaba si userul rescaneaza din aplicatia mobila.

    Securitate:
      - Autorizare pe rol (CLIENT=propriul, CONTABIL=clienti asignati, ADMIN=tot)
      - Blocheaza rescan pe documente aprobate / arhivate / respinse
      - Valideaza MIME + extensie + magic bytes
      - Sanitizeaza numele afisat, foloseste UUID pentru numele pe disc
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    _verifica_acces_rescan(current_user, doc, db)

    if doc.status in _STARI_BLOCATE_RESCAN:
        raise HTTPException(
            status_code=409,
            detail=f"Documentul nu poate fi rescanat (stare: {doc.status})",
        )

    if file.content_type not in _ALLOWED_RESCAN_MIMES:
        raise HTTPException(status_code=400, detail="Tip de fișier nepermis pentru rescanare")

    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Fișierul depășește {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    _valideaza_continut_fisier(content, file.content_type)

    # Nume si cale sigure
    ext = _extensie_sigura(file.filename, file.content_type)
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    upload_root = os.path.abspath(os.path.join(settings.UPLOAD_DIR, "documents"))
    os.makedirs(upload_root, exist_ok=True)
    filepath = os.path.abspath(os.path.join(upload_root, safe_filename))
    if not filepath.startswith(upload_root + os.sep):
        # paranoia — nu ar trebui sa se intample cu UUID
        raise HTTPException(status_code=400, detail="Cale de fisier invalida")

    with open(filepath, "wb") as f:
        f.write(content)

    # Sterge fisierul vechi DOAR daca e in directorul nostru de uploads — previne
    # accidentala stergere a altor fisiere daca file_path e corupt in DB.
    try:
        if doc.file_path:
            vechi_abs = os.path.abspath(doc.file_path)
            if vechi_abs.startswith(upload_root + os.sep) and os.path.exists(vechi_abs):
                os.remove(vechi_abs)
    except OSError:
        pass

    # Actualizeaza documentul si reseteaza rezultatele OCR pentru a relua pipeline-ul.
    doc.file_path = filepath
    doc.file_name = _nume_afisat_sigur(file.filename) or safe_filename
    doc.file_size = len(content)
    doc.mime_type = file.content_type
    doc.status = DocumentStatus.INCARCAT
    doc.ocr_text = None
    doc.ocr_text_encrypted = None
    doc.ocr_data = None
    doc.avg_ocr_confidence = None
    doc.has_flagged_fields = False
    doc.processed_at = None

    db.commit()
    db.refresh(doc)
    return doc


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str,
    data: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    if current_user.role == UserRole.CLIENT and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest document")

    if data.title is not None:
        doc.title = data.title
    if data.description is not None:
        doc.description = data.description
    if data.document_type is not None:
        doc.document_type = data.document_type
    if data.status is not None:
        doc.status = data.status

    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    if current_user.role == UserRole.CLIENT and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest document")

    # Șterge fișierul de pe disc
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.document import Document, DocumentType, DocumentStatus
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

"""
API Routes: Training - vizualizare OCR, corecții, antrenare.
Aceste endpoint-uri sunt apelate de interfața de antrenare.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.extracted_field import ExtractedField
from app.models.training_example import TrainingExample
from app.models.model_version import ModelVersion

router = APIRouter(prefix="/training", tags=["Training"])


@router.get("/stats")
def get_training_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("super_admin", "admin")),
):
    """Statistici antrenare: câte corecții, câte exemple, acuratețe."""
    total = db.query(func.count(TrainingExample.id)).scalar() or 0
    unused = db.query(func.count(TrainingExample.id)).filter(
        TrainingExample.used_in_training == False
    ).scalar() or 0
    type_corrections = db.query(func.count(TrainingExample.id)).filter(
        TrainingExample.type_was_correct == False
    ).scalar() or 0
    entity_corrections = db.query(func.count(TrainingExample.id)).filter(
        TrainingExample.corrected_entities_encrypted.isnot(None)
    ).scalar() or 0

    # Documente procesate
    processed = db.query(func.count(Document.id)).filter(
        Document.status.in_([
            DocumentStatus.APROBAT,
            DocumentStatus.VERIFICAT,
            DocumentStatus.PENDING_APPROVAL,
        ])
    ).scalar() or 0

    # Average OCR confidence
    avg_conf = db.query(func.avg(Document.avg_ocr_confidence)).filter(
        Document.avg_ocr_confidence.isnot(None)
    ).scalar() or 0.0

    # Active models
    active_models = db.query(ModelVersion).filter(ModelVersion.is_active == True).all()

    return {
        "total_examples": total,
        "unused_examples": unused,
        "type_corrections": type_corrections,
        "entity_corrections": entity_corrections,
        "processed_documents": processed,
        "avg_ocr_confidence": round(avg_conf, 4),
        "min_required_for_training": 50,
        "can_retrain_classifier": type_corrections >= 50,
        "can_retrain_ner": entity_corrections >= 50,
        "active_models": [
            {
                "name": m.model_name,
                "version": m.version,
                "accuracy": json.loads(m.accuracy_metrics) if m.accuracy_metrics else None,
                "dataset_size": m.dataset_size,
                "training_date": m.training_date.isoformat(),
            }
            for m in active_models
        ],
    }


@router.get("/documents")
def get_training_documents(
    status: str = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("super_admin", "admin")),
):
    """Listează documentele disponibile pentru antrenare/revizie."""
    query = db.query(Document).filter(
        Document.ocr_text.isnot(None),
    )

    if status:
        query = query.filter(Document.status == status)

    query = query.order_by(Document.created_at.desc())
    total = query.count()
    docs = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "documents": [
            {
                "id": d.id,
                "title": d.title,
                "file_name": d.file_name,
                "document_type": d.document_type.value if hasattr(d.document_type, 'value') else d.document_type,
                "status": d.status.value if hasattr(d.status, 'value') else d.status,
                "avg_ocr_confidence": d.avg_ocr_confidence,
                "has_flagged_fields": d.has_flagged_fields,
                "document_type_confidence": d.document_type_confidence,
                "urgency_score": d.urgency_score,
                "created_at": d.created_at.isoformat(),
                "processed_at": d.processed_at.isoformat() if d.processed_at else None,
            }
            for d in docs
        ],
    }


@router.get("/documents/{document_id}/ocr")
def get_document_ocr_data(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("super_admin", "admin")),
):
    """
    Returnează datele OCR complete pentru vizualizare:
    - Text extras cu confidence per cuvânt
    - Bounding boxes pentru overlay pe imagine
    - Clasificare + entități
    - Path imagine originală
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    # Parsed OCR data (blocks with bounding boxes)
    ocr_blocks = []
    if doc.ocr_data:
        try:
            ocr_blocks = json.loads(doc.ocr_data) if isinstance(doc.ocr_data, str) else doc.ocr_data
        except json.JSONDecodeError:
            ocr_blocks = []

    # Extracted fields
    fields = db.query(ExtractedField).filter(
        ExtractedField.document_id == document_id
    ).all()

    return {
        "document": {
            "id": doc.id,
            "title": doc.title,
            "file_name": doc.file_name,
            "file_path": doc.file_path,
            "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type,
            "document_type_confidence": doc.document_type_confidence,
            "status": doc.status.value if hasattr(doc.status, 'value') else doc.status,
            "avg_ocr_confidence": doc.avg_ocr_confidence,
            "urgency_score": doc.urgency_score,
            "urgency_breakdown": json.loads(doc.urgency_breakdown) if doc.urgency_breakdown else None,
        },
        "ocr": {
            "text": doc.ocr_text or "",
            "blocks": ocr_blocks.get("blocks", []) if isinstance(ocr_blocks, dict) else ocr_blocks,
            "sections": ocr_blocks.get("sections", {}) if isinstance(ocr_blocks, dict) else {},
            "avg_confidence": doc.avg_ocr_confidence or 0,
            "has_flagged": doc.has_flagged_fields,
        },
        "extracted_fields": [
            {
                "id": f.id,
                "field_name": f.field_name,
                "value": f.value_encrypted,  # Will be decrypted on frontend if needed
                "confidence": f.confidence,
                "is_flagged": f.is_flagged,
                "was_corrected": f.was_corrected,
                "original_value": f.original_value_encrypted,
            }
            for f in fields
        ],
    }


@router.post("/documents/{document_id}/correct")
def submit_correction(
    document_id: str,
    correction: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("super_admin", "admin")),
):
    """
    Trimite corecții pentru un document.
    Body: {
        "document_type": "factura",  // optional, dacă a fost clasificat greșit
        "fields": {"invoice_num": "FA-123", "total": "1500.00"},  // corecții câmpuri
        "urgency_feedback": "correct",  // too_high, correct, too_low
    }
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    type_was_correct = True
    new_type = correction.get("document_type")
    if new_type and new_type != (doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type):
        doc.document_type = new_type
        type_was_correct = False

    # Corectare câmpuri
    fields_corrections = correction.get("fields", {})
    if fields_corrections:
        for field_name, new_value in fields_corrections.items():
            field = db.query(ExtractedField).filter(
                ExtractedField.document_id == document_id,
                ExtractedField.field_name == field_name,
            ).first()

            if field:
                field.original_value_encrypted = field.value_encrypted
                field.value_encrypted = new_value
                field.was_corrected = True
                field.corrected_by = user.id
                field.corrected_at = datetime.now(timezone.utc)
            else:
                # Câmp nou adăugat manual
                new_field = ExtractedField(
                    document_id=document_id,
                    field_name=field_name,
                    value_encrypted=new_value,
                    confidence=1.0,
                    is_flagged=False,
                    was_corrected=True,
                    corrected_by=user.id,
                    corrected_at=datetime.now(timezone.utc),
                )
                db.add(new_field)

    # Salvare training example
    training_ex = TrainingExample(
        document_id=document_id,
        document_type=doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type,
        ocr_text_encrypted=doc.ocr_text_encrypted or doc.ocr_text,
        predicted_entities_encrypted=None,
        corrected_entities_encrypted=json.dumps(fields_corrections) if fields_corrections else None,
        type_was_correct=type_was_correct,
        urgency_feedback=correction.get("urgency_feedback"),
        accountant_id=user.id,
    )
    db.add(training_ex)
    db.commit()

    return {
        "status": "corrected",
        "document_id": document_id,
        "training_example_id": training_ex.id,
        "type_was_correct": type_was_correct,
        "fields_corrected": len(fields_corrections),
    }


@router.post("/documents/{document_id}/confirm")
def confirm_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("super_admin", "admin")),
):
    """Confirmă că OCR + clasificare + extracție sunt corecte (positive training example)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    training_ex = TrainingExample(
        document_id=document_id,
        document_type=doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type,
        ocr_text_encrypted=doc.ocr_text_encrypted or doc.ocr_text,
        type_was_correct=True,
        urgency_feedback="correct",
        accountant_id=user.id,
    )
    db.add(training_ex)
    doc.status = DocumentStatus.APROBAT
    db.commit()

    return {"status": "confirmed", "document_id": document_id}


@router.get("/models")
def get_models(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    """Listează toate versiunile de modele AI."""
    models = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "model_name": m.model_name,
            "version": m.version,
            "training_date": m.training_date.isoformat(),
            "dataset_size": m.dataset_size,
            "accuracy_metrics": json.loads(m.accuracy_metrics) if m.accuracy_metrics else None,
            "is_active": m.is_active,
        }
        for m in models
    ]

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Text, Enum as SAEnum, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    FACTURA = "factura"
    CHITANTA = "chitanta"
    CONTRACT = "contract"
    EXTRAS_BANCAR = "extras_bancar"
    BON_FISCAL = "bon_fiscal"
    DECLARATIE = "declaratie"
    ACT_CONSTITUTIV = "act_constitutiv"
    CERTIFICAT = "certificat"
    PROCES_VERBAL = "proces_verbal"
    STAT_PLATA = "stat_plata"
    ALTELE = "altele"


class DocumentStatus(str, enum.Enum):
    INCARCAT = "incarcat"
    IN_PROCESARE = "in_procesare"
    OCR_COMPLET = "ocr_complet"
    CLASIFICAT = "clasificat"
    EXTRAS = "extras"
    PENDING_APPROVAL = "pending_approval"
    REQUIRES_MANUAL = "requires_manual"
    DUPLICATE_DETECTED = "duplicate_detected"
    VERIFICAT = "verificat"
    APROBAT = "aprobat"
    RESPINS = "respins"
    ESCALADAT = "escaladat"
    ARHIVAT = "arhivat"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[str] = mapped_column(SAEnum(DocumentType), default=DocumentType.ALTELE, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.INCARCAT, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(300), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # OCR results
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_text_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: blocks, bounding boxes, confidence per word
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    # AI classification
    document_type_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Urgency
    urgency_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    urgency_breakdown: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    # OCR quality
    avg_ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_flagged_fields: Mapped[bool] = mapped_column(Boolean, default=False)

    # Duplicate
    duplicate_of_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("documents.id"), nullable=True)

    # Assignment
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    # Approval
    approved_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="documents", foreign_keys=[owner_id])
    extracted_fields: Mapped[list["ExtractedField"]] = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship("Recommendation", back_populates="document", cascade="all, delete-orphan")
    training_examples: Mapped[list["TrainingExample"]] = relationship("TrainingExample", back_populates="document")
    embedding: Mapped["DocumentEmbedding"] = relationship("DocumentEmbedding", back_populates="document", uselist=False)

"""
Model Document - Tabelul principal pentru documente procesate OCR.
Câmpuri sensibile sunt criptate cu AES-256-GCM.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_company_status", "company_id", "status"),
        Index("ix_documents_company_urgency", "company_id", "urgency_score"),
        Index("ix_documents_file_hash", "file_hash"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Metadata fișier
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    file_path_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)

    # OCR rezultate (criptate)
    raw_ocr_text_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    ocr_data: Mapped[dict] = mapped_column(JSONB, nullable=True,
        comment="Bounding boxes, confidence per word (nu criptat - nu conține text)")

    # Clasificare
    document_type: Mapped[str] = mapped_column(
        String(30), nullable=True,
        comment="invoice, receipt, contract, tax_declaration, payroll, bank_statement, other"
    )
    document_type_confidence: Mapped[float] = mapped_column(Float, nullable=True)

    # Status procesare
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="uploaded",
        comment="uploaded, ocr_processing, ocr_complete, classifying, extracting, "
                "scoring, duplicate_check, auto_processed, pending_approval, "
                "requires_manual_completion, approved, rejected, archived"
    )

    # Urgency
    urgency_score: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    urgency_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=True)

    # OCR quality
    avg_ocr_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    has_flagged_fields: Mapped[bool] = mapped_column(Boolean, default=False)

    # Duplicate detection
    duplicate_of_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=True, index=True)

    # Assignment
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Approval
    approved_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)

    # Timestamps
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relații
    company = relationship("Company", back_populates="documents")
    uploaded_by_user = relationship(
        "User", back_populates="uploaded_documents",
        foreign_keys=[uploaded_by]
    )
    assigned_to_user = relationship(
        "User", back_populates="assigned_documents",
        foreign_keys=[assigned_to]
    )
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="document", cascade="all, delete-orphan")
    training_examples = relationship("TrainingExample", back_populates="document")
    embedding = relationship("DocumentEmbedding", back_populates="document", uselist=False)

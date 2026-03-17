import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Text, Enum as SAEnum, Integer
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
    ALTELE = "altele"


class DocumentStatus(str, enum.Enum):
    INCARCAT = "incarcat"           # Tocmai încărcat
    IN_PROCESARE = "in_procesare"   # Se procesează OCR
    PROCESAT = "procesat"           # OCR finalizat
    VERIFICAT = "verificat"         # Contabilul a verificat
    RESPINS = "respins"             # Respins de contabil
    ARHIVAT = "arhivat"             # Arhivat


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[str] = mapped_column(SAEnum(DocumentType), default=DocumentType.ALTELE, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.INCARCAT, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(300), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON cu date extrase
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner: Mapped["User"] = relationship("User", back_populates="documents", foreign_keys=[owner_id])

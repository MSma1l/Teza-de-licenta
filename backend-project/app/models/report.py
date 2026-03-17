import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class ReportType(str, enum.Enum):
    BILANT_CONTABIL = "bilant_contabil"
    BALANTA_VERIFICARE = "balanta_verificare"
    REGISTRU_JURNAL = "registru_jurnal"
    REGISTRU_CASA = "registru_casa"
    DECLARATIE_FISCALA = "declaratie_fiscala"
    FACTURA_EMISA = "factura_emisa"
    SITUATIE_PROFIT_PIERDERE = "situatie_profit_pierdere"
    RAPORT_TVA = "raport_tva"
    FISA_CONT = "fisa_cont"
    JURNAL_VANZARI = "jurnal_vanzari"
    JURNAL_CUMPARARI = "jurnal_cumparari"
    DECONT_TVA = "decont_tva"
    RAPORT_SALARII = "raport_salarii"
    ALTELE = "altele"


class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_LUCRU = "in_lucru"
    FINALIZAT = "finalizat"
    EXPEDIAT = "expediat"
    VIZUALIZAT = "vizualizat"
    ARHIVAT = "arhivat"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_type: Mapped[str] = mapped_column(SAEnum(ReportType), default=ReportType.ALTELE, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(ReportStatus), default=ReportStatus.DRAFT, nullable=False)
    period_start: Mapped[str | None] = mapped_column(String(20), nullable=True)  # ex: "2026-01"
    period_end: Mapped[str | None] = mapped_column(String(20), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON cu datele raportului
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    created_by_user: Mapped["User"] = relationship("User", back_populates="reports_created", foreign_keys=[created_by])
    client_user: Mapped["User"] = relationship("User", back_populates="reports_for", foreign_keys=[client_id])

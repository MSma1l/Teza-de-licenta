"""
ConsultationRequest — cereri de consultatie trimise de pe pagina publica
(formularul "Sign up for a free consultation" din ConnectSection).

Sunt preluate de receptionisti, care le marcheaza:
  - noua          → tocmai trimisa de un vizitator
  - in_lucru      → receptionist a inceput sa o proceseze
  - contactat     → receptionist a contactat clientul (telefon/email)
  - programat     → s-a programat o consultatie / intalnire
  - inchis_ok     → finalizata pozitiv (poate s-a creat cont sau s-a transferat la contabil)
  - inchis_respins→ refuz / spam / nu mai e relevanta
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ConsultationStatus(str, enum.Enum):
    NOUA = "noua"
    IN_LUCRU = "in_lucru"
    CONTACTAT = "contactat"
    PROGRAMAT = "programat"
    INCHIS_OK = "inchis_ok"
    INCHIS_RESPINS = "inchis_respins"


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(SAEnum(ConsultationStatus), default=ConsultationStatus.NOUA, nullable=False, index=True)
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

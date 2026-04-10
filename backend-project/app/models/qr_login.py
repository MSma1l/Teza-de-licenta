"""
QR Login Session - permite logare pe Web prin scanare QR de pe Mobile.

Flux:
1. Browser-ul (NEAUTENTIFICAT) deschide /signin si cere POST /qr-login/initiate
   -> primeste un session_token unic si un qr_token
2. Browser-ul afiseaza imaginea QR (GET /qr-login/qr/{qr_token})
3. Browser-ul incepe polling pe GET /qr-login/status/{session_token}
4. Mobile (AUTENTIFICAT) scaneaza QR-ul si trimite POST /qr-login/approve cu qr_token
5. Backend leaga sesiunea de user_id-ul din mobile
6. Browser-ul vede ca sesiunea e aprobata si primeste access_token + refresh_token
7. Logarea e completa
"""
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class QRLoginSession(Base):
    """Sesiune de logare prin QR - creata initial fara user_id, apoi legata la scan."""
    __tablename__ = "qr_login_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    qr_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_consumed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

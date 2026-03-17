import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CONTABIL = "contabil"
    CLIENT = "client"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(SAEnum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="owner", foreign_keys="Document.owner_id")
    reports_created: Mapped[list["Report"]] = relationship("Report", back_populates="created_by_user", foreign_keys="Report.created_by")
    reports_for: Mapped[list["Report"]] = relationship("Report", back_populates="client_user", foreign_keys="Report.client_id")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")

    # Contabil -> Clienti relationship
    clients: Mapped[list["AccountantClient"]] = relationship("AccountantClient", back_populates="accountant", foreign_keys="AccountantClient.accountant_id")
    accountants: Mapped[list["AccountantClient"]] = relationship("AccountantClient", back_populates="client", foreign_keys="AccountantClient.client_id")

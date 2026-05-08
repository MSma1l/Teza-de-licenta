"""
Model ModelVersion - Versionarea modelelor AI.
Păstrăm ultimele 5 versiuni pentru rollback.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import String, DateTime, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ModelVersion(Base):
    """ATENTIE: schema reala in DB (creata de main backend) foloseste varchar(36)
    pentru id si TEXT pentru accuracy_metrics (JSON serializat ca string).
    Asta diverge de definitia veche cu UUID + JSONB — pastram acum schema corecta."""
    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    model_name: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="classifier, ner_extractor, urgency_scorer, embeddings"
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    training_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    dataset_size: Mapped[int] = mapped_column(Integer, nullable=False)
    # accuracy_metrics in DB e TEXT (JSON ca string) — pastram tipul TEXT,
    # codul aplicatiei accepta atat dict cat si JSON string.
    accuracy_metrics: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="JSON serializat: {accuracy, f1, precision, recall}"
    )
    model_path: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def metrics_dict(self) -> dict[str, Any]:
        """Helper — accuracy_metrics ca dict (decodifica JSON daca e string)."""
        if not self.accuracy_metrics:
            return {}
        if isinstance(self.accuracy_metrics, dict):
            return self.accuracy_metrics
        try:
            return json.loads(self.accuracy_metrics)
        except (json.JSONDecodeError, TypeError):
            return {}

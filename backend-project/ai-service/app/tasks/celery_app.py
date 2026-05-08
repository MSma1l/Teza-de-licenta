"""
Celery application configuration.
Broker: Redis. Backend: Redis.
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "ai_service",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,   # 5 min soft limit
    task_time_limit=600,        # 10 min hard limit
)

# Auto-discover tasks (cauta tasks.py in pachet — lasam ca fallback)
celery_app.autodiscover_tasks(["app.tasks"])

# Pre-load TOATE modelele inainte de orice query — relatiile SQLAlchemy
# (TrainingExample → Document, User → Company, etc.) au nevoie de toate clasele
# inregistrate, altfel _check_configure crapa cu "failed to locate a name".
from app.models import (  # noqa: F401, E402
    user, document, audit_log, company, document_embedding,
    extracted_field, model_version, recommendation, training_example,
)

# Explicit include — autodiscover NU prinde fisiere cu alt nume decat tasks.py.
# Le importam manual ca @celery_app.task din ele sa fie inregistrate la worker startup.
# Altfel: trigger /training/trigger raspunde started, dar worker-ul respinge cu
# "Received unregistered task of type 'train_classifier'".
import app.tasks.document_tasks  # noqa: F401, E402
import app.tasks.training_tasks  # noqa: F401, E402

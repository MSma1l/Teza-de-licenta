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

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])

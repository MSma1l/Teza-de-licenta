"""
API Routes: Training & Model management.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.services.training_service import (
    get_training_stats,
    get_model_versions,
    activate_model_version,
)
from app.schemas.training import (
    TrainingStats,
    TrainingTriggerResponse,
    ModelVersionResponse,
)

router = APIRouter(prefix="/training", tags=["Training & Models"])


@router.get("/stats", response_model=TrainingStats)
async def training_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "manager")),
):
    """Statistici despre datele de antrenament acumulate."""
    return await get_training_stats(db)


@router.post("/trigger", response_model=TrainingTriggerResponse)
async def trigger_training(
    model_name: str = "classifier",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    """Pornește un job de re-antrenare model."""
    if model_name == "classifier":
        from app.tasks.training_tasks import train_classifier_task
        task = train_classifier_task.delay()
    elif model_name == "ner":
        from app.tasks.training_tasks import train_ner_task
        task = train_ner_task.delay()
    else:
        raise HTTPException(status_code=400, detail=f"Model necunoscut: {model_name}")

    return TrainingTriggerResponse(
        task_id=task.id,
        model_name=model_name,
        status="started",
        message=f"Training {model_name} pornit. Task ID: {task.id}",
    )


@router.get("/models", response_model=list[ModelVersionResponse])
async def list_models(
    model_name: str = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "manager")),
):
    """Listează versiunile modelelor."""
    versions = await get_model_versions(db, model_name)
    return versions


@router.post("/models/{model_id}/activate")
async def activate_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    """Activează o versiune de model (rollback/promote)."""
    try:
        model = await activate_model_version(db, model_id)
        await db.commit()
        return {
            "status": "activated",
            "model_name": model.model_name,
            "version": model.version,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/models/{model_id}/metrics")
async def model_metrics(
    model_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "manager")),
):
    """Metrici de performanță pentru un model."""
    from app.models.model_version import ModelVersion
    from sqlalchemy import select

    stmt = select(ModelVersion).where(ModelVersion.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()

    if not model:
        raise HTTPException(status_code=404, detail="Model negăsit")

    return {
        "model_name": model.model_name,
        "version": model.version,
        "metrics": model.accuracy_metrics,
        "dataset_size": model.dataset_size,
        "training_date": model.training_date.isoformat(),
        "is_active": model.is_active,
    }

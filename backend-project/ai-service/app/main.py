"""
AI-Service - FastAPI Application.
OCR + Document Classification + NER + Urgency Scoring.
100% local - fără API-uri externe.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import engine, Base

# Importam toate modelele inainte ca SQLAlchemy sa configureze relatiile
# (User.company referinte Company → trebuie ambele clase incarcate inainte de
# prima query, altfel mapperul User esueaza cu InvalidRequestError la audit log).
from app.models import (  # noqa: F401
    user, document, audit_log, company, document_embedding,
    extracted_field, model_version, recommendation, training_example,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    # === STARTUP ===
    setup_logging()
    logger.info("AI-Service pornește...")

    # Creare tabele (dev mode)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tabele DB verificate/create")

    # Încărcare modele AI (thread-safe, eval mode)
    try:
        from app.processors.classifier import document_classifier
        document_classifier.load_model()
    except Exception as e:
        logger.warning(f"Classifier: fallback to keywords ({e})")

    try:
        from app.processors.ner_extractor import ner_extractor
        ner_extractor.load_model()
    except Exception as e:
        logger.warning(f"NER: fallback to regex ({e})")

    try:
        from app.processors.urgency_scorer import urgency_scorer
        urgency_scorer.load_ml_model()
    except Exception as e:
        logger.warning(f"Urgency: fallback to rules ({e})")

    try:
        from app.processors.recommender import document_recommender
        document_recommender.load()
    except Exception as e:
        logger.warning(f"Recommender: FAISS not loaded ({e})")

    # Start Redis pub/sub listener pentru WebSocket
    redis_task = None
    try:
        from app.websocket.handlers import redis_listener
        redis_task = asyncio.create_task(redis_listener())
        logger.info("Redis pub/sub listener started")
    except Exception as e:
        logger.warning(f"Redis listener: {e}")

    logger.info(f"AI-Service gata pe port {settings.AI_SERVICE_PORT}")

    yield

    # === SHUTDOWN ===
    logger.info("AI-Service se oprește...")

    if redis_task:
        redis_task.cancel()

    # Salvare FAISS index
    try:
        from app.processors.recommender import document_recommender
        document_recommender.save_index()
    except Exception:
        pass

    await engine.dispose()
    logger.info("AI-Service oprit")


# === Create App ===
app = FastAPI(
    title="AI-Contabil AI Service",
    description="OCR + Document Classification + NER + Urgency Scoring. 100% local.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Register Routes ===
from app.api.routes.documents import router as documents_router
from app.api.routes.queue import router as queue_router
from app.api.routes.training import router as training_router
from app.api.routes.reports import router as reports_router
from app.api.routes.admin import router as admin_router
from app.api.routes.agent import router as agent_router
from app.api.routes.agents import router as agents_router

app.include_router(documents_router, prefix="/api/v1")
app.include_router(queue_router, prefix="/api/v1")
app.include_router(training_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")


# === WebSocket Endpoints ===
from app.websocket.handlers import manager


@app.websocket("/ws/queue")
async def ws_queue(websocket: WebSocket):
    """Real-time queue updates."""
    await manager.connect_queue(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_queue(websocket)


@app.websocket("/ws/documents/{document_id}")
async def ws_document(websocket: WebSocket, document_id: str):
    """Real-time processing status updates for a specific document."""
    await manager.connect_document(websocket, document_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_document(websocket, document_id)


# === Health Check ===
@app.get("/api/v1/health")
async def health_check():
    """Health check simplu."""
    return {
        "status": "ok",
        "service": "ai-service",
        "message": "AI-Contabil AI Service funcționează",
    }

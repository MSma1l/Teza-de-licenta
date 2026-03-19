from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, users, documents, reports, notifications, training

# Import all models so they are registered with Base
from app.models import (  # noqa: F401
    user, document, report, notification, accountant_client,
    company, extracted_field, recommendation, training_example,
    model_version, audit_log, document_embedding,
)

# Create tables (in production use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Contabil API",
    description="Backend API pentru aplicația AI-Contabil",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Routes
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(training.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "AI-Contabil API funcționează"}

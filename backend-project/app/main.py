from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, users, documents, reports, notifications, training, chat, two_factor, qr_login

# Import all models so they are registered with Base
from app.models import (  # noqa: F401
    user, document, report, notification, accountant_client,
    company, extracted_field, recommendation, training_example,
    model_version, audit_log, document_embedding, faq,
    two_factor as two_factor_model, login_attempt, qr_login as qr_login_model,
)

# Create tables (in production use Alembic migrations, skip in testing)
if os.environ.get("TESTING") != "1":
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Static files for uploads
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
if os.path.isdir("storage"):
    app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Routes
app.include_router(auth.router, prefix="/api/v1/ac")
app.include_router(users.router, prefix="/api/v1/ac")
app.include_router(documents.router, prefix="/api/v1/ac")
app.include_router(reports.router, prefix="/api/v1/ac")
app.include_router(notifications.router, prefix="/api/v1/ac")
app.include_router(training.router, prefix="/api/v1/ac")
app.include_router(chat.router, prefix="/api/v1/ac")
app.include_router(two_factor.router, prefix="/api/v1/ac")
app.include_router(qr_login.router, prefix="/api/v1/ac")


@app.get("/api/v1/ac/health")
def health_check():
    return {"status": "ok", "message": "AI-Contabil API funcționează"}

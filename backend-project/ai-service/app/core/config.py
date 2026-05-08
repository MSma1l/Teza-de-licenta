"""
Configurare centrală AI-Service.
Încarcă toate setările din variabilele de mediu.
"""

from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    # === Database ===
    DATABASE_URL: str = "postgresql+asyncpg://ai_contabil:ai_contabil_pass@localhost:5432/ai_contabil_db"

    # === Redis ===
    REDIS_URL: str = "redis://localhost:6379/0"

    # === JWT (shared with backend-project) ===
    JWT_SECRET_KEY: str = "dev-secret-key-schimba-in-productie"
    JWT_ALGORITHM: str = "HS256"

    # === Encryption ===
    ENCRYPTION_KEY_DEFAULT: str = ""  # 32 bytes, base64 encoded

    # === Server ===
    AI_SERVICE_HOST: str = "0.0.0.0"
    AI_SERVICE_PORT: int = 3778

    # === CORS ===
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8081,http://localhost:3777"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # === Paths ===
    MODEL_STORAGE_PATH: str = "model_storage"
    TRAINING_DATA_PATH: str = "training_data"
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    @property
    def model_storage(self) -> Path:
        p = Path(self.MODEL_STORAGE_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def training_data(self) -> Path:
        p = Path(self.TRAINING_DATA_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    # === OCR Settings ===
    OCR_LANGUAGES: List[str] = ["ro", "en", "ru"]
    OCR_MIN_DPI: int = 150
    OCR_CONFIDENCE_THRESHOLD: float = 0.85
    OCR_USE_ANGLE_CLS: bool = True

    # === Model Settings ===
    CLASSIFIER_MODEL_NAME: str = "bert-base-multilingual-cased"
    NER_MODEL_NAME: str = "bert-base-multilingual-cased"
    EMBEDDINGS_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    MAX_SEQUENCE_LENGTH: int = 512
    # 10 = len(DOCUMENT_CLASSES) din classifier.py
    # (invoice, receipt, contract, tax_declaration, payroll, bank_statement,
    #  id_card, passport, bank_extract, other)
    CLASSIFIER_NUM_LABELS: int = 10
    NER_NUM_LABELS: int = 17  # 8 entity types * 2 (B/I) + O

    # === Training Settings ===
    MIN_CORRECTIONS_BEFORE_RETRAIN: int = 50
    TRAINING_EPOCHS: int = 10
    TRAINING_LEARNING_RATE: float = 2e-5
    TRAINING_BATCH_SIZE: int = 16
    TRAINING_WARMUP_STEPS: int = 100
    MAX_MODEL_VERSIONS_KEEP: int = 5

    # === Urgency Settings ===
    URGENCY_RULE_WEIGHT: float = 0.6
    URGENCY_ML_WEIGHT: float = 0.4

    # === Auto-processing ===
    AUTO_PROCESS_MIN_CONFIDENCE: float = 0.92
    AUTO_PROCESS_MAX_URGENCY: int = 70

    # === Celery ===
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # === Logging ===
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/ai-service.log"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()

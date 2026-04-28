# ANEXE LA CAPITOLUL 3

> **Notă pentru autor:** fragmentele de cod prezentate în anexe au fost selectate din codul real al aplicației AI-Contabil. Codul integral este disponibil în repository-ul proiectului. În anexe sunt incluse exclusiv secțiunile relevante pentru explicațiile din capitolul 3, însoțite de comentarii explicative care precizează rolul fiecărei secțiuni.

---

## Anexa A — Configurația Docker Compose a sistemului

Fișierul `docker-compose.yml` orchestrează cele șapte servicii containerizate ale sistemului AI-Contabil. Configurația este prezentată mai jos în formă simplificată, cu valorile sensibile (chei JWT, parole) eliminate. Fișierul real este disponibil în rădăcina repository-ului.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ai_contabil_db
    environment:
      POSTGRES_USER: ai_contabil
      POSTGRES_PASSWORD: ai_contabil_pass
      POSTGRES_DB: ai_contabil_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ai_contabil -d ai_contabil_db"]
      interval: 5s

  redis:
    image: redis:7-alpine
    container_name: ai_contabil_redis
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  backend:
    build: ./backend-project
    container_name: ai_contabil_backend
    ports:
      - "3777:3777"
    environment:
      DATABASE_URL: postgresql://ai_contabil:***@postgres:5432/ai_contabil_db
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      AI_SERVICE_URL: http://ai-service:3778
    depends_on:
      postgres:
        condition: service_healthy

  ai-service:
    build: ./backend-project/ai-service
    container_name: ai_contabil_ai_service
    ports:
      - "3778:3778"
    environment:
      OLLAMA_URL: http://ollama:11434
      OLLAMA_MODEL: qwen2.5:3b-instruct
      EMBEDDER_MODEL: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }

  celery-worker:
    build: ./backend-project/ai-service
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2

  celery-beat:
    build: ./backend-project/ai-service
    command: celery -A app.tasks.celery_app beat --loglevel=info

  ollama:
    image: ollama/ollama:latest
    container_name: ai_contabil_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

volumes:
  postgres_data:
  redis_data:
  ai_model_storage:
  ai_training_data:
  ollama_models:
```

**Comentarii explicative.** Configurația definește șapte servicii: trei servicii de infrastructură (`postgres`, `redis`, `ollama`) și patru servicii ale aplicației (`backend`, `ai-service`, `celery-worker`, `celery-beat`). Sondele de sănătate (`healthcheck`) asigură pornirea ordonată: serviciile aplicației așteaptă confirmarea că baza de date și brokerul Redis sunt funcționale înainte de a porni. Volumele persistente (`postgres_data`, `ai_model_storage`, `ollama_models`) garantează că datele se păstrează între reporniri. Variabilele sensibile sunt încărcate prin sintaxa `${JWT_SECRET_KEY}` din fișierul `.env` extern, care nu este inclus în controlul versiunilor.

---

## Anexa B — Agentul Djarvis: client Ollama și retriever RAG

Agentul conversațional Djarvis este compus din două module: clientul HTTP care comunică cu motorul Ollama și retriever-ul care identifică pasajele relevante din legislație.

### B.1. Clientul Ollama (`ai-service/app/agent/ollama_client.py`)

```python
import os
from typing import AsyncIterator
import httpx
from loguru import logger

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ai_contabil_ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b-instruct")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120"))
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")


async def model_disponibil(model: str = OLLAMA_MODEL) -> bool:
    """True daca modelul e deja pull-uit in Ollama."""
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{OLLAMA_URL}/api/tags")
            r.raise_for_status()
            tags = [m["name"] for m in r.json().get("models", [])]
            return any(m.startswith(model) for m in tags)
    except Exception as e:
        logger.warning(f"Ollama not reachable: {e}")
        return False


async def genereaza(
    system_prompt: str,
    user_prompt: str,
    model: str = OLLAMA_MODEL,
    temperatura: float = 0.25,
    max_tokens: int | None = 800,
) -> str:
    """Request non-streaming la Ollama. Intoarce textul complet."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "keep_alive": OLLAMA_KEEP_ALIVE,
        "options": {
            "temperature": temperatura,
            "num_predict": max_tokens if max_tokens else -1,
            "num_ctx": 2048,
        },
    }
    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as c:
        r = await c.post(f"{OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("message") or {}).get("content", "").strip()
```

**Comentarii explicative.** Clientul utilizează biblioteca asincronă `httpx` pentru a comunica cu motorul Ollama prin API-ul său REST. Funcția `model_disponibil` verifică dacă modelul lingvistic configurat (`qwen2.5:3b-instruct`) este deja descărcat local, evitând eșecurile silențioase la prima interogare. Funcția `genereaza` construiește mesajul în formatul standard al API-ului `/api/chat`, cu un mesaj de sistem (rolul agentului) și un mesaj utilizator (întrebarea concretă, însoțită de contextul RAG). Parametrii `temperatura=0.25` și `num_ctx=2048` controlează creativitatea răspunsurilor și mărimea ferestrei de context. Setarea `keep_alive=30m` păstrează modelul încărcat în memorie 30 de minute între interogări, eliminând latența reîncărcării pentru utilizatorii activi.

### B.2. Retriever-ul RAG cu FAISS (`ai-service/app/agent/retriever.py`)

```python
import json
import os
from pathlib import Path
from typing import Optional
from loguru import logger

INDEX_DIR = Path(os.getenv("LEGISLATIE_INDEX_DIR", "/app/model_storage/legislatie_index"))
EMBEDDER_NAME = os.getenv(
    "EMBEDDER_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)


class LegisReteriever:
    """Singleton: embedder + FAISS index + mapping."""

    _instance: Optional["LegisReteriever"] = None

    def __init__(self):
        self._embedder = None
        self._faiss = None
        self._mapping: list[dict] = []
        self._incarcat = False

    @classmethod
    def get(cls) -> "LegisReteriever":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def incarca(self) -> bool:
        """Incarca modelul + indexul. False daca indexul nu exista inca."""
        if self._incarcat:
            return True

        index_path = INDEX_DIR / "index.faiss"
        map_path = INDEX_DIR / "mapping.json"

        if not index_path.exists() or not map_path.exists():
            logger.warning(f"Indexul legislatiei nu exista inca ({index_path}).")
            return False

        import faiss
        from sentence_transformers import SentenceTransformer

        self._embedder = SentenceTransformer(EMBEDDER_NAME)
        self._faiss = faiss.read_index(str(index_path))
        with open(map_path, "r", encoding="utf-8") as f:
            self._mapping = json.load(f)

        self._incarcat = True
        logger.info(f"Retriever gata: {len(self._mapping)} chunks indexate.")
        return True

    def cauta(self, intrebare: str, k: int = 5) -> list[dict]:
        """Returneaza top-k pasaje relevante din legislatie."""
        if not self._incarcat and not self.incarca():
            return []

        vec = self._embedder.encode(
            [intrebare], normalize_embeddings=True
        ).astype("float32")
        # FAISS inner-product == cosine pe vectori normalizati
        D, I = self._faiss.search(vec, k)
        rezultate = []
        for score, idx in zip(D[0].tolist(), I[0].tolist()):
            if 0 <= idx < len(self._mapping):
                entry = dict(self._mapping[idx])
                entry["score"] = float(score)
                rezultate.append(entry)
        return rezultate
```

**Comentarii explicative.** Retriever-ul implementează arhitectura RAG (Retrieval-Augmented Generation) prin trei componente: modelul de embedding multilingual `paraphrase-multilingual-MiniLM-L12-v2` (suport nativ pentru română), indexul FAISS (căutare rapidă în spațiul vectorial) și mapping-ul JSON (corespondența dintre indici vectoriali și textul original). Pattern-ul Singleton asigură că modelul este încărcat o singură dată în memorie, indiferent de numărul de interogări. La fiecare întrebare, metoda `cauta` calculează vectorul de embedding al întrebării, normalizează la lungime unitară (necesar pentru ca produsul intern FAISS să fie echivalent cu similaritatea cosinusoidală) și returnează cele mai apropiate `k` pasaje cu scorul de similaritate atașat. Aceste pasaje sunt apoi inserate în promptul transmis modelului Ollama prin clientul descris anterior, ancorând răspunsul agentului în legislația reală a Republicii Moldova.

---

## Anexa C — Pipeline-ul OCR cu OpenCV și PaddleOCR

Fragmentul prezintă etapele de preprocesare a imaginii înainte de transmiterea ei motorului PaddleOCR. Codul este extras din fișierul `ai-service/app/processors/ocr_processor.py`.

```python
import cv2
import numpy as np
from loguru import logger


class OCRProcessor:
    """Pipeline OCR complet: preprocessing -> PaddleOCR -> postprocessing."""

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocessing complet:
        1. Convertire la grayscale
        2. Deskew (corectie rotatie)
        3. Denoise (Gaussian blur)
        4. Contrast enhancement (CLAHE)
        5. Binarizare (Otsu thresholding)
        """
        # 1. Grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # 2. Deskew (corectia inclinarii)
        gray = self._deskew(gray)

        # 3. Denoise
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)

        # 4. CLAHE (egalizare adaptiva a histogramei)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # 5. Binarizare Otsu
        _, binary = cv2.threshold(
            enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        return binary

    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """Corecteaza rotatia documentului scanat."""
        coords = np.column_stack(np.where(image < 128))
        if len(coords) < 100:
            return image

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) < 0.5:
            return image

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
        logger.debug(f"Deskew aplicat: {angle:.2f} grade")
        return rotated
```

**Comentarii explicative.** Metoda `preprocess_image` execută cinci pași secvențiali asupra imaginii. Conversia la nivele de gri reduce volumul de date fără pierderi semnificative pentru OCR (textul nu depinde de culoare). Deskew-ul corectează automat înclinarea documentului — situație frecventă la fotografierea cu camera mobilă; algoritmul calculează unghiul minim al dreptunghiului care înconjoară pixelii de text și rotește imaginea pentru a-l alinia. Filtrul Gaussian elimină zgomotul minor introdus de senzorul camerei. CLAHE (Contrast Limited Adaptive Histogram Equalization) îmbunătățește lizibilitatea zonelor cu iluminare neuniformă, calculând histogramele pe blocuri locale (`tileGridSize=(8,8)`) în loc de o singură histogramă globală. Binarizarea Otsu transformă imaginea în alb-negru pe baza unui prag calculat automat, optimal pentru recunoașterea optică ulterioară. Rezultatul este transmis motorului PaddleOCR, care detectează regiunile de text și recunoaște caracterele în 109 limbi suportate.

---

## Anexa D — Generarea documentelor PDF cu ReportLab

Fragmentul prezintă infrastructura de stiluri și componenta de antet pentru formularele fiscale generate automat, conform cerințelor Serviciului Fiscal de Stat. Codul este extras din fișierul `app/services/rapoarte_sfs.py`.

```python
import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)


# --- Stiluri comune ---
_styles = getSampleStyleSheet()


def _style(name: str, **kwargs) -> ParagraphStyle:
    base = _styles["Normal"]
    return ParagraphStyle(name=name, parent=base, **kwargs)


TITLU_FORM = _style(
    "TitluForm", fontSize=14, leading=18, spaceAfter=6,
    alignment=1, fontName="Helvetica-Bold",
)
COD_FORM = _style(
    "CodForm", fontSize=10, leading=12, alignment=1,
    textColor=colors.grey, spaceAfter=14,
)
H = _style(
    "SectiuneH", fontSize=11, leading=14, fontName="Helvetica-Bold",
    spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#1e3a8a"),
)
P = _style("Para", fontSize=9.5, leading=13)


def _antet_sfs(perioada: str) -> list:
    """Header comun pentru toate formularele — imita antetul SFS."""
    return [
        Paragraph(
            "<b>SERVICIUL FISCAL DE STAT — REPUBLICA MOLDOVA</b>",
            TITLU_FORM,
        ),
        Paragraph(
            f"Formular depus pentru perioada fiscala <b>{perioada}</b>",
            COD_FORM,
        ),
    ]


def build_ipc21_pdf(
    *,
    companie: str,
    cod_fiscal: str,
    perioada: str,
    salarizare: list[dict],
) -> bytes:
    """
    Genereaza formularul IPC21 (impozit pe venit + contributii salarii).
    Calculele (impozit 12%, CAS 9%, CAM 4.5%) sunt efectuate aici.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.8*cm, bottomMargin=1.8*cm,
    )
    story: list = []

    story += _antet_sfs(perioada)
    story.append(Paragraph(
        "<b>IPC21 — DARE DE SEAMA PRIVIND IMPOZITUL PE VENIT "
        "SI CONTRIBUTIILE RETINUTE LA SURSA</b>",
        TITLU_FORM,
    ))
    # ... constructia tabelului cu angajati si calculul impozitelor ...

    doc.build(story)
    return buf.getvalue()
```

**Comentarii explicative.** Modulul utilizează abordarea declarativă `platypus` din ReportLab, în care documentul este construit ca o listă de obiecte de tip `Flowable` (`Paragraph`, `Table`, `Spacer`, `PageBreak`). Această abordare permite gestiunea automată a paginației, inclusiv pentru tabelele lungi care depășesc o pagină. Stilurile sunt definite o singură dată la nivelul modulului (`TITLU_FORM`, `COD_FORM`, `H`, `P`) și reutilizate în toate formularele, asigurând consistența vizuală a tuturor documentelor generate. Funcția `_antet_sfs` este factor comun extras din toate formularele fiscale, eliminând duplicarea codului pentru antetul oficial. Funcția `build_ipc21_pdf` construiește formularul lunar IPC21 (declarația privind impozitul pe venit și contribuțiile reținute la sursă), calculează automat sumele datorate (12% impozit, 9% CAS, 4,5% CAM) și returnează documentul ca obiect `bytes`, gata de criptare AES-256-GCM și stocare pe disc. Același pattern este replicat pentru celelalte formulare (declarația VEN12, factura fiscală, dispoziția de plată, contractul de prestări servicii contabile).

---

## Anexa E — Schema bazei de date prin migrația Alembic

Migrația inițială a schemei, definită în fișierul `alembic/versions/001_initial_schema.py`, creează cele unsprezece tabele principale ale aplicației. Mai jos este prezentat un extras reprezentativ care ilustrează două dintre tabele și relațiile dintre ele.

```python
"""Initial schema."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision = "001_initial_schema"
down_revision = None


def upgrade() -> None:
    # --- Tabelul utilizatorilor ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum(
            "SUPER_ADMIN", "ADMIN", "CONTABIL", "CLIENT",
            name="user_role"), nullable=False, server_default="CLIENT"),
        sa.Column("two_factor_secret", sa.String(64), nullable=True),
        sa.Column("two_factor_enabled", sa.Boolean(),
                  nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(),
                  nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- Tabelul documentelor ---
    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("uploader_id", UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("status", sa.Enum(
            "PENDING", "PROCESSING", "COMPLETED", "FAILED",
            name="document_status"), nullable=False, server_default="PENDING"),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_hash_sha256", sa.String(64), nullable=False),
        sa.Column("encryption_nonce", sa.LargeBinary(12), nullable=False),
        sa.Column("encryption_tag", sa.LargeBinary(16), nullable=False),
        sa.Column("urgency_score", sa.Float(), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_documents_uploader_status",
        "documents",
        ["uploader_id", "status"],
    )
    # ... celelalte tabele: companies, extracted_fields, recommendations,
    # training_examples, model_versions, audit_logs, document_embeddings,
    # notifications, accountant_clients ...


def downgrade() -> None:
    op.drop_table("documents")
    op.drop_table("users")
    op.execute("DROP TYPE document_status")
    op.execute("DROP TYPE user_role")
```

**Comentarii explicative.** Migrația utilizează identificatori UUID generați automat la nivelul bazei de date (funcția `gen_random_uuid()` din PostgreSQL), pattern preferat față de identificatorii incrementali pentru sistemele distribuite. Tipul `JSONB` (binary JSON al PostgreSQL) este utilizat pentru câmpul `metadata` al documentelor, permițând stocarea eficientă a structurilor variabile (rezultate OCR, scoruri AI, parametri de procesare) și interogarea acestora prin operatori specifici JSONB. Câmpurile de criptare (`encryption_nonce`, `encryption_tag`) sunt stocate alături de calea fișierului criptat, conform cerințelor algoritmului AES-256-GCM, care produce nonce-uri unice pentru fiecare operațiune de criptare. Indecsul compus `ix_documents_uploader_status` accelerează interogarea documentelor unui utilizator filtrate după status, scenariul cel mai frecvent în interfața clientului. Funcția `downgrade` permite reversibilitatea migrației, esențială pentru gestionarea schimbărilor de schemă în mediul de dezvoltare.

---

## Anexa F — Suita de teste automate Pytest

Fragmentul prezintă o secțiune reprezentativă din suita de teste a modulului de autentificare, extras din fișierul `tests/test_auth.py`.

```python
"""Teste pentru autentificare: register, login, refresh, /me."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert data["role"] == "client"
        assert data["is_active"] is True

    def test_register_duplicate_email(self, client, test_user):
        resp = client.post("/api/auth/register", json={
            "username": "otheruser",
            "email": "test@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 400
        assert "Email" in resp.json()["detail"]

    def test_register_short_password(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "validuser",
            "email": "valid@example.com",
            "password": "12345",
        })
        assert resp.status_code == 422  # validation error

    def test_register_invalid_email(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "validuser",
            "email": "not-an-email",
            "password": "securepass",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, test_user):
        resp = client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
```

**Comentarii explicative.** Suita de teste este structurată în clase, fiecare clasă grupând testele unei singure resurse logice (`TestRegister`, `TestLogin`, `TestRefresh`). Fiecare metodă de test primește ca parametri fixture-urile Pytest necesare (`client` pentru clientul HTTP, `test_user` pentru utilizatorul predefinit), injectate automat de framework prin sistem de dependency injection. Structura unui test urmează modelul Arrange-Act-Assert: pregătirea datelor, executarea acțiunii (cererea HTTP) și verificarea rezultatului (statusul HTTP, structura răspunsului, câmpurile specifice). Testele acoperă atât cazurile pozitive (`test_register_success`), cât și cazurile negative (`test_register_duplicate_email`, `test_register_short_password`, `test_register_invalid_email`), validând că serverul răspunde cu codurile HTTP corespunzătoare și mesaje de eroare descriptive. Invocarea suitei se realizează prin comanda `pytest -v` în directorul `backend-project`, cu raportul de execuție prezentat în Figura 3.13.

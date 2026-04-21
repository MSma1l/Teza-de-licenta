# AI-Contabil

Platforma inteligenta de contabilitate pentru afaceri mici din Republica Moldova. Automatizeaza procesarea documentelor, raspunde la intrebari despre legislatia fiscala si genereaza formulare oficiale pentru SFS.

**Stack:** React 19 + Vite (web) · Expo / React Native (mobile) · FastAPI (backend 3777) · FastAPI + ML (AI service 3778) · Postgres 16 · Redis 7 + Celery · Ollama (LLM local) · PaddleOCR · sentence-transformers · FAISS.

---

## AI-ul din aplicatie — privire de ansamblu

Aplicatia are **6 agenti/procesoare AI** distincti, toti rulanti local (fara API-uri externe). Fiecare are un rol clar:

| Agent | Locatie | Scop |
|---|---|---|
| **Djarvis** | ai-service `/api/v1/agent/*` | Chat conversational — raspunde la intrebari despre legislatia RM (fiscal + contabil) |
| **OCR PaddleOCR** | ai-service `/api/v1/documents/*` | Extrage textul din poze/PDF-uri cu facturi, chitante, contracte |
| **Document Classifier** | ai-service `processors/classifier.py` | Clasifica documentul extras (factura / chitanta / contract / ...) |
| **NER Extractor** | ai-service `processors/ner_extractor.py` | Extrage entitati specifice (IDNO, sume, date, TVA, nume) din text |
| **Urgency Scorer** | ai-service `processors/urgency_scorer.py` | Calculeaza cat de urgent e documentul (termen fiscal apropiat, suma mare) |
| **Document Recommender** | ai-service `processors/recommender.py` | Sugereaza documente lipsa (ex. "Ai factura dar lipseste bonul fiscal") |

Toti acesti agenti **nu depind de internet** — modelele sunt stocate pe disc, Ollama ruleaza intr-un container separat.

---

## 1. Djarvis — asistentul conversational (RAG)

**Ce face:** primeste o intrebare in limbaj natural si raspunde ca un contabil prieten. Poate raspunde la: TVA, impozite, salarii, angajare, concediere, fisc, declaratii, patenta, freelance, Moldova IT Park etc.

**Cum lucreaza** (pipeline RAG — Retrieval-Augmented Generation):

```
Intrebare ──> Embedding ──> FAISS cauta ──> Top-5 chunks legislatie
                                                │
                                                ▼
                           Prompt sistem + context + intrebare
                                                │
                                                ▼
                                    Ollama (qwen2.5:3b-instruct)
                                                │
                                                ▼
                                    Raspuns + citari [1][2]
```

**Componente:**
- `ai-service/app/agent/prompt.py` — prompt de sistem cu personalitatea Djarvis (ton conversational, cere detalii cand nu stie, ofera pas practic la final)
- `ai-service/app/agent/ollama_client.py` — client async pentru Ollama local (port 11434)
- `ai-service/app/agent/retriever.py` — singleton care incarca indexul FAISS + modelul de embedding
- `ai-service/app/api/routes/agent.py` — endpoint-urile `POST /agent/ask` si `GET /agent/health`
- `backend-project/training-data/legislatie/*.jsonl` — 51 chunks corpus (Cod Fiscal, Legea Contabilitatii, Codul Muncii + scenarii practice)
- `ai-service/scripts/build_legislation_index.py` — script offline care construieste indexul FAISS

**Model:** `qwen2.5:3b-instruct` (1.8 GB, pe CPU raspunde in 30-60s prima intrebare, 5-20s dupa warm-up). `keep_alive=30min` — modelul ramane in RAM intre intrebari.

**Integrat cu chat-ul:** cand FAQ match e sub 0.97 → backend (port 3777) apeleaza Djarvis prin HTTP. Daca Djarvis esueaza → escaladeaza la contabil.

---

## 2. Pipeline OCR + Document AI

Cand un user incarca un document (via scaner mobil, poza sau PDF):

```
Upload ──> Salvat pe disc ──> Task Celery (async)
                                      │
                                      ▼
                              PaddleOCR extrage text
                                      │
                                      ▼
                         Document Classifier (BERT)
                                      │
                                      ▼
                              NER Extractor (BERT)
                                      │
                                      ▼
                              Urgency Scorer (rule-based + ML)
                                      │
                                      ▼
                         Document salvat cu status "extras"
                              + confidence scores
                                      │
                                      ▼
                         WebSocket push catre frontend
```

**OCR (PaddleOCR):** extrage text + bounding boxes + confidence per cuvant. Daca `avg_ocr_confidence < 0.65` sau `flagged_words > 30%` → frontend afiseaza modal "Calitate slaba, reia scanarea".

**Classifier (BERT multilingual):** input = OCR text, output = unul din 10 tipuri (invoice, receipt, contract, tax_declaration, payroll, bank_statement, id_card, passport, bank_extract, other). Fallback keyword-based cand modelul nu e antrenat inca.

**NER (BERT multilingual):** extrage entitati ca IDNO, cod fiscal, total cu TVA, total fara TVA, numar factura, data emitere, nume furnizor, nume cumparator.

**Urgency Scorer:** calculeaza `urgency_score` 0-100 bazat pe: data scadentei, suma, tipul documentului, apropierea de termen fiscal (ex. pe 20 a lunii urgenta creste daca doc e de tip TVA).

---

## 3. Rapoarte SFS — generator automat

**Ce face:** genereaza PDF-uri pentru formularele fiscale oficiale din Moldova.

| Cod | Frecventa | Deadline | Scop |
|---|---|---|---|
| **IPC21** | lunar | 25 a lunii urm. | Impozit pe venit + CAS/CAM salarii |
| **2-INV** | trimestrial | 25 a lunii de dupa trim. | Situatia investitiilor brute |
| **TL13** | semestrial | 25 iul / 25 ian | Taxele locale |
| **TALS21** | anual | 30 aprilie | Raport anual consolidat |
| **IRM19** | la cerere | — | Angajare/concediu/eliberare |
| **SIMM24** | la cerere | — | Factura fiscala de vanzare |

**Componente:**
- `backend-project/app/services/rapoarte_sfs.py` — generatorii PDF (reportlab) cu antet oficial, calcule automate (impozit 12%, TVA 20%, CAS 9%+24%, CAM 4.5%+4.5%)
- `backend-project/app/api/routes/rapoarte_sfs.py` — endpoint-uri `POST /reports/sfs/generate/{form_type}` + `GET /reports/sfs/upcoming` + `GET /reports/sfs/{id}/download`

**Reminder automat:** endpoint `/reports/sfs/upcoming` intoarce deadline-urile in urmatoarele 60 zile cu `days_left` si `urgency` (urgent/warning/normal) — frontend-ul afiseaza ca push notification + card in home.

---

## 4. Chat cu 3 nivele (FAQ → Djarvis → Contabil)

Cand userul trimite un mesaj pe `/chat/send`:

```
Mesaj ──> FAQ SequenceMatcher+keywords
            │
            ├─ match >= 0.97 ──> raspunde FAQ salvat (instant)
            │
            ▼
          Djarvis RAG (ai-service)
            │
            ├─ raspuns OK ──> salveaza + returneaza la user
            │
            ▼
          Escaladare la contabil asignat
          (creeaza notificare, user primeste reply ulterior)
```

- **Nivel 1 (FAQ):** `SequenceMatcher` + keyword matching pe tabela `faq_entries` — instant, dar limitat la intrebari deja intrebate.
- **Nivel 2 (Djarvis):** RAG cu LLM local — 5-60s, raspunde chiar la intrebari noi.
- **Nivel 3 (Contabil):** cand nici AI-ul nu stie, contabilul asignat primeste notificare si raspunde manual; raspunsul devine FAQ pentru viitor.

---

## 5. Flow-ul intregii aplicatii

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT (web sau mobile)                                      │
│  1. Login (JWT + 2FA optional)                               │
│  2. Scaneaza document / poza / incarca PDF                  │
│  3. Vede documentul procesat in ~15-30s                     │
│  4. Pune intrebare Djarvis in chat                          │
│  5. Primeste reminder "IPC21 scade peste 3 zile"            │
│  6. Genereaza raport (IPC21, SIMM24 factura, etc.)          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ BACKEND (port 3777 — FastAPI)                                │
│  - Autentificare (JWT + refresh + 2FA)                       │
│  - CRUD documente, clienti, rapoarte                         │
│  - Delegheaza procesarea AI catre ai-service                 │
│  - Chat 3 nivele (FAQ → Djarvis → contabil)                 │
│  - PDF generator SFS                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ AI SERVICE (port 3778)                                       │
│  - Pipeline OCR + NER + Classifier + Urgency                │
│  - Djarvis RAG (Ollama + FAISS + embeddings)                │
│  - Training endpoint pentru fine-tune classifier/NER         │
│  - WebSocket pentru status procesare in timp real            │
└──────────────────┬──────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
┌─────────────┐     ┌─────────────┐
│  Ollama     │     │  Celery     │
│  11434      │     │  + Redis    │
│  qwen2.5 3b │     │  (tasks)    │
└─────────────┘     └─────────────┘
```

---

## 6. Roluri si permisiuni

- **ADMIN** — creeaza contabili, asigneaza clienti la contabili, vede tot sistemul. Acces: `/admin`, `/training` tab "Contabili".
- **CONTABIL** — vede clientii asignati de admin si documentele lor. Acces: `/contabil`, revizuire documente.
- **CLIENT** — incarca propriile documente, foloseste chat Djarvis, genereaza rapoarte pentru firma lui.

Admin asigneaza clienti la contabili prin `POST /users/admin/assign-client`. Fiecare client are documentele complet separate (filtrate pe `owner_id`) — contabilul vede doar clientii alocati.

---

## Pornire rapida

```bash
# 1) DB + Redis + Backend + AI + Ollama + Celery (docker stack)
docker compose up -d

# 2) Web (terminal separat)
cd frontend-web-aplication/AI-Contabil
npm install
npm run dev     # -> http://localhost:5173

# 3) Mobile (terminal separat)
cd frontend-mobile-aplication
npm install
npx expo start  # -> scaneaza QR cu Expo Go

# 4) Prima oara: descarca modelul Djarvis si construieste indexul
docker exec ai_contabil_ollama ollama pull qwen2.5:3b-instruct
docker exec ai_contabil_ai_service python scripts/build_legislation_index.py
```

**Conturi de test (dupa seed/register):**
- ADMIN: `test@aicontabil.md` / `Test1234!`
- CONTABIL: `contabil@aicontabil.md` / `Contabil1234!`
- CLIENT: `client@aicontabil.md` / `Client1234!`

**URL-uri:**
- Web: http://localhost:5173
- API docs: http://localhost:3777/docs
- AI docs: http://localhost:3778/docs
- Ollama: http://localhost:11434
- Mobile Expo: `exp://192.168.2.40:8081` (inlocuieste IP-ul cu al PC-ului tau)

Pentru detalii tehnice: vezi [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

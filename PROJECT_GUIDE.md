# AI-CONTABIL — Ghid Tehnic Detaliat al Proiectului

## Cuprins
1. [Despre Proiect](#1-despre-proiect)
2. [Arhitectura Sistemului](#2-arhitectura-sistemului)
3. [Stack Tehnologic](#3-stack-tehnologic)
4. [Backend — API Principal (port 3777)](#4-backend--api-principal-port-3777)
5. [Backend — Serviciul AI (port 3778)](#5-backend--serviciul-ai-port-3778)
6. [Frontend Web (port 5173)](#6-frontend-web-port-5173)
7. [Frontend Mobile (Expo)](#7-frontend-mobile-expo)
8. [Baza de Date](#8-baza-de-date)
9. [Sistemul de Autentificare](#9-sistemul-de-autentificare)
10. [Pipeline-ul AI de Procesare Documente](#10-pipeline-ul-ai-de-procesare-documente)
11. [Sistemul de Chat Inteligent](#11-sistemul-de-chat-inteligent)
12. [Securitate](#12-securitate)
13. [Toate Rutele API](#13-toate-rutele-api)
14. [Deployment](#14-deployment)
15. [Djarvis — Agent RAG Legislativ](#15-djarvis--agent-rag-legislativ)
16. [Rapoarte SFS — Formulare Fiscale Automate](#16-rapoarte-sfs--formulare-fiscale-automate)
17. [Panou Admin & Contabil](#17-panou-admin--contabil)

---

## 1. Despre Proiect

**AI-Contabil** este o platforma inteligenta de contabilitate pentru afacerile mici din Republica Moldova. Platforma automatizeaza procesarea documentelor contabile folosind inteligenta artificiala: OCR (recunoasterea textului), clasificare automata, extractie de entitati si recomandari inteligente.

### De ce aceasta solutie?

**Problema:** Contabilitatea pentru afacerile mici in Moldova este inca un proces manual, costisitor si predispus la erori. Antreprenorii pierd ore intregi completand facturi, declaratii fiscale si rapoarte.

**Solutia:** AI-Contabil automatizeaza intregul flux:
- Clientul incarca un document (factura, chitanta, contract)
- AI-ul extrage automat toate datele (IDNO, sume, TVA, date)
- Sistemul clasifica documentul si calculeaza urgenta
- Contabilul verifica si aproba (sau AI-ul aproba automat daca e sigur >97%)
- Rapoartele se genereaza automat

**De ce este varianta corecta:**
- **100% local** — datele nu parasesc serverul (nu depinde de OpenAI/Google)
- **Multilingv** — suporta Romana, Engleza si Rusa
- **Legislatie moldoveneasca** — respecta Codul Fiscal al RM, SNC-urile si normativele CNAS/CNAM
- **Scalabil** — arhitectura microservicii permite adaugarea de noi modele AI
- **Securizat** — criptare AES-256, JWT cu refresh tokens, audit log

---

## 2. Arhitectura Sistemului

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTI                           │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Web App     │  │  Mobile App  │                 │
│  │  React+Vite  │  │  Expo+RN     │                 │
│  │  port 5173   │  │  port 8081   │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
└─────────┼─────────────────┼─────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              API GATEWAY (CORS)                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐    ┌─────────────────────┐     │
│  │  Backend API    │    │  AI Service          │     │
│  │  FastAPI        │    │  FastAPI + ML        │     │
│  │  port 3777      │    │  port 3778           │     │
│  │                 │    │                      │     │
│  │  - Auth (JWT)   │    │  - OCR (PaddleOCR)   │     │
│  │  - Users        │    │  - Classifier (BERT) │     │
│  │  - Documents    │    │  - NER (BERT)        │     │
│  │  - Reports      │    │  - Urgency Scorer    │     │
│  │  - Notifications│    │  - Recommender(FAISS)│     │
│  │  - Training     │    │  - Training Pipeline │     │
│  │  - Chat/FAQ     │    │                      │     │
│  └────────┬────────┘    └──────────┬───────────┘     │
│           │                        │                 │
│           ▼                        ▼                 │
│  ┌─────────────────┐    ┌──────────────────┐        │
│  │  PostgreSQL 16  │    │  Redis 7         │        │
│  │  port 5432      │    │  port 6379       │        │
│  │                 │    │  - Celery Broker  │        │
│  │  - Users        │    │  - Pub/Sub       │        │
│  │  - Documents    │    │  - Cache         │        │
│  │  - FAQ/Chat     │    │                  │        │
│  │  - Reports      │    └──────────────────┘        │
│  │  - Audit Logs   │                                │
│  └─────────────────┘    ┌──────────────────┐        │
│                         │  Celery Workers  │        │
│                         │  - OCR tasks     │        │
│                         │  - Retraining    │        │
│                         │  - Notifications │        │
│                         └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### De ce aceasta arhitectura?

**Microservicii separate (Backend + AI Service):**
- Backend-ul principal este rapid si nu se blocheaza cand AI-ul proceseaza un document
- AI Service-ul poate fi scalat independent (mai multe instante pentru procesare)
- Daca AI-ul se strica, aplicatia de baza functioneaza in continuare

**PostgreSQL (nu MongoDB/MySQL):**
- Relatii complexe intre entitati (user -> companie -> documente -> campuri_extrase)
- Tranzactii ACID garantate — important pentru date financiare
- Suport nativ pentru UUID-uri si JSON
- Extensii pgvector pentru embeddings

**Redis + Celery (nu RabbitMQ):**
- Redis e simplu de configurat si rapid
- Celery e cel mai matur framework de task-uri asincrone in Python
- Suport nativ pentru retry, scheduling si monitoring

---

## 3. Stack Tehnologic

### Frontend Web
| Tehnologie | Versiune | Scop |
|-----------|----------|------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.1 | Build tool (rapid, HMR) |
| Tailwind CSS | 4.2.1 | Styling utility-first |
| Material UI | 7.3.8 | Componente si iconite |
| React Router | 7.13.1 | Navigare SPA |

**De ce React + Vite (nu Next.js)?**
- Aplicatia este un SPA (Single Page Application) — nu are nevoie de SSR
- Vite este de 10-100x mai rapid decat Webpack la development
- React 19 aduce React Compiler — performanta mai buna fara memo/useMemo manual

### Frontend Mobile
| Tehnologie | Versiune | Scop |
|-----------|----------|------|
| React Native | 0.81.5 | Cross-platform mobile |
| Expo | 54.0.33 | Build, deploy, OTA updates |
| Expo Router | 6.0.23 | File-based routing |
| Zod | 4.3.6 | Validare date runtime |

### Backend
| Tehnologie | Versiune | Scop |
|-----------|----------|------|
| Python | 3.12+ | Limbaj principal |
| FastAPI | 0.115.6 | Web framework (async, tipizat) |
| SQLAlchemy | 2.0+ | ORM (Object-Relational Mapping) |
| Alembic | - | Migratii baza de date |
| Pydantic | 2.0+ | Validare date + serializare |
| bcrypt | - | Hashing parole |
| PyJWT | - | Token-uri JWT |

**De ce FastAPI (nu Django/Flask)?**
- Tipizare automata cu Pydantic — validarea se face automat
- Documentatie Swagger generata automat (`/docs`)
- Async nativ — performanta superioara pentru I/O
- Modern, comunitate activa, perfect pentru API-uri REST

### AI / Machine Learning
| Tehnologie | Versiune | Scop |
|-----------|----------|------|
| PaddleOCR | 2.10.0 | Recunoastere text din imagini |
| Transformers | 4.47.1 | Modele BERT pre-antrenate |
| PyTorch | 2.5.1 | Framework deep learning |
| FAISS | 1.9.0 | Cautare vectoriala rapida |
| scikit-learn | 1.6.1 | Utilitati ML clasice |
| OpenCV | 4.10.0 | Preprocesare imagini |

**De ce PaddleOCR (nu Tesseract)?**
- Acuratete superioara pe texte in limba romana
- Suport nativ pentru mai multe limbi simultan (ro, en, ru)
- Detecteaza pozitia fiecarui cuvant (nu doar textul)
- Model pre-antrenat optimizat — nu necesita antrenare suplimentara

**De ce BERT multilingual (nu GPT)?**
- Ruleaza 100% local — fara costuri API, fara trimitere date in cloud
- bert-base-multilingual-cased suporta romana nativ
- Performanta excelenta pentru clasificare si NER dupa fine-tuning
- Dimensiune mica (~440MB) — rapid pe CPU

---

## 4. Backend — API Principal (port 3777)

### Structura Directoarelor

```
backend-project/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── core/
│   │   ├── config.py        # Configurari (env vars)
│   │   ├── database.py      # Conexiune PostgreSQL
│   │   └── security.py      # JWT, bcrypt, helpers
│   ├── api/
│   │   ├── deps.py          # Dependente (auth, roles)
│   │   └── routes/
│   │       ├── auth.py      # Autentificare
│   │       ├── users.py     # Gestionare utilizatori
│   │       ├── documents.py # Upload si gestionare documente
│   │       ├── reports.py   # Generare rapoarte
│   │       ├── notifications.py # Notificari
│   │       ├── training.py  # Antrenare AI
│   │       └── chat.py      # Chat inteligent + FAQ
│   ├── models/              # Modele SQLAlchemy (ORM)
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── faq.py           # Chat + FAQ
│   │   └── ...
│   └── schemas/             # Scheme Pydantic (validare)
│       ├── auth.py
│       ├── chat.py
│       └── ...
├── alembic/                 # Migratii DB
├── storage/uploads/         # Fisiere uploadate
├── requirements.txt
└── Dockerfile
```

### Cum functioneaza un request tipic

```
1. Client trimite: POST /api/v1/ac/documents/upload
   Header: Authorization: Bearer <jwt_token>
   Body: FormData { file, title, document_type }

2. FastAPI:
   a) Parseaza request-ul
   b) Valideaza token-ul JWT (deps.py -> get_current_user)
   c) Verifica rolul utilizatorului
   d) Valideaza datele cu Pydantic schema
   e) Executa logica din route handler (documents.py)
   f) Salveaza fisierul pe disk (storage/uploads/)
   g) Creaza inregistrare in PostgreSQL
   h) Returneaza raspuns JSON

3. Client primeste: { id, title, file_name, status: "incarcat", ... }
```

---

## 5. Backend — Serviciul AI (port 3778)

### Pipeline-ul de Procesare

```
Document Upload
      │
      ▼
┌──────────────┐
│  Preprocess   │  OpenCV: resize, denoise, binarize
│  (OpenCV)     │  Min DPI: 150
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  OCR          │  PaddleOCR: extrage text + pozitii
│  (PaddleOCR)  │  Limbi: ro, en, ru
│               │  Confidence per cuvant
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Clasificare  │  BERT: determina tipul documentului
│  (BERT)       │  7 clase: factura, chitanta, contract,
│               │  declaratie_fiscala, stat_plata,
│               │  extras_bancar, altele
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  NER          │  BERT: extrage campuri specifice
│  (BERT)       │  8 entitati: INVOICE_NUM, DATE, VENDOR,
│               │  CUI/IDNO, AMOUNT, VAT, TOTAL, IBAN
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Urgency      │  Hybrid: 60% reguli + 40% ML
│  Scorer       │  Score 0-100
│               │  Auto-approve daca: conf>=92%, urg<=70
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Recommender  │  FAISS: cauta documente similare
│  (FAISS)      │  Sentence-Transformers embeddings
└──────┬───────┘
       │
       ▼
  Rezultat Final
  - Text extras cu pozitii
  - Tip document + confidence
  - Campuri extrase + confidence
  - Scor urgenta
  - Documente similare recomandate
```

### De ce acest pipeline?

**Etapa 1 — Preprocess:** Documentele scanate sunt adesea inclinare, cu zgomot sau contrast slab. OpenCV corecteaza aceste probleme inainte de OCR.

**Etapa 2 — OCR:** PaddleOCR este cel mai precis OCR open-source. Suporta 80+ limbi si returneaza coordonatele fiecarui cuvant — esential pentru a sti UNDE pe document se afla fiecare informatie.

**Etapa 3 — Clasificare:** Nu toate documentele se proceseaza la fel. O factura necesita extractia TVA-ului, un contract necesita partile contractante. BERT clasifica documentul pentru a sti CE sa extraga.

**Etapa 4 — NER (Named Entity Recognition):** BERT fine-tuned pe documente contabile romanesti extrage automat campurile cheie. Foloseste schema BIO (Beginning-Inside-Outside) pentru a marca fiecare token.

**Etapa 5 — Urgency Scoring:** Nu toate documentele au aceeasi prioritate. O factura cu termen de plata maine e mai urgenta decat un contract semnat luna trecuta. Scoring-ul hybrid combina reguli (termen scadent, suma) cu ML.

**Etapa 6 — Recommender:** Cand contabilul proceseaza un document, sistemul recomanda documente similare deja procesate. Foloseste embeddings vectoriale si FAISS pentru cautare rapida in milisecunde.

---

## 6. Frontend Web (port 5173)

### Structura Paginilor

```
src/
├── App.tsx                  # Router principal + LanguageProvider
├── context/
│   ├── AuthContext.tsx       # Autentificare globala (JWT)
│   └── LanguageContext.tsx   # Limba globala (localStorage)
├── api/
│   ├── apiClient.ts         # HTTP client cu JWT auto-refresh
│   ├── authApi.ts           # Login, Register, Token refresh
│   ├── chatApi.ts           # Chat API
│   └── ...
├── components/
│   ├── Navbar/              # Navigare + language switcher
│   ├── Footer/              # Footer cu linkuri oficiale
│   └── ChatWidget/          # Chat AI flotant
├── pages/
│   ├── Home/                # Landing page cu 7 sectiuni
│   │   └── sections/
│   │       ├── HeroSection      # Banner principal
│   │       ├── AboutSection     # Despre platforma
│   │       ├── LawsSection      # Legislatie (8 legi)
│   │       ├── StagesSection    # Etape creare document
│   │       ├── DocumentsSection # Top 3 documente
│   │       ├── NewsSection      # Noutati contabilitate
│   │       └── ConnectSection   # Formular consultare
│   ├── SignIn/              # Logare
│   ├── SignUp/              # Inregistrare (2 pasi: cont + companie)
│   ├── Documents/           # Gestionare documente
│   ├── Reports/             # Rapoarte financiare
│   ├── Training/            # Antrenare AI
│   └── Settings/            # Setari cont + securitate
```

### Sistemul de Traduceri (i18n)

Aplicatia suporta 3 limbi: **Romana**, **Engleza**, **Rusa**.

**Cum functioneaza:**
1. `LanguageContext` pastreaza limba curenta in React Context + localStorage
2. Fiecare componenta importa `useLanguage()` si acceseaza `lang`
3. Obiect de traduceri `t` definit local in componenta cu cheile `ro`, `en`, `ru`
4. Textul se afiseaza cu `tr.cheie` unde `tr = t[lang]`

**Exemplu:**
```tsx
const t = {
  ro: { title: 'Bine ai venit!' },
  en: { title: 'Welcome!' },
  ru: { title: 'Добро пожаловать!' },
};

const MyComponent = () => {
  const { lang } = useLanguage();
  const tr = t[lang];
  return <h1>{tr.title}</h1>;
};
```

**De ce aceasta abordare (nu i18next)?**
- Zero dependente externe — nu adauga la bundle size
- Type-safe — TypeScript verifica ca toate cheile exista in toate limbile
- Simplu de inteles si modificat
- Performant — nu exista overhead de librarie

### Responsive Design

Aplicatia foloseste **Tailwind CSS breakpoints**:
- `max-md:` — ecrane mai mici de 768px (telefoane)
- `max-lg:` — ecrane mai mici de 1024px (tablete)

**Principiu:** Mobile-first nu e folosit. Designul principal e desktop, cu adaptari pentru mobil prin `max-md:`.

---

## 7. Frontend Mobile (Expo)

```
frontend-mobile-aplication/
├── app/
│   ├── (autentificare)/     # Stack navigation
│   │   ├── logare.tsx       # Login
│   │   └── inregistrare.tsx # Register
│   ├── (taburi)/            # Tab navigation
│   │   ├── index.tsx        # Dashboard
│   │   ├── creare.tsx       # Upload document
│   │   ├── profil.tsx       # Profil
│   │   ├── notificari.tsx   # Notificari
│   │   └── meniu.tsx        # Meniu
│   └── _layout.tsx          # Root layout
├── context/
│   └── AuthContext.tsx       # Auth cu expo-secure-store
└── api/
    └── apiClient.ts          # HTTP client
```

**De ce Expo (nu React Native CLI)?**
- OTA (Over-The-Air) updates — push fara App Store review
- File-based routing (similar Next.js)
- Expo modules pre-configurate (camera, file system, secure store)
- Build in cloud (EAS Build) — nu necesita Xcode local

---

## 8. Baza de Date

### Diagrama Relatiilor

```
Users ──────────────┐
  │                  │
  ├── Documents      ├── Companies
  │     │            │
  │     ├── ExtractedFields
  │     ├── DocumentEmbeddings
  │     └── TrainingExamples
  │
  ├── Reports
  ├── Notifications
  ├── AuditLogs
  │
  ├── ChatConversations
  │     └── ChatMessages
  │           └── FaqEntries
  │
  └── AccountantClients (user <-> contabil)
```

### Tabele Principale

| Tabel | Scop | Campuri cheie |
|-------|------|---------------|
| users | Utilizatori | id, username, email, role (CLIENT/CONTABIL/ADMIN), company_id |
| companies | Companii | id, name, idno, vat_code, legal_address, iban |
| documents | Documente uploadate | id, owner_id, title, file_name, document_type, status, urgency_score |
| extracted_fields | Campuri extrase de AI | id, document_id, field_name, field_value, confidence |
| reports | Rapoarte generate | id, client_id, title, report_type, content |
| faq_entries | Baza de cunostinte chat | id, question, answer, keywords, usage_count |
| chat_conversations | Conversatii chat | id, user_id, is_escalated, is_resolved |
| chat_messages | Mesaje individuale | id, conversation_id, sender_type, content, confidence |
| training_examples | Date pentru reantrenare | id, document_id, original_text, predicted_entities, corrected_entities |
| model_versions | Versiuni modele ML | id, name, version, accuracy, dataset_size |
| audit_logs | Jurnal activitati | id, user_id, action, resource_type, details |

### Roluri Utilizatori

| Rol | Permisiuni |
|-----|-----------|
| CLIENT | Upload documente, vizualizare proprii, chat |
| CONTABIL | Toate documentele, creare rapoarte, raspuns chat, antrenare AI |
| ADMIN | Tot + gestionare utilizatori + modele + audit |

---

## 9. Sistemul de Autentificare

### Flux JWT (JSON Web Tokens)

```
1. REGISTER
   Client -> POST /api/v1/ac/auth/register { username, email, password, ... }
   Server -> Valideaza + hash password (bcrypt) + salveaza in DB
   Server -> 201 Created { user_id, username, email, role }

2. LOGIN
   Client -> POST /api/v1/ac/auth/login { username, password }
   Server -> Verifica bcrypt hash
   Server -> Genereaza access_token (30 min) + refresh_token (7 zile)
   Server -> 200 OK { access_token, refresh_token, token_type: "bearer" }

3. REQUEST AUTENTIFICAT
   Client -> GET /api/v1/ac/documents/
   Header: Authorization: Bearer <access_token>
   Server -> Decodeaza JWT -> extrage user_id -> verifica in DB
   Server -> 200 OK { documents: [...] }

4. TOKEN EXPIRED
   Client -> GET /api/v1/ac/documents/ -> 401 Unauthorized
   Client -> POST /api/v1/ac/auth/refresh { refresh_token }
   Server -> Valideaza refresh_token -> genereaza nou access_token
   Server -> 200 OK { access_token, refresh_token }
   Client -> Retry request original cu noul token
```

### De ce JWT (nu Session Cookies)?

- **Stateless** — serverul nu pastreaza sesiuni in memorie
- **Scalabil** — orice instanta de server poate verifica token-ul
- **Cross-platform** — functioneaza identic pe web, mobile si API extern
- **Refresh tokens** — securitate sporita (access token scurt, refresh lung)

### Securitate Parole

- **Hashing:** bcrypt cu salt automat (passlib)
- **Validare:** Min 8 caractere, max 128, cel putin 1 majuscula, 1 minuscula, 1 cifra
- **Stocare:** Doar hash-ul se salveaza in DB (niciodata parola in clar)
- **Verificare:** bcrypt.verify compara hash-urile (constant-time)

---

## 10. Pipeline-ul AI de Procesare Documente

### OCR — Recunoasterea Textului

**Tehnologie:** PaddleOCR 2.10.0
**Limbi:** Romana, Engleza, Rusa

```python
# Exemplu simplificat
from paddleocr import PaddleOCR

ocr = PaddleOCR(lang='ro', use_angle_cls=True)
result = ocr.ocr('factura.pdf')

# Rezultat:
# [
#   { "text": "FACTURA FISCALA", "position": [[10,20],[200,20],[200,50],[10,50]], "confidence": 0.98 },
#   { "text": "Nr. 001234", "position": [[10,60],[150,60],[150,80],[10,80]], "confidence": 0.95 },
#   ...
# ]
```

**Preprocesare (OpenCV):**
1. Conversie la grayscale
2. Denoise (Non-local Means)
3. Adaptive thresholding
4. Deskew (corectare inclinare)
5. Verificare DPI minim (150)

### Clasificare — Determinarea Tipului

**Model:** BERT base multilingual cased (fine-tuned)
**7 clase:**

| Clasa | Descriere | Keywords |
|-------|-----------|----------|
| invoice | Factura fiscala | factura, invoice, TVA, total |
| receipt | Chitanta | chitanta, receipt, bon, casa |
| contract | Contract | contract, parti, clauze, semnat |
| tax_declaration | Declaratie fiscala | declaratie, VEN, TVA, fiscal |
| payroll | Stat de plata | salariu, angajat, contributii |
| bank_statement | Extras bancar | extras, cont, tranzactii, sold |
| other | Alte documente | - |

**Fallback:** Daca BERT nu este disponibil, se foloseste clasificare pe baza de keywords (regex pattern matching).

### NER — Extractie Entitati

**Model:** BERT multilingual fine-tuned pentru BIO tagging
**8 tipuri de entitati:**

| Entitate | Exemplu | Pattern Regex Fallback |
|----------|---------|----------------------|
| INVOICE_NUM | Nr. 001234 | `(?:nr|no|numar)[\.\s]*(\d+)` |
| DATE | 15.03.2026 | `\d{1,2}[./]\d{1,2}[./]\d{2,4}` |
| VENDOR | SRL "TechMD" | Dupa "Furnizor:" sau "De la:" |
| CUI | IDNO 1234567890123 | `\d{13}` (13 cifre) |
| AMOUNT | 15,000.50 MDL | `[\d,.]+\s*(?:MDL|lei|RON)` |
| VAT | TVA 20% = 3,000.10 | `(?:TVA|НДС|VAT)\s*[\d,.%]+` |
| TOTAL | Total: 18,000.60 | `(?:Total|TOTAL|Итого)\s*:?\s*[\d,.]+` |
| IBAN | MD24AG000000011100193 | `MD\d{2}[A-Z]{2}\d{18}` |

### Scor Urgenta

**Formula:** `urgency = rules_score * 0.6 + ml_score * 0.4`

**Reguli (60%):**
- Termen scadent < 3 zile → +40 puncte
- Suma > 50,000 MDL → +20 puncte
- Document fiscal obligatoriu → +15 puncte
- Client VIP → +10 puncte

**ML (40%):**
- Model antrenat pe istoricul de documente procesate
- Invata din tiparele contabilului (ce documente proceseaza prioritar)

**Auto-procesare:** Daca `confidence >= 92%` SI `urgency <= 70` → documentul se aproba automat fara review uman.

---

## 11. Sistemul de Chat Inteligent

### Flux Complet

```
1. Client deschide chat-ul (ChatWidget)
2. Scrie intrebarea: "Care este termenul de depunere a declaratiei TVA?"
3. Backend cauta in baza FAQ cea mai buna potrivire
4. Algoritm de matching:
   - 70% similaritate text (SequenceMatcher)
   - 30% keyword matching (keywords din FAQ)
   
5a. Daca confidence >= 97%:
    → AI raspunde automat cu raspunsul din FAQ
    → Incrementeaza usage_count pe FAQ entry
    
5b. Daca confidence < 97%:
    → AI raspunde: "Nu sunt suficient de sigur (precizie X%).
       Am creat o solicitare catre contabilul nostru.
       Veti primi o notificare cand raspunsul e gata."
    → Conversatia se marcheaza ca "escalated"
    → Contabilul vede conversatia in lista "escalated"
    
6. Contabilul raspunde la conversatia escalata
7. Raspunsul se salveaza AUTOMAT in baza FAQ
8. Data viitoare cand un client pune aceeasi intrebare → AI raspunde instant
```

### De ce aceasta abordare?

**Invatare continua:** Cu fiecare raspuns al contabilului, AI-ul devine mai inteligent. Nu necesita re-antrenare — baza FAQ creste organic.

**Threshold 97%:** Ales pentru a minimiza raspunsuri gresite. In contabilitate, un raspuns gresit poate costa bani — mai bine escaladeaza decat sa greseasca.

**SequenceMatcher:** Algoritm simplu dar eficient pentru matching text. Nu necesita GPU. Pentru viitor se poate inlocui cu sentence-transformers + cosine similarity.

---

## 12. Securitate

### Masuri Implementate

| Masura | Implementare | Locatie |
|--------|-------------|---------|
| Hashing parole | bcrypt (passlib) | core/security.py |
| JWT cu expirare | Access 30min, Refresh 7 zile | core/security.py |
| Validare input | Pydantic schemas cu max_length | schemas/*.py |
| CORS restrictiv | Whitelist origins, methods, headers | main.py |
| File upload | Whitelist MIME, max 10MB, UUID filename | routes/documents.py |
| Role-based access | get_current_user + require_role | api/deps.py |
| Criptare AES-256 | Campuri sensibile criptate | AI service |
| Audit logging | Jurnal activitati tamper-evident | AI service |
| SQL Injection | ORM SQLAlchemy (parametrizat) | Toate rutele |
| XSS Protection | React escaping automat | Toate componentele |

### Validare Parole

```python
# Min 8, max 128 caractere
# Cel putin 1 majuscula, 1 minuscula, 1 cifra
# Blocheaza parolele comune (123456789, password, qwerty123)

COMMON_PASSWORDS = {"12345678", "123456789", "password", "qwerty123", ...}

def password_strong(password: str) -> str:
    if len(password) < 8: raise ValueError("Min 8 caractere")
    if len(password) > 128: raise ValueError("Max 128 caractere")
    if not re.search(r"[A-Z]", password): raise ValueError("Cel putin 1 majuscula")
    if not re.search(r"[a-z]", password): raise ValueError("Cel putin 1 minuscula")
    if not re.search(r"\d", password): raise ValueError("Cel putin 1 cifra")
    if password.lower() in COMMON_PASSWORDS: raise ValueError("Parola prea comuna")
    return password
```

### Rute API cu prefix securizat

Toate rutele folosesc prefixul `/api/v1/ac/` unde:
- `/api` — standard API
- `/v1` — versiune (permite migrare viitoare la v2)
- `/ac` — prefix custom AI-Contabil (non-guessable)

---

## 13. Toate Rutele API

### Autentificare (`/api/v1/ac/auth/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| POST | /register | Nu | Creare cont nou |
| POST | /login | Nu | Autentificare + obtinere tokens |
| POST | /refresh | Nu | Refresh access token |
| GET | /me | Da (JWT) | Profil utilizator curent |

### Utilizatori (`/api/v1/ac/users/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| GET | /me | Da | Profil curent |
| PUT | /me | Da | Actualizare profil |
| POST | /me/change-password | Da | Schimbare parola |
| POST | /me/avatar | Da | Upload avatar |
| GET | / | Admin/Contabil | Lista utilizatori |
| GET | /my-clients | Contabil/Admin | Clientii asignati |
| POST | /assign-client | Contabil/Admin | Asignare client |
| GET | /{user_id} | Admin/Contabil | Detalii utilizator |

### Documente (`/api/v1/ac/documents/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| POST | /upload | Da | Upload document |
| GET | / | Da (role-based) | Lista documente |
| GET | /{id} | Da (owner/contabil) | Detalii document |
| PUT | /{id} | Da | Actualizare metadata |
| DELETE | /{id} | Da | Stergere document |

### Rapoarte (`/api/v1/ac/reports/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| POST | / | Contabil/Admin | Creare raport |
| GET | / | Da (role-based) | Lista rapoarte |
| GET | /{id} | Da | Detalii raport |
| PUT | /{id} | Contabil/Admin | Actualizare raport |
| DELETE | /{id} | Contabil/Admin | Stergere raport |

### Notificari (`/api/v1/ac/notifications/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| GET | / | Da | Lista notificari |
| PUT | /{id}/read | Da | Marcheaza ca citita |
| PUT | /read-all | Da | Marcheaza toate ca citite |
| DELETE | /{id} | Da | Stergere notificare |

### Antrenare AI (`/api/v1/ac/training/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| GET | /stats | Contabil/Admin | Statistici antrenare |
| GET | /documents | Contabil/Admin | Documente pentru review |
| GET | /documents/{id}/ocr | Contabil/Admin | Date OCR |
| POST | /documents/{id}/correct | Contabil/Admin | Trimite corectii |
| POST | /documents/{id}/confirm | Contabil/Admin | Confirma document |
| GET | /models | Admin | Lista modele |

### Chat & FAQ (`/api/v1/ac/chat/`)
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| POST | /send | Da | Trimite mesaj in chat |
| GET | /conversations | Da | Lista conversatii |
| GET | /conversations/{id} | Da | Detalii conversatie |
| POST | /faq | Contabil/Admin | Adauga FAQ |
| GET | /faq | Da | Lista FAQ |
| GET | /escalated | Contabil/Admin | Conversatii escalate |
| POST | /respond/{id} | Contabil/Admin | Raspuns la escalare |

### Health Check
| Metoda | Ruta | Protejata | Descriere |
|--------|------|-----------|-----------|
| GET | /api/v1/ac/health | Nu | Stare server |

---

## 14. Deployment

### Docker Compose (Productie)

```bash
docker-compose up -d
```

**Servicii pornite:**
1. **postgres** — PostgreSQL 16 (port 5432)
2. **redis** — Redis 7 (port 6379)
3. **backend** — FastAPI principal (port 3777)
4. **ai-service** — FastAPI AI (port 3778)
5. **celery-worker** — Procesare asincrona
6. **celery-beat** — Task-uri programate

### Development Local

```bash
# Terminal 1: Frontend
cd frontend-web-aplication/AI-Contabil
npm run dev
# http://localhost:5173

# Terminal 2: Backend
cd backend-project
DATABASE_URL="postgresql://..." uvicorn app.main:app --reload --port 3777

# Terminal 3: AI Service (optional)
cd backend-project/ai-service
uvicorn app.main:app --reload --port 3778
```

### Variabile de Mediu Necesare

```env
# Baza de date
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_contabil_db

# JWT (genereaza chei unice!)
JWT_SECRET_KEY=<random-32-chars>
JWT_REFRESH_SECRET_KEY=<random-32-chars>

# Server
BACKEND_PORT=3777
AI_SERVICE_PORT=3778

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081

# Upload
UPLOAD_DIR=storage/uploads
MAX_UPLOAD_SIZE_MB=10

# OCR
OCR_LANGUAGES=["ro","en","ru"]

# Criptare
ENCRYPTION_KEY_DEFAULT=<base64-32-bytes>
```

---

## Autor

**Maxim Chistol** — Teza de Licenta
Universitatea  Tehnica din Moldova

---

## 15. Djarvis — Agent RAG Legislativ

**Djarvis** e un agent conversational care raspunde la intrebari despre legislatia fiscala si contabila a Republicii Moldova. Nume-ul e inspirat din JARVIS (Iron Man), dar rebranded cu "D".

### Arhitectura — Retrieval-Augmented Generation (RAG)

Spre deosebire de un chatbot clasic care "halucineaza" raspunsuri din cunoasterea modelului, Djarvis **cauta intai in corpus-ul de legislatie**, apoi pune LLM-ul sa raspunda strict pe ce a gasit:

```
Intrebare user
     │
     ▼
sentence-transformers multilingual  (embedding 384-dim)
     │
     ▼
FAISS IndexFlatIP (cosine similarity)  — top-5 chunks relevante
     │
     ▼
Prompt sistem + chunks + istoric conversatie + intrebare
     │
     ▼
Ollama qwen2.5:3b-instruct  (keep_alive=30min, num_ctx=2048)
     │
     ▼
Raspuns cu citari [1], [2] + pas practic sugerat
```

### Componente cod

| Fisier | Rol |
|---|---|
| `ai-service/app/agent/prompt.py` | Prompt de sistem — personalitate Djarvis, reguli: foloseste context cand exista, raspunde din cunostinte cand nu, cere detalii cand e vag, nu inventa articole |
| `ai-service/app/agent/ollama_client.py` | Client HTTP async (httpx) catre Ollama; functii `genereaza()` si `genereaza_stream()`; `keep_alive=30m` |
| `ai-service/app/agent/retriever.py` | Singleton `LegisReteriever` — incarca embedder (~90 MB) + index FAISS + mapping la primul apel |
| `ai-service/app/api/routes/agent.py` | Endpoint-uri `POST /api/v1/agent/ask` si `GET /api/v1/agent/health` |
| `ai-service/scripts/build_legislation_index.py` | Script offline — citeste `.jsonl`-urile, chunk-uieste (~900 chars, overlap 120), normalizeaza embeddings, scrie `index.faiss` + `mapping.json` |

### Corpus de legislatie

Locatia: `backend-project/training-data/legislatie/*.jsonl`. Fiecare linie: `{"source": "...", "text": "..."}`.

Corpus actual: **51 chunks** in 2 fisiere:
- `seed_legislatie_rm.jsonl` — 18 articole din Cod Fiscal (art. 15, 96, 102, 117, 187, 228, 86, 277, 12^1, 88), Legea Contabilitatii 287/2017, Codul Muncii art. 130, HG 693/2018, + scenarii practice (decizie SFS, intarziere TVA, angajare prim angajat, inregistrare SRL)
- `seed_extins_scenarii.jsonl` — 33 scenarii: freelance/IT Park, II vs SRL, chirie, part-time, concedii (anual/medical/maternitate), demisie, concediere, salariu brut/net, CNAS/CNAM, IPC21/D200, e-Factura, pierderi fiscale, cesiune parti sociale, import/export, deductibile, casa marcat, sediu, zile libere, cadouri.

Cand vrei sa adaugi continut:
1. Adauga linii in `.jsonl` (sau fisier nou in folder)
2. Reruleaza `docker exec ai_contabil_ai_service python scripts/build_legislation_index.py`
3. Restart ai-service (pentru a forta reincarcare retriever) sau apeleaza endpoint-ul `/health` care re-verifica

### Integrare cu chat-ul clasic

Backend-ul `chat.py` cheama Djarvis cand FAQ match < 0.97:

```python
if faq_match and confidence >= 0.97:
    # FAQ instant
elif djarvis_raspunde := intreaba_djarvis(mesaj, istoric):
    # Djarvis RAG
else:
    # Escaladare la contabil
```

Astfel ai un **sistem in 3 nivele**: FAQ rapid → Djarvis conversational → Contabil uman (escaladare reala).

### Performanta onesta

- **Cold start** (model neincarcat in RAM): 30-60 secunde prima intrebare
- **Warm** (keep_alive activ, model in RAM): 5-20 secunde per intrebare
- **Hardware minim**: 4 GB RAM libere pentru modelul 3B + overhead
- **Cu GPU NVIDIA**: 1-3 secunde per intrebare (nu e inca configurat)

### UI

- **Web** — `ChatWidget.tsx` (bula in colt dreapta-jos). Rebranded "Djarvis".
- **Mobile** — `components/chat-djarvis/` (modal full-screen). Deschis din banner "Intrebare urgenta" sau din lista conversatiilor.

---

## 16. Rapoarte SFS — Formulare Fiscale Automate

Sistemul genereaza PDF-uri pentru **6 formulare fiscale** oficiale ale Serviciului Fiscal de Stat (RM), cu calcule automate:

| Cod | Frecventa | Deadline | Calcule in PDF |
|---|---|---|---|
| **IPC21** | lunar | 25 a lunii urm. | Impozit 12% + CAS 9%/24% + CAM 4.5%/4.5% pe salarii, scutire personala 2475 MDL/luna |
| **2-INV** | trimestrial | 25 a lunii de dupa trim. | Cumul valori investitii brute |
| **TL13** | semestrial | 25 iul / 25 ian | Taxe locale per categorie × cota × baza |
| **TALS21** | anual | 30 aprilie | Raport anual (reutilizeaza builder-ul 2-INV cu flag anual) |
| **IRM19** | la cerere | — | Sablon per actiune (angajare/concediu/eliberare/modificare_salariu/suspendare) |
| **SIMM24** | la cerere | — | Factura fiscala cu TVA 20%, subtotal, total cu TVA |

### Fisiere cheie

- `backend-project/app/services/rapoarte_sfs.py` — 6 functii `build_*_pdf()` care intorc `bytes` PDF. Folosesc `reportlab` cu stiluri uniforme (antet SFS, tabele cu header albastru/total highlighted, footer cu note legale).
- `backend-project/app/api/routes/rapoarte_sfs.py` — router `/api/v1/ac/reports/sfs/*` cu endpoint-urile de generare, upcoming, download.
- `backend-project/app/models/report.py` — `ReportType` extins cu `IPC21/RAPORT_2INV_TRIM/TL13/TALS21/IRM19/SIMM24`; coloane noi `frequency` + `due_date`.

### Reminder automat de deadline

`GET /api/v1/ac/reports/sfs/upcoming` calculeaza pentru urmatoarele 60 zile care formulare periodice are de depus user-ul. Fiecare item are `days_left` si `urgency` (`urgent` <=3 zile, `warning` <=10 zile, `normal` peste). Frontend-ul afiseaza asta ca notificare + card in home.

Deadline-urile sunt calculate din functii simple (`_deadline_pentru()`), nu hardcoded — respecta regulile fiscale reale (25 a lunii urmatoare etc.).

### Limita onesta de fidelitate

Aceste PDF-uri **nu sunt pixel-perfect** cu templatele oficiale SFS (care sunt restrictionate). Reproducem:
- Codul formularului (IPC21, SIMM24 etc.) si denumirea oficiala
- Datele obligatorii (contribuabil, cod fiscal, perioada)
- Calculele corecte conform legislatiei
- Footer care clarifica ca pentru depunere oficiala e nevoie de e-Factura / SIA / semnatura electronica

Pentru **depunerea efectiva la SFS**, user-ul trebuie sa ia datele din PDF-ul generat si sa le copieze pe portalul oficial `sfs.md` — PDF-ul serveste ca draft/arhiva.

---

## 17. Panou Admin & Contabil

Aplicatia are o ierarhie clara de roluri: **ADMIN → CONTABIL → CLIENT**.

### Admin

Endpoint-uri (admin-only, cerinta `require_role(UserRole.ADMIN)`):
- `POST /api/v1/ac/users/create-contabil` — creeaza direct un cont cu rol CONTABIL (fara inregistrare ca client mai intai)
- `PATCH /api/v1/ac/users/{user_id}/role` — schimba rolul oricui (`admin`/`contabil`/`client`)
- `POST /api/v1/ac/users/admin/assign-client` — asigneaza un client la un contabil (body: `{contabil_id, client_id}`)
- `DELETE /api/v1/ac/users/admin/assign-client` — dezasigneaza
- `GET /api/v1/ac/users/contabil/{id}/clients` — clientii unui contabil anume

UI web: `/admin` (pagina standalone) si `/training` tab "Contabili" (acelasi continut, integrat in pagina Antrenare). Tab-ul e ascuns automat pentru non-admin.

### Contabil

- `GET /api/v1/ac/users/my-clients` — clientii asignati de admin
- `POST /api/v1/ac/users/assign-client?client_id=...` — contabilul ISI poate si el asigna un client (auto-service, pastrat pentru flexibilitate — admin poate limita acest flux)

UI web: `/contabil` — lista cu card-uri clienti, link spre `/documents?client=...` si `/reports?client=...`. Separare stricta: fiecare client are documentele proprii, filtrate pe `owner_id`. Contabilul NU vede documentele altor contabili.

### Client

Vede doar propriile documente si chat-uri. Rolul default la register.

### Guard-ul de rol pe frontend

`App.tsx` are componenta `RoleGuard` care redirect-eaza automat la `/home` daca rolul nu are permisiuni pe pagina. Nu permite acces "ghicit" la URL.

---

*Acest document a fost generat ca parte a documentatiei tehnice pentru proiectul AI-Contabil.*

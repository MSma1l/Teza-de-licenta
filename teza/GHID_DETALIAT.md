# AI-Contabil — Ghid Detaliat (ce se intampla, pas cu pas)

Document companion la [README.md](README.md) si [PROJECT_GUIDE.md](PROJECT_GUIDE.md). Explica EXACT ce se intampla la fiecare actiune a userului, ce sistem, ce fisier, ce endpoint.

---

## Cuprins

1. [Scenariul A — Client scaneaza o factura de pe telefon](#scenariul-a--client-scaneaza-o-factura-de-pe-telefon)
2. [Scenariul B — Client intreaba Djarvis "Cat e TVA?"](#scenariul-b--client-intreaba-djarvis-cat-e-tva)
3. [Scenariul C — Client vede intrebari sugerate in chat](#scenariul-c--client-vede-intrebari-sugerate-in-chat)
4. [Scenariul D — Admin creeaza contabil si-i asigneaza clienti](#scenariul-d--admin-creeaza-contabil-si-i-asigneaza-clienti)
5. [Scenariul E — Client genereaza factura SIMM24](#scenariul-e--client-genereaza-factura-simm24)
6. [Scenariul F — Client primeste reminder IPC21](#scenariul-f--client-primeste-reminder-ipc21)
7. [Scenariul G — Client se autentifica pe web prin QR de pe mobil](#scenariul-g--client-se-autentifica-pe-web-prin-qr-de-pe-mobil)
8. [De ce fiecare componenta exista](#de-ce-fiecare-componenta-exista)
9. [Harta fisierelor principale](#harta-fisierelor-principale)

---

## Scenariul A — Client scaneaza o factura de pe telefon

**Cand:** userul deschide aplicatia mobila, merge la tab "Creare", apasa "Scaneaza cu camera", alege tipul "Factura", fotografiaza.

### Pas cu pas

1. **UI mobil** — `app/(taburi)/creare.tsx` detecteaza alegerea si lanseaza modalul [`components/scaner-document`](frontend-mobile-aplication/components/scaner-document/).
   - `expo-camera` cere permisiunea (stocheaza in state-ul aplicatiei).
   - User apasa butonul shutter → `takePictureAsync({ quality: 0.92 })` → primim URI local.
   - Preview cu rotire ±90° + retake + confirmare.

2. **UI completare date** — [`components/formular-upload-document/`](frontend-mobile-aplication/components/formular-upload-document/).
   - User tasteaza titlu (pre-completat "Factura DD.MM.YYYY"), optional descriere.
   - Apasa "Incarca documentul".

3. **Upload catre backend** — `POST /api/v1/ac/documents/upload` (multipart/form-data).
   - `backend-project/app/api/routes/documents.py::upload_document`
   - Salveaza fisierul in `storage/uploads/documents/<uuid>.jpg`.
   - Creeaza row in tabela `documents` cu `status='incarcat'`.
   - Raspunde cu `Document` JSON (id, file_path, etc.).

4. **Mobile** — afiseaza toast "Se proceseaza..." si apeleaza `asteaptaProcesareOCR(id)` care face polling la `/documents/{id}` pana `status` devine `ocr_complet` sau similar.

5. **Backend trimite task Celery** — in mod normal (fluxul complet, cu Celery):
   - `ai-service/app/tasks/document_tasks.py::proceseaza_document(document_id)`
   - Celery worker preia task-ul → se conecteaza la DB → citeste fisierul de pe disc.

6. **Pipeline AI — executa in ordine:**
   ```
   PaddleOCR     → extrage text + bbox + confidence per cuvant
   Classifier    → BERT multilingual zice "invoice" (sau fallback keyword-based daca modelul nu-i antrenat)
   NER Extractor → scoate IDNO, numar factura, total cu TVA, data, nume furnizor
   Urgency Score → calculeaza 0-100 bazat pe scadenta + suma + tip
   ```
   Toate setate pe row-ul `documents` + insert in `extracted_fields` (pentru fiecare camp NER).

7. **Status pus pe `extras`** → WebSocket push la frontend → mobile opreste spinner-ul → navigheaza la detalii document.

8. **Quality check in frontend:**
   - Daca `avg_ocr_confidence < 0.65` sau `has_flagged_fields=True` → mobile afiseaza modal [`modal-calitate-ocr`](frontend-mobile-aplication/components/modal-calitate-ocr/) cu 3 optiuni:
     - "Reia cu scannerul" → `PUT /documents/{id}/rescan` (upload inlocuire + repornire OCR)
     - "Trimite asa cum e" → escaleaza la contabil manual
     - "Renunta"

### Ce garanteaza fiecare componenta

- **PaddleOCR** — iscusit la text in scena reala (poza cu unghi, umbra); calitate mai buna decat Tesseract pe documente imperfecte
- **BERT multilingual** — intelege RO/RU/EN fara fine-tuning major; hot-swap cu model fine-tuned cand avem date
- **FAISS (nu aici, dar in alte zone)** — detecta duplicat: daca acelasi document deja a fost uploaded, `document_embeddings` il gaseste pe cosine > 0.95

---

## Scenariul B — Client intreaba Djarvis "Cat e TVA?"

**Cand:** user pe web apasa bula de chat dreapta-jos si tasteaza "Cat e cota TVA in Moldova?". Sau, pe mobile, din home apasa bannerul "Intrebare urgenta" si tasteaza aceeasi intrebare.

### Pas cu pas

1. **UI (web/mobile)** trimite:
   ```
   POST /api/v1/ac/chat/send
   { "message": "Cat e cota TVA in Moldova?", "conversation_id": null }
   ```

2. **Backend** — `backend-project/app/api/routes/chat.py::send_message`
   - Creeaza conversatie noua (`ChatConversation`) daca `conversation_id` e null.
   - Salveaza mesajul user-ului cu `sender_type='client'`.
   - Apeleaza `find_best_faq_match(mesaj, db)` → cauta in tabela `faq_entries`.
   - In cazul nostru fresh DB → 0 FAQ-uri → score 0.0 → merge mai departe.

3. **Backend apeleaza Djarvis** — functia `intreaba_djarvis(mesaj, istoric)`:
   - HTTP POST la `http://ai-service:3778/api/v1/agent/ask`
   - Body: `{ "question": "Cat e cota TVA?", "history": [], "top_k": 5 }`

4. **AI service** — `ai-service/app/api/routes/agent.py::ask`
   - Verifica ca Ollama e up: `model_disponibil()` cere `GET /api/tags` si cauta qwen2.5
   - Daca nu → returneaza 503 (callerul va escalada la contabil)

5. **Retrieval pas** — `agent/retriever.py::cauta`
   - Singleton `LegisReteriever` — prima data incarca:
     - `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (~90MB, 384-dim)
     - FAISS `IndexFlatIP` din `/app/model_storage/legislatie_index/index.faiss`
     - `mapping.json` cu 51 chunks
   - Embedding normalizat pentru intrebare → FAISS search top-5 → [("Cod Fiscal art. 96 — Cota standard TVA", 0.69), ("Moldova IT Park", 0.60), ...]

6. **Prompt building** — `agent/prompt.py::build_user_prompt`
   ```
   CONTEXT (fragmente extrase din legislatia RM):
   [1] Sursa: Codul Fiscal RM, art. 96 — Cota standard TVA
   Cota standard a taxei pe valoarea adaugata (TVA)...

   [2] Sursa: ...

   INTREBAREA UTILIZATORULUI:
   Cat e cota TVA in Moldova?

   Raspunde conform stilului tau. ...
   ```

7. **LLM call** — `agent/ollama_client.py::genereaza`
   ```
   POST http://ollama:11434/api/chat
   {
     "model": "qwen2.5:3b-instruct",
     "messages": [ {role:system,...}, {role:user, content:prompt} ],
     "keep_alive": "30m",    // model ramane in RAM 30 min intre request-uri
     "options": { "temperature": 0.25, "num_predict": 500, "num_ctx": 2048 }
   }
   ```
   - Cold start (model neincarcat): 30-60 sec
   - Warm: 5-20 sec

8. **Raspuns Ollama** — text in format: `"Conform art. 96 din Codul Fiscal, cota standard TVA este 20%..."` + eventual citari `[1]` `[2]`.

9. **AI service raspunde** catre backend:
   ```
   { "answer": "...", "sources": [...], "used_rag": true, "model": "qwen2.5:3b-instruct" }
   ```

10. **Backend** salveaza raspunsul ca mesaj `sender_type='ai'` + returneaza catre UI.

11. **UI** afiseaza bula cu raspunsul. Imediat cheama `GET /chat/suggestions?after=Cat+e+cota+TVA` si afiseaza **5 chip-uri de urmare** — intrebari inrudite pe care Djarvis le va trata bine.

### De ce RAG in loc de LLM pur

- **LLM pur** — qwen2.5:3b stie contextul general dar poate "halucina" cifre (ex. "cota TVA e 18%" cand de fapt e 20%)
- **RAG** — forteaza LLM-ul sa raspunda doar pe context verificat din `seed_legislatie_rm.jsonl` → cifrele corecte, citari clare
- **Fallback** — daca contextul nu acopera intrebarea, prompt-ul ii cere sa raspunda din cunoasterea generala si sa marcheze "din experienta" vs "[1]"

---

## Scenariul C — Client vede intrebari sugerate in chat

**Cand:** userul deschide chat-ul Djarvis pentru prima data. Vede 6 chip-uri colorate dedesubtul input-ului:

- 🔵 "Cat e cota TVA in Moldova?"
- 🟢 "Sunt freelancer IT — ce impozit platesc?"
- 🟡 "Am angajat primul om — ce trebuie sa fac?"
- 🟡 "Cand se depune IPC21?"
- 🔴 "Am primit o decizie de la fisc — ce fac?"
- 🟠 "Contract de munca sau prestari servicii?"

### Pas cu pas

1. **UI web** — `ChatWidget.tsx` la `useEffect(open)` apeleaza `fetchSuggestions()` (fara argumente).

2. **Backend proxy** — `chat.py::get_djarvis_suggestions` face forward la `ai-service:3778/api/v1/agent/suggestions`.

3. **AI service** — `agent/suggestions.py::sugereaza(dupa_mesaj=None, limit=5)`:
   - Cand nu e context → returneaza `_STARTER_QUESTIONS` (6 intrebari populare curate din `_ENTRIES`).

4. **UI primeste** `[{q, cat}, ...]` si mapeaza fiecare la un chip cu culoare pe categorie (TVA = sky, freelance = emerald, salarii = amber, fisc = red, etc. — functia `_catBadge`).

5. **Click pe chip** — apeleaza `handleSend(s.q)` (cu override de text) → trimite intrebarea + ascunde chip-urile pana vine raspunsul.

6. **Dupa raspuns** — `fetchSuggestions(mesajul)` cu context → `sugereaza(dupa_mesaj=...)`:
   - Tokenizeaza mesajul (cuvinte >=3 chars, fara diacritice).
   - Scor per intrare: `kw_hits / total_kw`.
   - Sorteaza descrescator.
   - Top 3 din aceeasi categorie + 2 diverse.

### Exemplu concret

User intreaba `"Cat e cota TVA?"`:
- Tokens: `{cat, cota, tva, moldova}`
- Prima potrivire: entry `{"q":"Cat e cota TVA in Moldova?","cat":"tva","kw":["tva","cota","impozit","standard"]}` → hits `{tva, cota}` → scor 2/4 = 0.5
- Alte TVA: "Ce e cota 0 TVA la export?" scor 2/4, "Cand se depune declaratia TVA?" scor 1/4
- Resurse: top 3 din tva + 2 diverse (freelance, salarii) din alte categorii

User intreaba `"Am angajat primul om"`:
- Top 3 din `salarii` (IPC21, CAS/CAM, concediu medical)
- + 2 diverse (fisc, contract)

### De ce asta imbunatateste UX

- **Noii useri** nu stiu ce sa intrebe — chipurile ii ghideaza spre intrebari pentru care Djarvis are raspuns sigur
- **Reduce fraza vaga** — daca intrebi "info fisc" primesti raspuns slab; daca apesi "Am primit o decizie — ce fac?" primesti pasii concreti
- **Crestere engagement** — fiecare raspuns declanseaza intrebari de urmare, nu lasa conversatia moarta

---

## Scenariul D — Admin creeaza contabil si-i asigneaza clienti

**Cand:** admin-ul (ex. `test@aicontabil.md`) intra pe `/training` → tab "Contabili".

### Pas cu pas

1. **UI Admin** — `src/pages/Training/components/ContabilManagement.tsx`:
   - Tabela `/users/?limit=200` cu filtru pe rol.
   - Buton "Creeaza contabil nou" → modal cu form username/email/parola/nume.

2. **Submit** — `POST /users/create-contabil`
   - `backend-project/app/api/routes/users.py::create_contabil`
   - Cere `require_role(UserRole.ADMIN)`.
   - Verifica unicitate email + username.
   - `User(role=CONTABIL, is_verified=True)` → salvat direct.
   - Returneaza `UserResponse`.

3. **UI refresh** — lista utilizatori reincarcata, apare noul contabil cu rol "contabil".

4. **Asignare clienti** — click pe "Gestioneaza" in coloana Clienti a contabilului:
   - Se deschide modal cu 2 coloane:
     - **Stanga**: clientii deja asignati contabilului (din `GET /users/contabil/{id}/clients`)
     - **Dreapta**: clienti disponibili (din lista totala, filtrati dupa cei deja asignati)
   - Buton "Asigneaza" pe fiecare disponibil → `POST /users/admin/assign-client` cu `{contabil_id, client_id}`
   - Buton "Scoate" pe fiecare asignat → `DELETE /users/admin/assign-client`
   - Modificari live — cele 2 liste se reincarca dupa fiecare actiune.

5. **Backend** — `users.py::admin_assign_client`:
   - Cere `ADMIN`.
   - Verifica ca user-ul tinta e `CONTABIL` si clientul e `CLIENT`.
   - Reactiveaza daca `AccountantClient` exista deja inactive, altfel insert nou.

6. **Contabilul logheaza in** si:
   - `GET /users/my-clients` → vede clientii asignati de admin.
   - `GET /documents/?owner_id in [client_ids]` (filtrare automata in `documents.py`) → vede docs doar pentru clientii lui.
   - Nu vede documentele altor contabili — izolare stricta pe `owner_id`.

### De ce fluxul asta, nu altul

- Contabilul **nu** poate self-serve clientii (decat prin `POST /users/assign-client` din flexibilitate legacy — admin poate elimina acest endpoint).
- Admin-ul e single source of truth pentru asignari → reconciliere usoara.
- `AccountantClient.is_active` permite "pauza" temporara (ex. vacanta contabil) fara pierdere istoric.

---

## Scenariul E — Client genereaza factura SIMM24

**Cand:** client (ex. `client@aicontabil.md`) doreste sa emita o factura de vanzare.

### Pas cu pas (model, pana se termina UI-ul de form)

1. Pentru moment — UI-ul de completare factura e la etapa urmatoare. Deocamdata se testeaza prin API:

   ```
   POST /api/v1/ac/reports/sfs/generate/simm24
   Authorization: Bearer <token_client>
   {
     "companie": "SRL Ion SRL",
     "cod_fiscal": "1012600012345",
     "furnizor_adresa": "str. Stefan cel Mare 1, Chisinau",
     "cumparator": {
       "denumire": "SRL Beneficiar",
       "idno": "1019600099999",
       "adresa": "str. Eminescu 5, Chisinau"
     },
     "pozitii": [
       {"denumire": "Servicii IT", "cantitate": 10, "pret_unitar": 500, "cota_tva": 20},
       {"denumire": "Licenta software", "cantitate": 1, "pret_unitar": 2000, "cota_tva": 20}
     ],
     "serie": "AI"
   }
   ```

2. **Backend** — `rapoarte_sfs.py::generate_simm24`:
   - Apeleaza `build_simm24_pdf(...)` — intoarce `bytes` PDF.
   - `_salveaza_pdf(pdf, "simm24")` → scrie pe disc la `storage/uploads/reports-sfs/simm24-<uuid>.pdf`.
   - `_creeaza_record(...)` → insert in tabela `reports` cu `report_type=SIMM24`, `frequency=la_cerere`, `due_date=NULL`.

3. **PDF generator** — `services/rapoarte_sfs.py::build_simm24_pdf`:
   - Header oficial "FACTURA FISCALA" + "Formular SIMM24 (e-Factura)" cu seria + numar + data.
   - Tabel 2-coloane furnizor/cumparator (nume, IDNO, adresa).
   - Tabel linii factura cu 8 coloane: Nr, Denumire, Cantitate, Pret unitar, Cota TVA, Total fara TVA, TVA, Total cu TVA.
   - Footer cu `_footer(companie)` — disclaimer "Pentru depunere oficiala, trebuie semnat electronic pe e-Factura sfs.md".
   - Calcule automate: `fara_tva = cant * pret`, `tva = fara_tva * cota/100`, `cu_tva = fara_tva + tva`, total general.

4. **Raspuns API** — `RaportSfsRaspuns` cu `id` al record-ului.

5. **Download** — `GET /reports/sfs/{id}/download`:
   - Verifica rolul user-ului are acces la raport.
   - Streameaza PDF-ul cu `Content-Disposition: attachment`.

### Echivalent pt celelalte formulare

- **IPC21**: body cu lista `salarizare` de angajati; PDF cu tabel care calculeaza impozit 12%, CAS 9%/24%, CAM 4.5%/4.5%.
- **2-INV trimestrial si TALS21 anual**: body cu `investitii`; `build_2inv_pdf(anual=False/True)`.
- **TL13**: body cu `taxe` per localitate; calcul sumar.
- **IRM19**: body cu `actiune` + `angajat`; sablon diferit per actiune.

---

## Scenariul F — Client primeste reminder IPC21

**Cand:** suntem pe 22 a lunii, IPC21 pentru luna trecuta trebuie depus pana pe 25. Sistemul trebuie sa-i aminteasca user-ului.

### Pas cu pas (implementat in endpoint-ul `upcoming`, scheduler auto vine urmator)

1. **Mobile home screen** sau **web dashboard** — la incarcare pagini apeleaza:
   ```
   GET /api/v1/ac/reports/sfs/upcoming
   ```

2. **Backend** — `rapoarte_sfs.py::upcoming_deadlines`:
   - `acum = datetime.now(utc)`
   - `limita = acum + 60 zile`
   - Itereaza prin urmatoarele 4 periade pentru fiecare formular periodic:
     - IPC21: urmatoarele 4 luni (offset -1..+3)
     - 2-INV: urmatoarele 4 trimestre
     - TL13: urmatoarele 4 semestre
   - Pentru fiecare periada calculeaza `_deadline_pentru(tip, perioada)`.
   - Daca deadline-ul e in [acum, limita] → adauga in lista.

3. **Sortare** pe `due_date` ascendent.

4. **Fiecare item** are campurile:
   - `report_type` = "ipc21"
   - `name` = "IPC21 — Impozit pe venit + contributii (lunar)"
   - `period` = "2026-03"
   - `due_date` = "2026-04-25T23:59:00Z"
   - `days_left` = 3
   - `urgency` = "urgent" (<=3 zile), "warning" (<=10), "normal"

5. **Frontend interpreteaza `urgency`**:
   - `urgent` → banner rosu pulsand in home + notificare push (mobile) / toast (web)
   - `warning` → card galben cu count-down
   - `normal` → listare calma

6. **Click pe card** → deschide pagina/form pentru generarea raportului → POST `/reports/sfs/generate/ipc21` → PDF descarcabil.

### Scheduler pentru notificari automate (urmator)

Implementarea completa cu Celery beat (task zilnic):
```python
@celery_app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=9, minute=0),  # zilnic la 9:00
        verifica_deadlinuri_sfs.s(),
    )

@celery_app.task
def verifica_deadlinuri_sfs():
    # pentru fiecare user activ → GET upcoming → daca are urgent/warning → Notification
    pass
```
Acesta e next step — infrastructure Redis + Celery deja configurata.

---

## Scenariul G — Client se autentifica pe web prin QR de pe mobil

**Cand:** userul e logat pe mobil ca `client@aicontabil.md`. Deschide laptopul si vrea sa intre pe `/signin` fara sa tasteze parola.

### Pas cu pas

1. **Web** — pagina SignIn afiseaza QR-ul apeland:
   ```
   POST /api/v1/ac/qr-login/initiate
   → { session_token, qr_token, expires_at }

   GET  /api/v1/ac/qr-login/qr/{qr_token}
   → PNG cu QR codificand "aicontabil://login/<qr_token>"
   ```

2. **Web incepe polling** — la fiecare 2 secunde:
   ```
   GET /api/v1/ac/qr-login/status/{session_token}
   → { status: "pending" }
   ```

3. **Mobile** (deja logat) — userul merge in tab Profil → card "Securitate" → apasa cardul mare "Conecteaza web prin QR".

4. **Mobile deschide scanner QR** — `components/scaner-qr-web/index.tsx`:
   - `CameraView` cu `barcodeScannerSettings.barcodeTypes = ['qr']`.
   - La detectare QR → `onBarcodeScanned(e)` → `extrageTokenDinQr(e.data)` extrage tokenul din URI.
   - UI trece in etapa "Conectare pe web?" cu butoanele Aproba / Respinge.

5. **Aproba** → `POST /api/v1/ac/qr-login/approve { qr_token }` cu JWT-ul user-ului curent.

6. **Backend** — `qr_login.py::approve_qr_login`:
   - Valideaza `qr_token` → sesiunea e pending si nu a expirat.
   - Genereaza noi JWT tokens pentru user-ul mobile.
   - Salveaza in `QRLoginSession.access_token` si `refresh_token`.
   - `status=approved`.

7. **Web** — urmatorul polling:
   ```
   GET /qr-login/status/{session_token}
   → { status: "approved", access_token: "...", refresh_token: "..." }
   ```
   - Salveaza token-urile in localStorage → `AuthContext.setSession(...)` → `isLoggedIn=true` → redirect la `/home`.

8. **User logat** pe web fara parola.

### De ce asta e sigur

- `qr_token` e criptografic random (`secrets.token_urlsafe(24)` — 192 bits).
- Expira in 5 minute (verificat in `approve`).
- Singura aprobare per sesiune (daca se mai incearca → 400).
- `Authorization: Bearer <mobile_token>` e necesar pentru aprobare — doar user-ul logat pe mobil o poate face.

---

## De ce fiecare componenta exista

| Componenta | Fara ea... |
|---|---|
| **PaddleOCR** local | am depinde de Google Vision ($0.0015/image) sau alta cloud API cu latenta + costuri |
| **BERT Classifier** | clasificarea ar fi doar keyword matching — rate de eroare ~25% |
| **NER BERT** | extragerea campurilor ar fi regex fragil care pica la formate noi |
| **FAISS** | nu am putea face RAG sau duplicate detection scalabil |
| **Djarvis (Ollama)** | Chat-ul ar fi doar FAQ matching — nu ar raspunde la intrebari noi |
| **Suggestions** | User-ul nu ar sti ce sa intrebe; rata de abandon in chat ~80% |
| **Celery** | OCR-ul ar bloca request-ul HTTP 20-30s → timeout nginx |
| **WebSocket** | Mobile ar face polling brute → baterie consumata |
| **Rapoarte SFS** | User ar face rapoartele manual in Excel → ore pierdute, erori de calcul |
| **QR Login** | Login pe web cere parola + 2FA — frictionat pentru useri mobili |

---

## Harta fisierelor principale

### Backend (port 3777)

```
backend-project/
├── app/
│   ├── main.py                         # FastAPI entrypoint + include_router
│   ├── api/
│   │   ├── deps.py                     # get_current_user, require_role
│   │   └── routes/
│   │       ├── auth.py                 # login, register, 2FA, refresh
│   │       ├── users.py                # CRUD + create-contabil + admin/assign-client + role change
│   │       ├── documents.py            # upload, list, rescan, CRUD
│   │       ├── reports.py              # rapoarte legacy
│   │       ├── rapoarte_sfs.py         # NOU — IPC21/2-INV/TL13/TALS21/IRM19/SIMM24
│   │       ├── notifications.py
│   │       ├── training.py             # corectii OCR → training data
│   │       ├── chat.py                 # FAQ + Djarvis proxy + suggestions proxy
│   │       ├── two_factor.py
│   │       └── qr_login.py
│   ├── models/                         # SQLAlchemy — User, Document, Report, FAQ, ...
│   ├── schemas/                        # Pydantic request/response
│   ├── services/
│   │   └── rapoarte_sfs.py             # NOU — PDF generators cu reportlab
│   └── core/                           # config, database, security (JWT)
└── ai-service/                         # Port 3778 — pipeline AI
    ├── app/
    │   ├── main.py
    │   ├── agent/                      # NOU — Djarvis RAG
    │   │   ├── prompt.py
    │   │   ├── ollama_client.py
    │   │   ├── retriever.py
    │   │   └── suggestions.py          # NOU — intrebari sugerate
    │   ├── api/routes/
    │   │   ├── agent.py                # /agent/ask, /agent/suggestions, /agent/health
    │   │   ├── documents.py            # procesare, rezultate OCR
    │   │   ├── training.py             # trigger model training
    │   │   └── admin.py
    │   ├── processors/                 # Clasificator, NER, Urgency, Recommender
    │   └── tasks/                      # Celery tasks (document_tasks.py)
    └── scripts/
        └── build_legislation_index.py  # Offline indexare FAISS
```

### Frontend Web

```
frontend-web-aplication/AI-Contabil/src/
├── App.tsx                             # routing + RoleGuard
├── pages/
│   ├── Home/                           # landing + home logat
│   ├── SignIn/                         # QR login + parola
│   ├── Documents/                      # drag-drop upload + lista
│   ├── Reports/                        # lista + descarcare PDF
│   ├── Training/                       # dashboard model + tab Contabili
│   │   └── components/
│   │       └── ContabilManagement.tsx  # NOU — admin creaza contabil + asigneaza clienti
│   ├── Admin/                          # NOU — panou admin standalone
│   └── Contabil/                       # NOU — dashboard contabil cu clientii lui
├── components/
│   └── ChatWidget/ChatWidget.tsx       # Djarvis chat bula + suggestions chips
└── api/
    ├── chatApi.ts                      # sendChatMessage + fetchSuggestions
    └── usersApi.ts                     # create-contabil, assign-client
```

### Frontend Mobile

```
frontend-mobile-aplication/
├── app/(taburi)/
│   ├── index.tsx                       # home — banner Djarvis + conversatii
│   ├── creare.tsx                      # scanner + galerie + PDF pickers
│   ├── notificari.tsx                  # lista notificari
│   └── profil.tsx                      # Date personale / Parola / Securitate / 2FA
├── components/
│   ├── scaner-document/                # NOU — camera A4 cu retake
│   ├── scaner-qr-web/                  # NOU — QR login web
│   ├── chat-djarvis/                   # NOU — chat full-screen cu Djarvis
│   ├── formular-upload-document/       # NOU — form titlu+desc
│   ├── modal-calitate-ocr/             # NOU — retry dupa OCR slab
│   ├── selector-tip-document/          # NOU — bottom-sheet tipuri
│   └── profil/
│       ├── ecran-securitate.tsx        # NOU — hub QR login + 2FA
│       └── ecran-securitate-2fa.tsx    # provocari 2FA
└── lib/api/
    ├── serviciu-chat.ts
    ├── serviciu-documente.ts           # NOU — upload + rescan + poll OCR
    └── serviciu-qr-login.ts            # NOU — approve/reject web QR
```

### Corpus AI

```
backend-project/training-data/
└── legislatie/
    ├── seed_legislatie_rm.jsonl        # 18 articole Cod Fiscal + Legea Contab + scenarii
    └── seed_extins_scenarii.jsonl      # 33 scenarii: freelance, IT, patenta, concedii, contestatii
```

---

## Test rapid end-to-end

Ca sa verifici ca totul merge:

```bash
# 1. Login ca client
TOKEN=$(curl -s -X POST http://localhost:3777/api/v1/ac/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"Client1234!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Intreaba Djarvis (via chat, folosind FAQ→Djarvis fallback)
curl -s -X POST http://localhost:3777/api/v1/ac/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Cat e cota TVA in Moldova?"}'
# Astept: 5-30s → raspuns "...cota standard 20%..."

# 3. Vezi intrebari sugerate
curl -s "http://localhost:3777/api/v1/ac/chat/suggestions?after=Cat+e+TVA" \
  -H "Authorization: Bearer $TOKEN"
# Astept: 5 intrebari legate de TVA + alte categorii

# 4. Vezi deadline-uri apropiate
curl -s http://localhost:3777/api/v1/ac/reports/sfs/upcoming \
  -H "Authorization: Bearer $TOKEN"
# Astept: lista cu IPC21, 2-INV etc. + days_left

# 5. Genereaza SIMM24 factura
curl -s -X POST http://localhost:3777/api/v1/ac/reports/sfs/generate/simm24 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"companie":"SRL Test","cod_fiscal":"1012600012345",
       "cumparator":{"denumire":"Client SRL","idno":"1019600099999"},
       "pozitii":[{"denumire":"Consulting","cantitate":10,"pret_unitar":500}],"serie":"AI"}'
# Astept: { "id": "...", "status": "finalizat", ... }
```

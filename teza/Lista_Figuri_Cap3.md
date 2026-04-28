# LISTĂ DE CAPTURI DE ECRAN PENTRU CAPITOLUL 3

> **Cum se folosește acest document:** parcurgi lista, faci capturile pe rând (după ce termini aplicația), le numerotezi `Figura 3.X` și le inserezi în Word exact unde apare marcajul `[FIGURA 3.X — CAPTURĂ NECESARĂ: ...]` în [Capitol_3_AI_Contabil.md](Capitol_3_AI_Contabil.md). Apoi ștergi marcajul și păstrezi doar titlul (linia care începe cu „Figura 3.X.").

> Toate figurile trebuie centrate, cu titlul **sub** figură (nu deasupra), font Times New Roman 11pt italic, conform ghidului UTM (pag. 16). Numerotare automată: prima cifră = capitolul, a doua = numărul de ordine.

---

## Tabel sintetic — toate figurile din Capitolul 3

| Nr.  | Subcap. | Conținut captură | Sursă (ce deschizi) | Status |
|------|---------|-------------------|---------------------|--------|
| 3.1  | 3.1.1   | Structura folderelor proiectului în Explorer-ul VS Code | VS Code, panoul Explorer expandat | ☐ |
| 3.2  | 3.1.2   | VS Code cu container Docker activ și terminal cu loguri | VS Code + Docker extension activă | ☐ |
| 3.3  | 3.1.3   | Cele 7 servicii containerizate rulând (`docker compose ps` sau Docker Desktop) | Terminal sau Docker Desktop | ☐ |
| 3.4  | 3.2.1   | Documentația Swagger UI a endpoint-urilor de autentificare | Browser pe `http://localhost:3777/docs` | ☐ |
| 3.5  | 3.3.1   | Comparație: factură fotografiată brut vs preprocesată + textul OCR | Aplicația mobilă + log AI service | ☐ |
| 3.6  | 3.3.5   | Widget Djarvis cu o conversație ilustrativă | Aplicația web, widget chat deschis | ☐ |
| 3.7  | 3.4.2   | Ecranul de logare al aplicației web | Browser pe `http://localhost:5173/signin` | ☐ |
| 3.8  | 3.4.3   | Dashboard-ul clientului (upload + tabel documente + notificări) | Browser, autentificat ca client | ☐ |
| 3.9  | 3.4.4   | Interfața contabilului: coadă + ecran validare OCR | Browser, autentificat ca contabil | ☐ |
| 3.10 | 3.4.5   | Interfața admin: tab antrenare modele cu metricile | Browser, autentificat ca admin | ☐ |
| 3.11 | 3.5.2   | Aplicația mobilă: ecran captare cameră + ecran confirmare | Telefon real cu Expo Go | ☐ |
| 3.12 | 3.5.3   | 2FA prin QR: ecran web cu cod QR + ecran mobil cu camera | Web + mobil simultan | ☐ |
| 3.13 | 3.6.2   | Raportul de execuție Pytest în terminal | Terminal cu `pytest -v` rulând | ☐ |

**Total: 13 figuri.**

---

## Detalii per figură (ce trebuie să apară în captură)

### Figura 3.1 — Organizarea pe componente a repository-ului
- **Unde:** [Capitol_3_AI_Contabil.md](Capitol_3_AI_Contabil.md), subcap. 3.1.1
- **Cum:** deschizi VS Code pe `c:/Depozit/gitProjects/Teza-de-licenta`. În panoul Explorer (stânga), expandezi: `backend-project`, `frontend-web-aplication`, `frontend-mobile-aplication`, `teza`. Capturezi panoul Explorer + un mic colț din editorul principal.
- **Tehnică:** captură de ecran completă, apoi crop la zona Explorer (lățime 350-400 px).

### Figura 3.2 — Mediul de dezvoltare VS Code cu Docker
- **Unde:** subcap. 3.1.2
- **Cum:** deschizi în VS Code orice fișier Python din `backend-project/ai-service/app/agent/` (de exemplu `ollama_client.py`). Activezi extensia Docker în bara laterală — trebuie să se vadă lista containerelor cu indicator verde de status. Deschizi terminalul integrat (Ctrl+`) și rulezi `docker compose logs ai-service --tail 20`.
- **Tehnică:** captură întreagă a ferestrei VS Code.

### Figura 3.3 — Cele șapte servicii containerizate active
- **Unde:** subcap. 3.1.3
- **Cum:** **Varianta A (terminal):** rulezi `docker compose ps` în terminal — capturezi tabelul cu cele 7 servicii (postgres, redis, backend, ai-service, celery-worker, celery-beat, ollama), toate cu STATE=running. **Varianta B (Docker Desktop):** deschizi Docker Desktop, mergi la tab-ul Containers, expanzi proiectul `teza-de-licenta` — capturezi lista cu toate cele 7 containere active.
- **Tehnică:** captură curată, fără elemente neclare.

### Figura 3.4 — Documentația Swagger UI a endpoint-urilor de autentificare
- **Unde:** subcap. 3.2.1
- **Cum:** pornești backend-ul (`docker compose up backend` sau direct), apoi deschizi browserul la `http://localhost:3777/docs`. În interfața Swagger, scroll-ezi la secțiunea „auth" și expandezi endpoint-urile `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Capturezi zona vizibilă cu cele 4 endpoint-uri expandate.
- **Tehnică:** captură browser, fără bara de adrese (dacă posibil).

### Figura 3.5 — Pipeline-ul OCR pe o factură reală
- **Unde:** subcap. 3.3.1
- **Cum:** ai nevoie de DOUĂ imagini lipite alături în Word (sau combinate într-o singură imagine prin Snipping Tool / Figma):
  - **Stânga:** o factură fotografiată cu telefonul, neuniformă (cu unghi de înclinare 5-10° și iluminare neuniformă) — fișierul original.
  - **Dreapta:** aceeași factură după preprocesare (imagine din `backend-project/ai-service/storage/preprocessed/` sau similar; dacă nu există output salvat, rulezi manual `OCRProcessor.preprocess_image()` și salvezi rezultatul cu `cv2.imwrite`).
  - **Dedesubt:** o casetă de text cu primele 3-4 linii de text recunoscut de PaddleOCR (poți printa output-ul `result['text']` și să-l capturezi).
- **Tehnică:** combinație de două imagini + text, gata pentru a fi inserată ca o singură figură.

### Figura 3.6 — Widget-ul Djarvis în acțiune
- **Unde:** subcap. 3.3.5
- **Cum:** deschizi aplicația web autentificat ca contabil, click pe iconița chat din colțul dreapta-jos, scrii o întrebare reală gen *„Care e termenul de depunere a declarației IPC21 pentru luna iunie?"*. Aștepți răspunsul lui Djarvis. Capturezi widget-ul deschis cu întrebarea ta + răspunsul agentului afișat (de preferat unul care citează un articol din Codul Fiscal).
- **Tehnică:** captură doar zona widget-ului, nu tot ecranul.

### Figura 3.7 — Ecranul de logare web
- **Unde:** subcap. 3.4.2
- **Cum:** browser pe `http://localhost:5173/signin`. Capturezi formularul curat (fără date introduse).
- **Tehnică:** captură de la mijlocul paginii, centrat pe formular.

### Figura 3.8 — Dashboard-ul clientului
- **Unde:** subcap. 3.4.3
- **Cum:** autentificat ca client, navighezi la pagina Documente. Pre-încarci 3-4 documente (1 cu status `processing`, 2 cu `completed`, 1 cu `failed` — pentru a se vedea variația vizuală). Capturezi întreaga zonă centrală cu zona de upload în partea sus, tabel cu documente la mijloc, și panoul de notificări lateral.
- **Tehnică:** captură browser full-page (poți folosi extensia GoFullPage din Chrome).

### Figura 3.9 — Validarea OCR de către contabil
- **Unde:** subcap. 3.4.4
- **Cum:** autentificat ca contabil, deschizi pagina Contabil. În stânga ai coada de documente cu etichete colorate de urgență (asigură-te că ai cel puțin 1 roșu, 1 portocaliu, 1 verde). Click pe un document — se deschide ecranul de validare. Capturezi întregul ecran cu coada vizibilă în stânga și panoul de validare deschis în dreapta (factura + formular cu câmpuri extrase, cu cel puțin 1 câmp marcat galben).
- **Tehnică:** captură full-page.

### Figura 3.10 — Interfața admin pentru antrenare modele
- **Unde:** subcap. 3.4.5
- **Cum:** autentificat ca admin, navighezi la pagina Admin → tab Antrenare. Capturezi tabelul cu versiunile modelelor (cu coloane: versiune, dată, exemple, acuratețe, F1) + butonul „Antrenează model nou" + graficul evoluției acurateții.
- **Tehnică:** captură browser, asigură-te că ai cel puțin 2-3 versiuni de model în tabel pentru ca graficul să aibă sens.

### Figura 3.11 — Scanarea documentului cu camera mobilă
- **Unde:** subcap. 3.5.2
- **Cum:** TWO capturi mobile lipite alături:
  - **Stânga:** rulezi aplicația pe telefon real (Expo Go cu QR-ul), navighezi la tab Criere → opțiunea Camera. Captezi ecranul cu camera live + cadrul de ghidaj suprapus + butonul de declanșare.
  - **Dreapta:** după ce faci poza, captezi ecranul de confirmare cu poza afișată + butoanele „Reia" și „Trimite".
- **Tehnică:** capturi telefon (volume down + power), apoi le combini într-o singură imagine în Figma/Photoshop/Canva.

### Figura 3.12 — Mecanismul 2FA prin scanare QR mobil
- **Unde:** subcap. 3.5.3
- **Cum:** TWO capturi paralele:
  - **Stânga:** browser pe ecranul web de logare 2FA cu codul QR afișat (după ce introduci credențialele și serverul îți generează codul). Trebuie să se vadă instrucțiunea „Scanează acest cod cu aplicația mobilă".
  - **Dreapta:** telefon cu aplicația mobilă (deja autentificată) deschisă pe ecranul de scanare cod QR, cu camera focalizată pe codul QR de pe ecranul web și cu mesajul de confirmare suprapus.
- **Tehnică:** combinare lateral, ca pentru Figura 3.11.

### Figura 3.13 — Raportul Pytest
- **Unde:** subcap. 3.6.2
- **Cum:** deschizi terminal în `c:/Depozit/gitProjects/Teza-de-licenta/backend-project`, rulezi `pytest -v` (sau `docker compose exec backend pytest -v`). Capturezi terminalul cu lista completă de teste, cu `PASSED` pe fiecare linie și raportul final cu numărul total + durata.
- **Tehnică:** captură terminal cu fundal contrast bun (alb pe negru sau invers, dar lizibil când e printat).

---

## Recomandări tehnice generale pentru capturi

1. **Rezoluție:** minim 1920×1080 pentru capturi de browser/VS Code; minim 1080×1920 pentru capturi mobile.
2. **Format de salvare:** PNG (calitate maximă, fără compresie cu pierderi).
3. **Cropping:** taie zonele inutile (bara de taskbar, ferestre suprapuse, zone goale).
4. **Anonimizare:** dacă apar date reale ale unui client, **anonimizează-le** (înlocuiește numele cu „Client Test SRL", IDNO cu „1234567890123" etc.).
5. **Consistență vizuală:** folosește același tema (light sau dark) pe toate capturile din aceeași categorie.
6. **Inserare în Word:** click dreapta pe figură → „Format Picture" → setează „In Line with Text", aliniere centrată.
7. **Numerotare titlu:** folosește stilul „Caption" din Word ca să se actualizeze automat dacă adaugi/scoți figuri.

---

## Lista tabelelor din Capitolul 3

În capitol există două tabele (numerotate similar cu figurile, dar separat):

| Nr.       | Subcap. | Conținut |
|-----------|---------|----------|
| Tabel 3.1 | 3.6.3   | Scenarii de testare funcțională (10 rânduri) |
| Tabel 3.2 | 3.6.5   | Sinteza rezultatelor testării (7 rânduri) |

Ambele tabele sunt scrise complet în [Capitol_3_AI_Contabil.md](Capitol_3_AI_Contabil.md) și se copiază direct în Word (din Markdown se convertesc automat în tabele Word funcționale prin Paste Special → HTML).

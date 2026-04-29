# DEMO 02 — Fluxul Contabilului

> **Durata tinta:** 55 secunde (50-60s acceptabil)
> **Stil:** silent, text overlay alb pe banda portocalie semi-transparenta (#ea580c / 85%)
> **Muzica:** continuare la trackul de la Demo 01 (sau aceeasi piesa)
> **Mesaj cheie:** "Contabilul verifica documente si raspunde la intrebari escaladate, iar Djarvis invata din raspunsurile lui"

---

## Pregatire

| Element | Stare |
|---|---|
| Cont folosit | `contabil_test@demo.md` (rol CONTABIL) |
| Browser | Chrome profil B (separat de client) |
| Documente in coada | minimum 3 documente PENDING (incarcate de client_test inainte) |
| Conversatii escalate | minimum 1 (rezultata dintr-o intrebare la care Djarvis nu a raspuns) |
| Stack | toate serviciile UP, baza de date are date demo |

**Cum pregatesti coada:** loghezi-te ca client_test, incarci 3 facturi → revii pe contabil_test → coada va avea 3 documente PENDING. Pentru conversatie escalata: client_test pune o intrebare bizara (ex. *"Daca platesc TVA prin barter cu cripto e legal?"*) — Djarvis va escalada.

---

## Scenele (cu timpi)

### Scena 1 — Login + 2FA (0:00 - 0:08s)
**Pe ecran:** pagina logare → user/parola → submit → ecran "Confirma 2FA pe mobil" → telefon (Picture-in-Picture jos-dreapta) primeste push → tap "Aproba" → web continua.
**Overlay:** *"Login cu 2FA — confirmare instant pe telefon"*
**API:** `POST /auth/login` + `POST /2fa/verify`

### Scena 2 — Dashboard (0:08 - 0:15s)
**Pe ecran:** dashboard contabil cu 4 carduri: "Coada (3)", "Escalate (1)", "Rapoarte SFS", "Clientii mei (12)".
**Overlay:** *"Dashboard — totul ce trebuie verificat azi"*
**API:** `GET /users/my-clients`

### Scena 3 — Verifica document din coada (0:15 - 0:30s)
**Pe ecran:** click "Coada" → lista 3 documente → click pe primul (factura) → split view: imaginea facturii stanga, campuri OCR extrase dreapta + box "Recomandari AI: 'tip = factura', 'TVA = 20%', confidence 94%". Hover pe campul "Suma" → highlight zona pe imagine → click "Aproba".
**Overlay:** *"OCR + AI extrag campurile automat — contabilul doar valideaza"*
**API:** `GET /documents/{id}/fields` + `GET /documents/{id}/recommendations` + `POST /documents/{id}/approve`

### Scena 4 — Raspunde la conversatie escalata (0:30 - 0:42s)
**Pe ecran:** revine la dashboard → click "Escalate" → vede intrebarea clientului → tasteaza un raspuns scurt → click "Trimite" → notificare "Raspunsul a fost salvat in FAQ. Djarvis va invata pentru intrebari similare."
**Overlay:** *"Raspunsul intra in FAQ — Djarvis devine mai destept"*
**API:** `POST /chat/respond/{conversation_id}`

### Scena 5 — Genereaza raport SFS (0:42 - 0:52s)
**Pe ecran:** click "Rapoarte SFS" → dropdown cu 5 tipuri (IPC21, 2-INV, TL13, IRM19, SIMM24) → selecteaza IPC21 → completeaza luna (martie 2026) → click "Genereaza" → spinner 1s → "PDF gata" → click "Descarca" → preview PDF 1s.
**Overlay:** *"5 tipuri de declaratii SFS — generate cu un click"*
**API:** `POST /reports/sfs/generate/ipc21` + `GET /reports/sfs/{id}/download`

### Scena 6 — Frame final (0:52 - 0:55s)
**Pe ecran:** logo AI-Contabil + tagline contabil.
**Overlay:** *"Contabili profesionisti, asistati de AI"*

---

## Ce sa NU uiti

- Pe scena 1, telefonul TREBUIE sa fie deja deschis pe ecranul Acasa cand se trimite challenge-ul, ca push-ul sa apara fara delay.
- Pe scena 3, daca recommendations vine cu confidence sub 70% → spune "model in training" prin overlay text. Daca vine peste 90% → arata-l ca atu.
- Pe scena 5, asigura-te ca PDF-ul are date reale (nu placeholders "XXX") — altfel pare bug.
- **NU** schimba zoom-ul browser-ului in timpul recording-ului — sparge dimensiunile fixe.

# DEMO 01 — Fluxul Clientului

> **Durata tinta:** 45 secunde (40-50s acceptabil)
> **Stil:** silent, text overlay alb pe banda albastra semi-transparenta (#1e40af / 85%)
> **Muzica:** lofi tech / minimal electronic, volum -18 dB
> **Mesaj cheie:** "Clientul incarca un document si primeste raspuns AI in cateva secunde"

---

## Pregatire

| Element | Stare |
|---|---|
| Cont folosit | `client_test@demo.md` (rol CLIENT) |
| Browser | Chrome profil A, ferestra 1920x1080 |
| Mobile | Expo Go pe Acasa, logat client_test |
| Document de upload | `factura_demo.pdf` pe Desktop |
| Clipboard | `Cand trebuie sa depun declaratia D300?` |
| Stack | `docker compose up -d` (Djarvis health = ready) |

**Reset inainte:** sterge conversatiile anterioare ale lui client_test si fa logout pe celelalte profiluri.

---

## Scenele (cu timpi)

### Scena 1 — Landing + Login (0:00 - 0:05s)
**Pe ecran:** pagina home publica → click "Logare" → form completat instant (paste user/parola) → submit.
**Overlay:** *"Clientul intra in platforma"*
**API:** `POST /api/v1/ac/auth/login`

### Scena 2 — Hub principal (0:05 - 0:10s)
**Pe ecran:** ecranul de Acasa (web sau mobile) cu cele 4 carduri: Documente, Chat AI, Contabili, Notificari.
**Overlay:** *"4 actiuni — totul intr-un singur loc"*

### Scena 3 — Upload document (0:10 - 0:20s)
**Pe ecran:** click "Trimite document" → drag&drop `factura_demo.pdf` in zona de upload → progres bar → mesaj "Document primit, OCR in curs".
**Overlay:** *"OCR cu PaddleOCR + clasificare BERT — automat"*
**API:** `POST /api/v1/ac/documents/upload`

### Scena 4 — Chat cu Djarvis (0:20 - 0:35s)
**Pe ecran:** click pe widget chat → paste intrebarea `Cand trebuie sa depun declaratia D300?` → Enter → bula "Djarvis cauta in legislatie..." apare → raspuns cu citare lege (ex: "conform art. 187 din Codul Fiscal, declaratia D300 se depune lunar, pana pe 25 a lunii urmatoare").
**Overlay:** *"Djarvis — agent RAG local cu legislatie RM"*
**API:** `POST /api/v1/ac/chat/send` → backend → `POST /api/v1/agent/ask` (Djarvis pe Ollama 7B + GPU)

### Scena 5 — Notificare aprobat (0:35 - 0:42s)
**Pe ecran:** badge rosu peste iconita notificari → click → "Documentul tau a fost aprobat" → click pe notificare → vezi document cu status "APROBAT".
**Overlay:** *"Notificari instant cand contabilul aproba"*
**API:** `GET /api/v1/ac/notifications/`

### Scena 6 — Frame final (0:42 - 0:45s)
**Pe ecran:** logo AI-Contabil + tagline.
**Overlay:** *"AI-Contabil — contabilitate la indemana ta"*

---

## Ce sa NU uiti

- Mouse-ul mut incet, pauza 1s dupa fiecare click important.
- Daca Djarvis raspunde mai repede de 4s pe scena 4 → adauga slow-motion 0.7x. Daca mai lent de 8s → opreste recording-ul si reia (pe GPU-ul tau ar trebui ~3-5s pentru 7B).
- Pe scena 5, daca notificarea nu apare automat: ai uitat sa setezi document-ul ca "aprobat" intre scene → cere unui contabil sa-l aprobe in alta sesiune **inainte** de recording.

# DEMO 03 — Fluxul Administratorului

> **Durata tinta:** 50 secunde (45-55s acceptabil)
> **Stil:** silent, text overlay alb pe banda rosie semi-transparenta (#dc2626 / 85%)
> **Muzica:** acelasi track ca primele 2 demo-uri (sau o piesa "tech serioasa" mai dramatica)
> **Mesaj cheie:** "Administratorul gestioneaza utilizatorii, antreneaza modelele AI si verifica integritatea sistemului"

---

## Pregatire

| Element | Stare |
|---|---|
| Cont folosit | `admin_test@demo.md` (rol SUPER_ADMIN) |
| Browser | Chrome profil C (separat de client si contabil) |
| Documente confidence scazut | minimum 5 documente cu confidence < 80% in baza |
| Modele AI in baza | minimum 2 versiuni (vechi activ + unul nou inactiv pentru activare in demo) |
| Audit log | minimum 20 entries (ca lista sa arate plina) |
| Stack | toate UP, GPU activ pentru Celery worker |

**Cum verifici GPU-ul Celery:** `docker exec ai_contabil_celery_worker nvidia-smi` — daca returneaza tabelul cu GPU, e ok pentru scena 4.

---

## Scenele (cu timpi)

### Scena 1 — Login admin + 2FA (0:00 - 0:08s)
**Pe ecran:** logare → user/parola → 2FA obligatoriu → telefon arata QR + cod → confirmat → web continua.
**Overlay:** *"Acces admin protejat cu 2FA obligatoriu"*
**API:** `POST /auth/login` + `POST /2fa/verify`

### Scena 2 — Panou administrator (0:08 - 0:15s)
**Pe ecran:** dashboard admin cu metrici live:
- Utilizatori: 47 (8 contabili, 39 clienti)
- Documente procesate astazi: 124
- Modele active: qwen2.5-7b + bert-doc-classifier-v3
- Sistem health: 4/4 servicii UP

**Overlay:** *"Panou unificat — toata platforma intr-un singur ecran"*
**API:** `GET /admin/system/health`

### Scena 3 — Creeaza un contabil nou (0:15 - 0:25s)
**Pe ecran:** sectiune "Utilizatori" → click "Creeaza contabil" → modal cu form (nume, email, parola initiala) → completare rapida → click "Creeaza" → notificare "Cont creat. Email de invitatie trimis." → noul contabil apare in lista.
**Overlay:** *"Adaugi contabili noi in 5 secunde"*
**API:** `POST /users/create-contabil`

### Scena 4 — Antrenare AI (0:25 - 0:38s)
**Pe ecran:** sectiune "Antrenare AI" → graficul accuracy in timp → lista documente cu confidence < 80% → click pe primul → corecteaza eticheta (de la "factura" la "bon fiscal") → click "Confirma" → click pe butonul mare "Lanseaza antrenare" → progress bar care urca → notificare "Job 8a3f trimis catre worker".
**Overlay:** *"Modelele se antreneaza pe GPU local — fara cloud"*
**API:** `GET /training/stats` + `POST /training/documents/{id}/correct` + `POST /training/trigger`

### Scena 5 — Activeaza modelul nou (0:38 - 0:45s)
**Pe ecran:** sectiune "Modele AI" → lista cu doua versiuni → modelul nou are accuracy 96.2% (cel vechi 92.8%) → click pe el → metrici detaliate (precision, recall, F1) → click "Activeaza" → confirmare "Modelul v4 este acum in productie".
**Overlay:** *"Activare/rollback model fara downtime"*
**API:** `GET /training/models` + `GET /training/models/{id}/metrics` + `POST /training/models/{id}/activate`

### Scena 6 — Audit log (0:45 - 0:50s)
**Pe ecran:** sectiune "Audit" → lista cu actiuni recente (toate cu hash) → click "Verifica integritate" → spinner 1s → mesaj verde "Audit chain valid (1247 entries verificate)".
**Overlay:** *"Audit cu hash chain — integritate garantata"*
**API:** `GET /admin/audit/log` + `GET /admin/audit/verify`

### Scena 7 — Frame final (opcional, 0:50 - 0:53s)
**Pe ecran:** logo AI-Contabil + tagline final.
**Overlay:** *"Control deplin, transparenta totala"*

---

## Ce sa NU uiti

- Pe scena 4, **NU** lansa antrenarea reala daca nu ai timp — pune `POST /training/trigger` sa returneze fake-job (in dev, mock-uieste raspunsul). Altfel, daca apare o eroare reala (worker indisponibil), recording-ul moare.
- Pe scena 5, asigura-te ca acuratete-le sunt diferite vizibil (96.2 vs 92.8) — daca ambele modele au exact aceleasi cifre, demo-ul pare static.
- Pe scena 6, **NU** arata audit entries cu date personale reale (email-uri, IP-uri client) → cenzureaza cu blur post-recording sau foloseste date sintetice.
- Daca panou-ul e gol (foarte putine date), **NU-l arata** — cele 4 metrici de la scena 2 trebuie sa fie populate. Foloseste un script de seed pentru datele demo.

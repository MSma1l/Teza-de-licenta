# GHID PAS-CU-PAS PENTRU CAPTURILE DE ECRAN — CAPITOLUL 3

Acest document te ghidează exact ce să faci pentru fiecare din cele 13 figuri din Capitolul 3. Bifează căsuțele pe măsură ce le faci.

> **Convenție:** toate capturile se salvează în folderul `c:\Depozit\gitProjects\Teza-de-licenta\teza\figuri\` cu numele `Figura_3_X.png` (X = numărul figurii).

---

## FAZA 0 — Pregătire (10 minute)

### 0.1 Creează folderul pentru capturi
☐ Deschide File Explorer la `c:\Depozit\gitProjects\Teza-de-licenta\teza\`
☐ Click dreapta → New → Folder → numește-l `figuri`

### 0.2 Instalează tool-ul de captură (dacă nu ai deja)
Recomand **ShareX** (gratuit, mult mai bun decât Snipping Tool):
☐ Mergi la https://getsharex.com/ → Download → instalezi
☐ Deschizi ShareX → After capture tasks → bifează doar „Save image to file"
☐ Setări → Paths → Screenshots folder → setează `c:\Depozit\gitProjects\Teza-de-licenta\teza\figuri\`
☐ Hotkey-uri implicite: `Ctrl+PrintScreen` = zonă selectată; `PrintScreen` = ecran întreg

**Alternativă rapidă:** Snipping Tool (Win+Shift+S) — vine cu Windows 11.

### 0.3 Pornește toate serviciile
☐ Deschide PowerShell sau Terminal
☐ Rulează:
```
cd c:\Depozit\gitProjects\Teza-de-licenta
docker compose up -d
```
☐ Așteaptă ~60 secunde să pornească toate
☐ Verifică cu:
```
docker compose ps
```
Trebuie să vezi 7 servicii cu STATE=running.

### 0.4 Pornește frontend-ul web
☐ Deschide al doilea terminal
☐ Rulează:
```
cd c:\Depozit\gitProjects\Teza-de-licenta\frontend-web-aplication\AI-Contabil
npm install
npm run dev
```
☐ Așteaptă să apară: `Local: http://localhost:5173/`
☐ **Lasă acest terminal deschis tot timpul.**

### 0.5 Pregătește 3 conturi de test
Înainte să faci capturile, asigură-te că ai în baza de date:
☐ 1 cont **admin** (ex: `admin@test.md` / `admin123`)
☐ 1 cont **contabil** (ex: `contabil@test.md` / `contabil123`)
☐ 1 cont **client** (ex: `client@test.md` / `client123`)
☐ **Clientul** are cel puțin 4 documente încărcate, cu statusuri diferite (`processing`, `completed`, `failed`)
☐ **Contabilul** vede în coadă cel puțin 3 documente (1 urgență mare, 1 medie, 1 mică)
☐ **Admin** are cel puțin 2 versiuni de model AI antrenate

> Dacă nu le ai pregătite, te ajut să fac un script de seed care le creează automat. Spune-mi.

---

## FAZA 1 — Capturi terminal (5 minute)

### Figura 3.3 — Cele 7 containere Docker active
☐ Deschide PowerShell într-o fereastră curată (font mai mare ajută: click dreapta pe titlul ferestrei → Properties → Font → 18pt)
☐ Rulează:
```
docker compose ps
```
☐ Așteaptă să vezi tabelul cu cele 7 servicii
☐ Apasă `Ctrl+PrintScreen` (ShareX) sau `Win+Shift+S` (Snipping Tool)
☐ Selectează **doar zona terminalului cu tabelul**, fără bara de taskbar
☐ Salvează ca `Figura_3_3.png`

### Figura 3.13 — Raport Pytest
☐ În terminal rulează:
```
docker compose exec backend pytest -v
```
☐ Așteaptă să termine (~1-2 minute, vezi linii cu `PASSED`)
☐ Scroll la final ca să se vadă raportul de sumar (`80 passed in X.Xs`)
☐ Captează zona cu ultimele 30-40 linii + raportul de sumar
☐ Salvează ca `Figura_3_13.png`

> **Sfat:** dacă output-ul e prea lung, salvează direct în fișier și capturează din editor:
> ```
> docker compose exec backend pytest -v > pytest_output.txt
> ```
> Apoi deschizi `pytest_output.txt` în VS Code, faci tema light, mărești fontul, capturezi.

---

## FAZA 2 — Capturi VS Code (5 minute)

### Figura 3.1 — Structura folderelor în Explorer
☐ Deschide VS Code pe folderul `c:\Depozit\gitProjects\Teza-de-licenta`
☐ Activează panoul Explorer (`Ctrl+Shift+E`)
☐ Expandează la primul nivel:
  - `backend-project` (click pe săgeată)
  - `frontend-web-aplication`
  - `frontend-mobile-aplication`
  - `teza`
☐ Asigură-te că **NU** ai expandate sub-foldere (vrei doar primul nivel curat)
☐ Setări → Color Theme → alege **Light+ (default light)** (capturile arată mai bine pe alb pe document)
☐ Captează panoul Explorer + un mic colț din editor (lățime 400-500 px)
☐ Salvează ca `Figura_3_1.png`

### Figura 3.2 — VS Code cu Docker activ și terminal
☐ În VS Code, deschide fișierul: `backend-project/ai-service/app/agent/ollama_client.py`
☐ Activează extensia Docker în bara laterală (iconița de balenă)
☐ Trebuie să vezi lista celor 7 containere active (verde)
☐ Deschide terminalul integrat (`Ctrl+~`)
☐ Rulează: `docker compose logs ai-service --tail 15`
☐ Captează **toată fereastra VS Code** (`PrintScreen`)
☐ Salvează ca `Figura_3_2.png`

---

## FAZA 3 — Capturi browser (15 minute)

> Pentru toate cele de mai jos: deschide Chrome / Edge la `http://localhost:5173`

### Figura 3.4 — Documentația Swagger UI
☐ Deschide tab nou: `http://localhost:3777/docs`
☐ Așteaptă să se încarce Swagger UI
☐ Click pe secțiunea `auth` ca să se expandeze
☐ Click pe fiecare endpoint din auth (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`) ca să se expandeze toate
☐ Scroll astfel încât toate cele 4 endpoint-uri expandate să fie vizibile
☐ `F11` pentru fullscreen browser (ascunde tab-uri)
☐ Captează zona vizibilă
☐ Salvează ca `Figura_3_4.png`

### Figura 3.7 — Ecranul de logare
☐ Deschide `http://localhost:5173/signin`
☐ Asigură-te că formularul e gol
☐ `F11` fullscreen
☐ Captează formularul + un pic deasupra/sub
☐ Salvează ca `Figura_3_7.png`

### Figura 3.8 — Dashboard-ul clientului
☐ Loghează-te ca `client@test.md`
☐ Navighează la pagina **Documente**
☐ Asigură-te că vezi:
  - Zona de upload (sus)
  - Tabelul cu cele 4 documente (cu statusuri diferite)
  - Panoul de notificări (lateral sau jos)
☐ `F11` fullscreen
☐ Captează tot ecranul (Win+Shift+S → fereastră întreagă)
☐ Salvează ca `Figura_3_8.png`

### Figura 3.9 — Interfața contabilului
☐ Logout, apoi loghează-te ca `contabil@test.md`
☐ Navighează la pagina **Contabil**
☐ Verifică că în stânga vezi **coada de documente cu etichete colorate** (roșu/portocaliu/verde)
☐ **Click pe primul document din coadă** ca să se deschidă panoul de validare în dreapta
☐ În dreapta trebuie să vezi imaginea + formularul cu câmpuri OCR (de preferat cu unul marcat galben)
☐ Captează tot ecranul
☐ Salvează ca `Figura_3_9.png`

### Figura 3.10 — Admin antrenare modele
☐ Logout, apoi loghează-te ca `admin@test.md`
☐ Navighează la pagina **Admin**
☐ Click pe tab-ul **Antrenare modele** (sau echivalent)
☐ Trebuie să vezi:
  - Tabelul cu versiunile modelului (acuratețe, F1, dată)
  - Butonul „Antrenează model nou"
  - (Ideal) un grafic cu evoluția acurateții
☐ Captează tot ecranul
☐ Salvează ca `Figura_3_10.png`

### Figura 3.6 — Widget Djarvis
☐ Rămâi logat ca admin (sau contabil)
☐ Click pe iconița de chat din colțul dreapta-jos
☐ Scrie întrebarea: **„Care e termenul de depunere a declarației IPC21 pentru luna iunie?"**
☐ Apasă Enter și **așteaptă răspunsul complet** (poate dura 30-60 sec pe CPU)
☐ Verifică că răspunsul citează un articol de lege sau un termen concret
☐ Captează **doar zona widget-ului** (300-400 px lățime), nu tot ecranul
☐ Salvează ca `Figura_3_6.png`

---

## FAZA 4 — Pipeline OCR (10 minute)

### Figura 3.5 — Comparație factură brut vs preprocesată + text OCR
Aceasta e cea mai complexă. Ai nevoie de o factură fotografiată și de rezultatul preprocesării.

**Pasul 1: pregătește factura sursă**
☐ Caută o factură reală sau de test (poți folosi una din `backend-project/training-data/originals/`)
☐ Dacă n-ai, descarcă o factură-mostră de pe net sau scoate una dintr-o factură de utilități și anonimizează datele cu Paint
☐ Salvează ca `figuri/factura_originala.jpg`

**Pasul 2: rulează preprocesarea**
☐ În terminal:
```
cd c:\Depozit\gitProjects\Teza-de-licenta\backend-project\ai-service
docker compose exec ai-service python -c "
import cv2
from app.processors.ocr_processor import OCRProcessor
img = cv2.imread('/app/storage/uploads/factura_test.jpg')
proc = OCRProcessor()
result = proc.preprocess_image(img)
cv2.imwrite('/app/storage/uploads/factura_preprocesata.jpg', result)
print('Gata')
"
```
☐ Copiază rezultatul în folderul `figuri/`:
```
copy backend-project\storage\uploads\factura_preprocesata.jpg teza\figuri\
```

**Pasul 3: extrage textul recunoscut**
☐ Încarcă factura prin aplicația web (logat ca client)
☐ Așteaptă procesarea
☐ Click pe document → vezi câmpurile extrase
☐ Captează tabelul cu textul OCR (3-4 câmpuri principale)
☐ Salvează ca `figuri/text_ocr.png`

**Pasul 4: compune Figura 3.5**
☐ Deschide PowerPoint sau Canva
☐ Pune cele 3 imagini (originală | preprocesată | text OCR) în același slide, lipite
☐ Adaugă etichete: „Original", „După preprocesare", „Text recunoscut"
☐ Export → PNG → salvează ca `Figura_3_5.png`

> **Mai simplu:** dacă nu ai timp, fă doar 2 capturi separate (originală + preprocesată), spui în text că textul OCR e în Tabelul 3.X care îl referențiezi separat.

---

## FAZA 5 — Capturi mobile (15 minute)

> Ai nevoie de **telefon fizic Android sau iPhone** cu **Expo Go** instalat.

### Pregătire mobilă
☐ Pe telefon: instalează **Expo Go** din Play Store / App Store
☐ Pe PC: în al treilea terminal:
```
cd c:\Depozit\gitProjects\Teza-de-licenta\frontend-mobile-aplication
npm install
npx expo start
```
☐ Va apărea un cod QR în terminal
☐ Pe telefon: deschide Expo Go → Scan QR Code → scanează codul din terminal
☐ Așteaptă să se încarce aplicația AI-Contabil

### Figura 3.11 — Camera mobil + confirmare
☐ Loghează-te în aplicația mobilă cu contul client
☐ Tap pe tab-ul **Criere** (jos)
☐ Selectează opțiunea **Camera**
☐ Permite accesul la cameră dacă te întreabă
☐ Pune un document în fața camerei (chiar și o factură de test) astfel încât să se vadă cadrul de ghidaj suprapus
☐ **Captură 1:** apasă `Volume Down + Power` simultan → capturezi ecranul cu camera + cadru
☐ Apasă butonul de declanșare ca să faci poza
☐ Vezi ecranul de confirmare cu poza + butoanele „Reia" / „Trimite"
☐ **Captură 2:** capturezi ecranul de confirmare
☐ Transferă cele 2 capturi pe PC (Google Drive, USB, sau email)
☐ Combină-le lateral (stânga/dreapta) în PowerPoint sau Canva
☐ Salvează ca `Figura_3_11.png`

### Figura 3.12 — 2FA prin QR
Aceasta e mai complicată — necesită 2 capturi simultane.

☐ Pe PC: deschide aplicația web la `localhost:5173/signin`
☐ Loghează-te cu credențiale care au 2FA activat → se afișează un cod QR pe ecran
☐ **Captură 1 (PC):** captezi ecranul web cu codul QR + instrucțiunea „Scanează cu mobilul"
☐ Pe mobil: în aplicația ta, deschide opțiunea de scanare cod QR (în profil sau setări)
☐ Apropie camera mobilului de codul QR de pe ecranul PC-ului
☐ **Captură 2 (mobil):** captezi ecranul mobilului cu camera deschisă pe codul QR și mesajul de confirmare
☐ Transferă pe PC, combină lateral
☐ Salvează ca `Figura_3_12.png`

---

## VERIFICARE FINALĂ

După ce ai făcut toate capturile, în folderul `teza/figuri/` trebuie să ai:

```
☐ Figura_3_1.png   (VS Code Explorer)
☐ Figura_3_2.png   (VS Code + Docker + terminal)
☐ Figura_3_3.png   (docker compose ps)
☐ Figura_3_4.png   (Swagger UI)
☐ Figura_3_5.png   (Pipeline OCR)
☐ Figura_3_6.png   (Widget Djarvis)
☐ Figura_3_7.png   (Login web)
☐ Figura_3_8.png   (Dashboard client)
☐ Figura_3_9.png   (Coadă contabil)
☐ Figura_3_10.png  (Admin antrenare)
☐ Figura_3_11.png  (Camera mobilă)
☐ Figura_3_12.png  (2FA prin QR)
☐ Figura_3_13.png  (Pytest)
```

---

## INSERARE ÎN WORD

După ce ai toate capturile:

1. Deschide `Teza_Capitol_3_Final.docx` în Word
2. `Ctrl+F` → caută `[FIGURA 3.1`
3. Selectează tot marcajul roșu cu paragraful întreg → `Delete`
4. La aceeași poziție: `Insert` → `Pictures` → `This Device` → alege `Figura_3_1.png`
5. Click pe imagine → click dreapta → `Wrap Text` → `In Line with Text`
6. Click pe imagine → tab `Picture Format` → `Position` → `Center`
7. Verifică că rămâne linia „Figura 3.1. Organizarea pe componente..." sub imagine
8. Repetă pentru toate 13 figurile

---

## DACĂ TE BLOCHEZI

Pentru orice pas de mai sus dacă te blochezi (eroare, nu pornește un serviciu, nu găsești o pagină), spune-mi exact:
- Ce pas executai
- Ce comandă ai dat
- Ce eroare ai primit (copy-paste din terminal sau screenshot)

Și te ajut imediat să rezolvi.

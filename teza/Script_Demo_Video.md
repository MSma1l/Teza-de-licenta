# SCRIPT VIDEO DEMO — AI-CONTABIL (SILENT, doar vizual)

> **Durată țintă:** 100 secunde (între 90–120s)
> **Stil:** demo curat, fără voce. Toate informațiile cheie sunt **text overlay** pe ecran.
> **Muzică:** instrumental discret de fundal (lofi tech / minimal electronic)
> **Tranziții:** fade scurte (0.3s) între scene

---

## ⚙️ PREGĂTIRE ÎNAINTE DE RECORDING

### Ce ai deschis în paralel
| Fereastra | URL / Stare |
|---|---|
| **Browser 1** (profil A) | `localhost:5173` deconectat (pentru landing) |
| **Browser 2** (profil B) | `localhost:5173/documents` — **client_test** logat |
| **Browser 3** (profil C) | `localhost:5173/contabil?tab=coada` — **contabil_test** logat |
| **Browser 4** (profil D) | `localhost:5173/admin?tab=antrenare` — **admin_test** logat |
| **Telefon** | Expo Go pe tab „Creare" (sau scrcpy pe PC) |
| **Terminal** | Gata pentru `docker compose ps` |

### Clipboard pregătit
- `Cand trebuie sa depun declaratia TVA D300?`
- `HG nr. 100/2026 — Salariul minim brut`

### OBS Settings
- Output: **1080p (1920×1080)**, MP4, 8000 kbps, 30 fps
- Audio: **dezactivat** (nu ai nevoie de microfon)
- Mouse cursor: vizibil (Settings OBS → Sources → Display Capture → Capture Cursor ON)

---

## 🎬 SCRIPT — Filmezi exact ce e mai jos

> **Convenții:**
> `[ACȚIUNE]` = ce miști pe ecran
> `📝 OVERLAY` = text suprapus pe video (îl adaugi în Clipchamp după)
> `⏱️ 0:00–0:08` = secundele când apare overlay-ul

---

### SCENA 1 — Hook (0:00 → 0:10)

`[Ecran negru complet, cu fade-in al unui text mare alb pe centru]`

**📝 OVERLAY 1** *(0:01 → 0:08, font mare bold, centrat)*
```
80% din firmele mici de contabilitate
din Republica Moldova folosesc 1C.
```

**📝 OVERLAY 2** *(0:08 → 0:10, font mai mic, sub primul, gri)*
```
Fără AI. Fără client portal. Fără mobil.
```

`[Fade out la negru]`

**🎯 Tip:** Lasă textul în pace ~5 secunde ca să-l citească privitorul. Nu pune muzică intensă aici.

---

### SCENA 2 — Soluția (0:10 → 0:20)

`[Switch la Browser 1 — pagina home, deconectat]`
`[Smooth scroll de sus în jos prin secțiuni: Hero → About → Laws → Documents → Contact]`

**📝 OVERLAY** *(0:11 → 0:18, în colț stânga-sus, fundal semitransparent)*
```
🤖 AI-CONTABIL
Trei roluri · Trei interfețe · Un flux automat
```

**🎯 Tip:** Scroll-ul trebuie să fie **uniform**, fără salturi. Folosește `Page Down` apăsat o dată per secundă, NU tracker-ul mouse-ului.

---

### SCENA 3 — Client: upload + procesare (0:20 → 0:35)

`[Switch la Browser 2 — pagina /documents, logat ca client]`
`[2s — pauză vizuală pe tabelul cu cele 4 documente existente]`
`[Click pe „Încarcă document"]`
`[Drag&drop o factură nouă în zonă]`
`[Click pe „Încarcă"]`
`[Documentul apare în tabel cu status „processing" cu animație]`

**📝 OVERLAY 1** *(0:21 → 0:25, săgeată desenată spre tabel)*
```
👤 CLIENT — vede documentele proprii
```

**📝 OVERLAY 2** *(0:28 → 0:34, săgeată spre statusul „processing")*
```
⚡ AI Pipeline:
OpenCV → PaddleOCR → BERT → FAISS
~30 secunde
```

**🎯 Tip:** Mouse-ul îl miști **lent**, nu zvâcnit. Pauzează 1s pe butonul de upload înainte să-l apeși.

---

### SCENA 4 — Mobile (0:35 → 0:45)

`[Switch la captura telefon / scrcpy / video pre-înregistrat al telefonului]`
`[Tab „Creare" → opțiunea camera]`
`[3s — camera live cu cadru ghidaj suprapus pe o factură printată]`
`[Click pe declanșator]`
`[Apare preview cu butoanele „Refa poza" / „Foloseste imaginea"]`
`[Click pe „Foloseste imaginea"]`

**📝 OVERLAY** *(0:36 → 0:42, fundal verde semitransparent)*
```
📱 MOBIL — Scanare cu camera
Captare → Preprocesare locală → Upload securizat
```

**🎯 Tip:** Dacă nu ai telefon, folosește o **animație simplă** în Clipchamp: o imagine statică a aplicației mobile cu o săgeată desenată „click aici". Sau sări peste această scenă (durata totală scade la 90s).

---

### SCENA 5 — Contabil: coadă + validare OCR (0:45 → 1:05)

`[Switch la Browser 3 — /contabil?tab=coada]`
`[2s — vedere de ansamblu pe coada cu cele 4 documente]`
`[Hover lent peste etichetele colorate URGENT (roșu) → MEDIU (portocaliu) → NORMAL (verde)]`
`[Click pe primul document URGENT — Factura nr.4 sau nr.1]`
`[Panoul dreapta se deschide — pauză 2s să se vadă tot]`
`[Scroll lent prin câmpurile extrase, oprire pe cele galbene (62% și 58%)]`
`[Hover peste butonul „Aprobă document"]`

**📝 OVERLAY 1** *(0:46 → 0:52, lângă etichete)*
```
🎯 Coadă sortată automat după urgență
🔴 URGENT  🟠 MEDIU  🟢 NORMAL
```

**📝 OVERLAY 2** *(0:55 → 1:04, săgeată spre câmpurile galbene)*
```
🟡 Confidence < 80% = revizie manuală
✅ Confidence ≥ 80% = aprobare automată
```

**🎯 Tip:** Aceasta e cea mai importantă scenă vizuală a demo-ului. Mișcă-te **încet și deliberat** prin elementele UI.

---

### SCENA 6 — Djarvis chat (1:05 → 1:20)

`[Rămâi pe Browser 3 — click pe widget chat din colț dreapta-jos]`
`[Widget se deschide — 1s]`
`[Lipești cu Ctrl+V întrebarea: „Cand trebuie sa depun declaratia TVA D300?"]`
`[Apeși Enter]`
`[3-5s — răspunsul Djarvis apare progresiv]`
`[Highlight pe textul cu citarea „Codul Fiscal RM, art. 187"]`

**📝 OVERLAY 1** *(1:06 → 1:12, lângă widget)*
```
🤖 Djarvis — agent AI conversațional
Răspunsuri în română, citate din legislație
```

**📝 OVERLAY 2** *(1:15 → 1:20, în colț dreapta-sus)*
```
🔒 100% LOCAL
Ollama + qwen2.5:3b
Datele NU părăsesc firma
```

**🎯 Tip:** Lipirea întrebării în chat — folosește `Ctrl+V`, nu o tasta cuvânt-cu-cuvânt (pierdere de timp). Așteptă răspunsul complet — dacă durează > 6s, accelerezi acea porțiune din video la 2x în Clipchamp.

---

### SCENA 7 — Admin: antrenare + adăugare lege (1:20 → 1:38)

`[Switch la Browser 4 — /admin?tab=antrenare]`
`[Pauză 2s pe statistici (4 carduri sus)]`
`[Scroll la tabelul cu cele 5 versiuni de model]`
`[Hover peste rândurile cu acuratețea 84% → 88% → 91%]`
`[Click pe tab-ul „Adaugă lege"]`
`[Lipești titlul: „HG nr. 100/2026 — Salariul minim brut"]`
`[Selectezi categoria „Hotărârea Guvernului"]`
`[Lipești câteva linii în textarea de conținut]`
`[Hover peste butonul „Adaugă articol și reconstruiește indexul"]`

**📝 OVERLAY 1** *(1:21 → 1:27, lângă tabelul versiunilor)*
```
📈 Modelul AI învață din corecții
84.7% → 87.9% → 91.3% acuratețe
```

**📝 OVERLAY 2** *(1:32 → 1:38, lângă formular)*
```
📜 Adaugi o lege nouă în corpus
→ Index FAISS reconstruit automat
→ Djarvis o folosește instant
```

**🎯 Tip:** Pe tabelul cu versiunile, dacă reușești, fă **zoom** ușor (1.2x) pe coloana „Acuratețe" ca să se vadă bine valorile.

---

### SCENA 8 — Final: arhitectura (1:38 → 1:50)

`[Switch la Terminal PowerShell]`
`[Tastezi rapid (sau ai pre-tastat): docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"]`
`[Apeși Enter — apare tabelul cu cele 9 containere]`
`[Pauză 4s ca să se vadă tot]`
`[Fade lent la slide final pe fundal negru cu logo + numele tău]`

**📝 OVERLAY 1** *(1:39 → 1:46, în partea de sus a terminalului)*
```
🐳 9 containere Docker · 1 rețea comună
```

**📝 SLIDE FINAL** *(1:46 → 1:50, fundal negru centrat)*
```
AI-CONTABIL
Inteligența artificială pentru contabilul mic

Maxim Chistol
Universitatea Tehnică a Moldovei
FCIM, 2026
```

**🎯 Tip:** Slide-ul final e cel mai important moment — îl ții **4 secunde** ca să se imprime. Folosește un fade out lent (1s) la negru ca închidere.

---

## ⏱️ TIMING TOTAL

| Scenă | Durată | Cumulativ |
|---|---|---|
| 1. Hook | 10s | 0:10 |
| 2. Landing | 10s | 0:20 |
| 3. Client upload | 15s | 0:35 |
| 4. Mobile | 10s | 0:45 |
| 5. Contabil OCR | 20s | 1:05 |
| 6. Djarvis | 15s | 1:20 |
| 7. Admin | 18s | 1:38 |
| 8. Final | 12s | 1:50 |
| **TOTAL** | **110s** | **1:50** |

Buffer de 10s pentru ajustări = **target final 100-110 secunde**.

---

## 🎨 STIL OVERLAY-URI ÎN CLIPCHAMP

### Font recomandat
- **Title overlays:** Inter / Poppins / SF Pro Bold (sans-serif modern)
- **Body overlays:** Inter Regular / Outfit Regular
- **Niciodată Times New Roman sau Comic Sans în demo!**

### Culori
| Element | Culoare HEX |
|---|---|
| Fundal text overlay | `rgba(0, 0, 0, 0.75)` (semitransparent negru) |
| Text overlay principal | `#FFFFFF` (alb pur) |
| Accent culoare | `#4F46E5` (indigo, brand-ul aplicației) |
| Verde succes | `#10B981` |
| Galben atenție | `#F59E0B` |
| Roșu urgent | `#EF4444` |

### Animația overlay-ului
- **Apariție:** Fade-in 0.3s
- **Dispariție:** Fade-out 0.3s
- **NU folosi:** zoom, rotire, bounce — distrag atenția

### Poziționare
- **Colț stânga-sus** sau **dreapta-jos** pentru info contextuală
- **Centrat** doar pentru hook + slide final
- **Lângă element** doar cu săgeată desenată subtil

---

## 🎵 MUZICĂ DE FUNDAL — recomandări concrete

> **Volum:** -20dB peak (mai jos decât voiceover-ul tipic, ca să nu domine)
> **Tip:** instrumental, fără vocal, ritm constant

### Surse gratuite
1. **YouTube Audio Library** (https://youtube.com/audiolibrary)
   - Caută: `corporate ambient`, `tech minimal`, `inspirational instrumental`
2. **Pixabay Music** (https://pixabay.com/music)
   - Caută: `lofi tech`, `electronic ambient`, `corporate background`
3. **FreePD** (https://freepd.com)
   - Categoria: `Electronic` sau `Ambient`

### Track-uri specifice (verifică licența la momentul descărcării)
- „Cyber Lounge" — pe Pixabay
- „Inspiring Corporate" — pe YouTube Audio Library
- „Minimal Tech" — pe FreePD

### Cum o pui în Clipchamp
1. **Audio track** separat de video
2. Volum **20-25%** din maxim
3. **Fade-in** 1s la început, **Fade-out** 2s la final
4. Track-ul trebuie să fie **mai lung** decât 110s — sau folosești 2 track-uri lipite

---

## 📋 CHECKLIST FINAL ÎNAINTE DE RECORDING

### Tehnic OBS
- [ ] Output: **1920×1080**, 30 fps, MP4
- [ ] Bitrate **8000 kbps**
- [ ] Audio **dezactivat** (no microphone needed)
- [ ] Cursor visible
- [ ] Hotkey-uri pentru switch scene (F1-F8)

### Curățenie pe ecran
- [ ] **Notificări Windows oprite** (Focus Assist ON)
- [ ] Tab-urile irelevante închise în fiecare browser
- [ ] Bara taskbar Windows configurată **auto-hide** (Settings → Personalization → Taskbar)
- [ ] Wallpaper desktop curat (fără iconițe random)
- [ ] Browser fără bookmarks bar vizibil (`Ctrl+Shift+B` ca să-l ascunzi)
- [ ] Browser fără extensii care arată notificări în colț

### Conținut pregătit
- [ ] 4 ferestre browser deschise și logate
- [ ] Telefon conectat la app SAU video pre-înregistrat al telefonului
- [ ] Clipboard cu întrebare Djarvis
- [ ] Terminal cu comanda `docker compose ps...` pre-tastată

---

## 🔄 STRATEGIE DE FILMARE — varianta A vs B

### Varianta A — 1 take (recomandată acum, fără voce)
Filmezi tot recording-ul de la 0 la ~110s într-un singur take. Adaugi text overlay-uri în Clipchamp.

**Avantaj:** mișcările sunt naturale, switch-urile între ferestre se simt fluide.
**Dezavantaj:** dacă greșești la 1:25, reiei totul.

**De ce o recomand acum:** fără voce, riscul de greșeală e MULT mai mic. Doar miști mouse-ul.

### Varianta B — Scenă cu scenă
Filmezi fiecare scenă separat. Combini în Clipchamp.

**Avantaj:** dacă greșești scena 5, refaci doar scena 5.
**Dezavantaj:** edit consumator de timp; scena de tranziție între ferestre poate părea ruptă.

---

## 💡 SFATURI BONUS

1. **Mișcare cursor:** folosește o **viteza redusă** (Settings → Mouse → Pointer speed la jumătate). Mouse-ul „normal" pare prea zvâcnit pe ecran HD.

2. **Pauze:** **3-4 secunde** de pauză vizuală pe fiecare ecran nou. Privitorul are nevoie de timp să citească UI-ul.

3. **Click highlight:** activează „Show clicks" în OBS sau folosește **MouseClickEffect** (gratuit) — un cerc galben apare la fiecare click. Demo-ul se simte mult mai profesional.

4. **Zoom în Clipchamp:** la momentele importante (ex: confidence galben, acuratețea 91%), aplici un **zoom de 1.3-1.5x** pentru 2-3 secunde. Atrage atenția fără să distrugă fluxul.

5. **Dacă ceva merge prost în recording:** **NU** te opri și începi de la 0. Continuă și taie partea proastă în Clipchamp. Mai bine ai un take cu 2 ajustări decât 5 take-uri proaste.

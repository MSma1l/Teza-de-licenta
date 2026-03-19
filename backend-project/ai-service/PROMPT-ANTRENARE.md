# PROMPT PENTRU ANTRENAREA MODELULUI AI-CONTABIL

Acest fișier conține 3 prompt-uri:
1. **PROMPT INIȚIAL** - prima antrenare cu primele documente reale
2. **PROMPT CORECȚIE** - adaugi elemente, corectezi, îmbunătățești iterativ
3. **PROMPT TESTARE** - verifici acuratețea și vezi ce mai lipsește

Fluxul: INIȚIAL → CORECȚIE → CORECȚIE → ... → TESTARE → CORECȚIE → ...

---

## PROMPT 1: ANTRENARE INIȚIALĂ (prima dată)

Copiază + atașează documentele reale ca imagini:

```
Lucrez la proiectul AI-Contabil (Teza de licență).
Proiectul se află la: c:/Depozit/gitProjects/Teza-de-licenta/

Am atașat [NUMĂR] documente reale contabile. Acestea sunt exemplele mele
de bază din care modelul trebuie să învețe.

Documentele atașate sunt:
1. [ex: "Factură reală de la SC Furnizor SRL - format tipic cu antet sus, tabel produse, totaluri jos"]
2. [ex: "Chitanță de la farmacie - format mic, doar total și dată"]
3. [ex: "Extras de cont BCR - format tabelar cu tranzacții"]
... [descrie fiecare - cu cât mai detaliat, cu atât mai bine]

CONTEXT IMPORTANT:
- Aceste documente sunt din Republica Moldova / România
- Limba principală: română, dar pot conține și rusă sau engleză
- Formatele variază mult între furnizori
- Unele pot fi scanări, altele poze de telefon
- Voi adăuga mai multe documente și corecții pe parcurs în conversații viitoare

CE VREAU SĂ FACI (în ordine):

PASUL 1 - ANALIZA FIECĂRUI DOCUMENT
Pentru fiecare imagine atașată:
- Tipul documentului (factură, chitanță, contract, declarație, stat plată, extras bancar, altele)
- LISTA COMPLETĂ a câmpurilor vizibile: nr. document, serie, dată emitere, dată scadență,
  furnizor, client, CUI furnizor, CUI client, adresă, telefon, IBAN, banca,
  descriere produse/servicii, cantitate, preț unitar, subtotal per linie,
  subtotal general, TVA %, sumă TVA, TOTAL, moneda, curs valutar,
  serie bon fiscal, nr. casei de marcat, orice alte date vizibile
- FORMATUL EXACT al fiecărui câmp așa cum apare pe document
  (ex: "CUI: RO12345678" sau "C.I.F. RO-12345678" sau "Cod fiscal: 12345678")
- POZIȚIA pe document: header/body/footer, stânga/centru/dreapta
- Specificități unice ale acelui format de document

PASUL 2 - CREARE ADNOTĂRI COMPLETE (GROUND TRUTH)
Salvează fișiere JSON în: training_data/real_templates/annotations/
Un fișier per document, format:
{
  "filename": "factura_001.png",
  "document_type": "invoice",
  "language": "ro",
  "format_notes": "Format standard cu antet companie sus-stânga, client sus-dreapta, tabel produse centru, totaluri jos-dreapta",
  "entities": {
    "invoice_num": {"value": "AB 0123", "raw_format": "Seria AB Nr. 0123", "position": "header-center"},
    "date_issued": {"value": "15.03.2026", "raw_format": "Data emiterii: 15.03.2026", "position": "header-left"},
    "date_due": {"value": "15.04.2026", "raw_format": "Data scadenței: 15.04.2026", "position": "header-right"},
    "vendor_name": {"value": "SC Test SRL", "raw_format": "FURNIZOR: SC Test SRL", "position": "top-left"},
    "vendor_cui": {"value": "RO12345678", "raw_format": "CUI: RO12345678", "position": "top-left"},
    "vendor_address": {"value": "Str. Exemplu 10, București", "raw_format": "...", "position": "top-left"},
    "vendor_iban": {"value": "RO49AAAA1B31007593840000", "raw_format": "IBAN: RO49AAAA...", "position": "top-left"},
    "vendor_bank": {"value": "Banca Transilvania", "raw_format": "Banca: BT", "position": "top-left"},
    "client_name": {"value": "SC Client SRL", "raw_format": "CLIENT: SC Client SRL", "position": "top-right"},
    "client_cui": {"value": "RO87654321", "raw_format": "CUI: RO87654321", "position": "top-right"},
    "subtotal": {"value": "25000.00", "raw_format": "Subtotal: 25.000,00 LEI", "position": "bottom-right"},
    "vat_percent": {"value": "19", "raw_format": "TVA 19%", "position": "bottom-right"},
    "vat_amount": {"value": "4750.00", "raw_format": "TVA: 4.750,00 LEI", "position": "bottom-right"},
    "total": {"value": "29750.00", "raw_format": "TOTAL DE PLATĂ: 29.750,00 LEI", "position": "bottom-right"},
    "currency": {"value": "LEI", "raw_format": "LEI", "position": "bottom-right"}
  },
  "line_items": [
    {"description": "Servicii consultanță", "quantity": "10", "unit_price": "1500.00", "line_total": "15000.00"},
    {"description": "Licență software", "quantity": "5", "unit_price": "2000.00", "line_total": "10000.00"}
  ]
}

PASUL 3 - ACTUALIZARE REGEX PATTERNS (ner_extractor.py)
Citește: backend-project/ai-service/app/processors/ner_extractor.py
Pe baza formatelor REALE din documentele mele:
- Adaugă TOATE variantele de scriere pe care le-ai văzut
  (ex: "CUI", "C.U.I.", "C.I.F.", "Cod fiscal", "Cod unic", "ÎM", "IDNO")
- Adaugă formate de date: "15.03.2026", "15/03/2026", "15 martie 2026", "2026-03-15"
- Adaugă formate de sume: "25.000,00", "25,000.00", "25000.00", "25 000,00"
- Adaugă formate IBAN specifice băncilor din RO/MD
- IMPORTANT: păstrează pattern-urile existente, doar adaugă cele noi

PASUL 4 - ACTUALIZARE KEYWORD CLASSIFIER (classifier.py)
Citește: backend-project/ai-service/app/processors/classifier.py
Adaugă keywords din textul REAL al documentelor mele:
- Cuvinte specifice care apar pe facturile mele dar nu sunt în lista curentă
- Cuvinte din chitanțe, extrase, declarații - tot ce e specific formatelor mele
- Adaugă și variante în rusă/engleză dacă documentele le conțin

PASUL 5 - GENERARE COMBINAȚII SINTETICE
Actualizează: tools/generate_training_data.py
Pe baza documentelor mele reale:
- COPIAZĂ layout-ul EXACT din fiecare document real
- Adaugă TOATE companiile reale pe care le-ai văzut în datele FIRMS[]
- Adaugă TOATE produsele/serviciile reale în PRODUCTS[]
- Generează COMBINAȚII realiste:
  * Fiecare furnizor real × fiecare client real × date random × sume random
  * Fiecare format de factură × toate combinațiile de date
  * Amestecă elemente: un furnizor cu format de la altul
- Adaugă elemente mici realiste:
  * Ștampile rotunde (cerc gri semitransparent)
  * Semnături (linie ondulată)
  * Numere de înregistrare
  * Cod QR placeholder (pătrat negru mic)
  * Watermark-uri ușoare ("COPIE", "ORIGINAL")
  * Linii de tabel cu grosimi diferite
  * Font-uri diferite (bold pe titlu, normal pe date)
  * Aliniere variabilă (nu tot perfect centrat)
- 3 calități per document generat:
  * Scanare curată (300 DPI, alb-negru curat)
  * Scanare uzată (zgomot ușor, contrast mai slab, mici pete)
  * Poză telefon (rotație 1-3°, blur, umbră, fundal bej)

PASUL 6 - GENERARE 500 DOCUMENTE
Rulează generatorul:
  python tools/generate_training_data.py --count 500 --output training_data/synthetic
Verifică câteva imagini generate și arată-mi 2-3 exemple.

PASUL 7 - TEST PE DOCUMENTELE REALE
Rulează pipeline-ul pe fiecare document REAL atașat:
- Arată-mi ce a extras OCR-ul vs ce e corect (din adnotări)
- Arată-mi clasificarea: corectă sau greșită?
- Arată-mi entitățile: care au fost găsite, care lipsesc, care sunt greșite?
- Calculează acuratețea per câmp

PASUL 8 - RAPORT COMPLET
Dă-mi:
- Tabel cu fiecare document real: ce a mers, ce nu
- Acuratețe per tip de entitate (CUI: 90%, data: 85%, total: 95%...)
- Ce regex-uri ai adăugat
- Ce keywords ai adăugat
- Câte combinații sintetice s-au generat
- Ce mai trebuie: mai multe documente din tipul X, format Y nu e acoperit, etc.

IMPORTANT:
- NU folosi API-uri externe - totul e LOCAL
- Codul processorilor: backend-project/ai-service/app/processors/
- Training data: backend-project/ai-service/training_data/
- Generatorul: backend-project/ai-service/tools/
- Păstrează codul existent, doar adaugă/actualizează
```

---

## PROMPT 2: CORECȚIE ȘI ÎMBUNĂTĂȚIRE (folosește repetat)

Copiază + atașează documente noi SAU descrie ce trebuie corectat:

```
Continuare antrenare AI-Contabil.
Proiect: c:/Depozit/gitProjects/Teza-de-licenta/

[ALEGE CE SE APLICĂ:]

A) AM DOCUMENTE NOI - am atașat [NUMĂR] documente noi:
   1. [descrie documentul]
   2. [descrie documentul]
   Procesează-le la fel ca în prompt-ul inițial (adnotări, regex, keywords, combinații).

B) CORECȚII PE EXTRAGERE - aceste câmpuri nu se extrag corect:
   - [ex: "CUI-ul scris ca 'Cod fiscal: 12345678' nu e prins de regex"]
   - [ex: "Data în format '15 mar. 2026' nu e recunoscută"]
   - [ex: "Sumele cu spațiu '25 000,00' nu sunt extrase"]
   Actualizează regex-urile în ner_extractor.py.

C) CORECȚII PE CLASIFICARE - aceste documente sunt clasificate greșit:
   - [ex: "Avizul de expediere e clasificat ca factură, dar nu e"]
   - [ex: "Nota de recepție nu e recunoscută deloc"]
   Actualizează keywords în classifier.py. Adaugă tip nou dacă trebuie.

D) ELEMENTE VIZUALE NOI pentru generare:
   - [ex: "Facturile mele au logo color în colțul stânga-sus"]
   - [ex: "Chitanțele au cod de bare jos"]
   - [ex: "Extrasele bancare au header cu logo bancă"]
   - [ex: "Unele facturi au 2 coloane: furnizor stânga, client dreapta"]
   Actualizează generatorul să includă aceste elemente.

E) CALITATE OCR - probleme specifice:
   - [ex: "Pe documente vechi, textul e estompat și OCR-ul nu citește"]
   - [ex: "Ștampilele se suprapun peste text și OCR-ul confundă"]
   - [ex: "Pozele făcute cu telefonul au reflexie de lumină"]
   Actualizează preprocessing-ul în ocr_processor.py.

După ce faci modificările:
1. Regenerează 100 documente sintetice noi cu corecțiile aplicate
2. Testează pe documentele reale (vechi + noi)
3. Arată-mi acuratețea ÎNAINTE și DUPĂ corecții
4. Spune-mi ce acuratețe avem acum și ce mai lipsește
```

---

## PROMPT 3: TESTARE ACURATEȚE (verificare periodică)

```
Testare acuratețe AI-Contabil.
Proiect: c:/Depozit/gitProjects/Teza-de-licenta/

Am atașat [NUMĂR] documente de TEST (nu le-a mai văzut modelul).

Pentru fiecare document:
1. Rulează pipeline-ul complet (OCR → clasificare → extracție → urgency)
2. Arată-mi EXACT ce a extras modelul
3. Eu îți spun ce e corect și ce e greșit

După ce primești feedback-ul meu:
1. Calculează acuratețea per câmp
2. Identifică pattern-urile de erori (unde greșește sistematic)
3. Propune fix-uri concrete (regex nou, keyword nou, mai multe exemple din tipul X)
4. Aplică fix-urile
5. Arată-mi acuratețea nouă

Target: 95%+ pe clasificare, 90%+ pe extracție entități.
```

---

## STRUCTURA FIȘIERE TRAINING

```
backend-project/ai-service/training_data/
├── real_templates/              ← Documentele tale reale
│   ├── factura_001.png
│   ├── chitanta_001.png
│   └── annotations/            ← Adnotări JSON per document
│       ├── factura_001.json
│       └── chitanta_001.json
├── synthetic/                   ← Generate automat
│   ├── images/                  ← Mii de imagini
│   │   ├── invoice_00001.png
│   │   ├── invoice_00002.png
│   │   └── ...
│   └── annotations.json        ← Ground truth pentru toate
├── corrections/                 ← Corecții din interfața /training
│   └── corrections.jsonl        ← Se acumulează automat
└── test_set/                    ← Documente pentru testare (nu antrenare!)
    ├── test_factura_01.png
    └── test_chitanta_01.png
```

## PLAN DE ANTRENARE RECOMANDAT

| Săptămâna | Ce faci | Rezultat așteptat |
|---|---|---|
| 1 | Prompt 1 cu 10-15 documente reale | Regex + keywords actualizate, 500 sintetice |
| 1 | Prompt 2 (B) - corectezi 5-10 erori | Acuratețe regex: 80%+ |
| 2 | Prompt 2 (A) - adaugi 10 documente noi | Mai multe formate acoperite |
| 2 | Prompt 2 (D) - adaugi elemente vizuale | Generare mai realistă |
| 2 | Prompt 3 - testare cu 5 documente noi | Știi exact unde greșește |
| 3 | Prompt 2 (B+C) - corectezi ce a greșit | Acuratețe: 88-92% |
| 3 | Regenerare 1000 sintetice cu toate fix-urile | Dataset complet |
| 3 | Antrenare BERT (din /training sau API) | Model ML funcțional |
| 4+ | Prompt 2 repetat + Prompt 3 periodic | Target 95%+ |

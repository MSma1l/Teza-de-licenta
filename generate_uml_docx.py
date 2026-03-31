"""
Generare document Word cu 4 diagrame UML + explicatii detaliate.
Diagramele sunt desenate programatic cu python-docx.
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
import os

doc = Document()

# =====================================================
# STILURI
# =====================================================
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5

for level in range(1, 4):
    h_style = doc.styles[f'Heading {level}']
    h_style.font.name = 'Times New Roman'
    h_style.font.color.rgb = RGBColor(0, 0, 0)


def add_diagram_table(doc, rows_data, col_widths=None, title=None):
    """Adauga un tabel formatat ca diagrama."""
    if title:
        p = doc.add_paragraph()
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(11)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    num_cols = max(len(row) for row in rows_data)
    table = doc.add_table(rows=len(rows_data), cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, row_data in enumerate(rows_data):
        for j, cell_text in enumerate(row_data):
            if j < num_cols:
                cell = table.cell(i, j)
                cell.text = cell_text
                for paragraph in cell.paragraphs:
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for run in paragraph.runs:
                        run.font.size = Pt(9)
                        run.font.name = 'Consolas'

    return table


def set_cell_shading(cell, color):
    """Seteaza culoarea de fundal a unei celule."""
    shading = cell._element.get_or_add_tcPr()
    shading_elem = shading.makeelement(qn('w:shd'), {
        qn('w:fill'): color,
        qn('w:val'): 'clear',
    })
    shading.append(shading_elem)


def add_colored_table(doc, rows_data, colors=None):
    """Tabel cu culori pe celule."""
    num_cols = max(len(row) for row in rows_data)
    table = doc.add_table(rows=len(rows_data), cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    for i, row_data in enumerate(rows_data):
        for j, cell_text in enumerate(row_data):
            if j < num_cols:
                cell = table.cell(i, j)
                cell.text = cell_text
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for run in p.runs:
                        run.font.size = Pt(9)
                        run.font.name = 'Consolas'
                if colors and i < len(colors) and j < len(colors[i]):
                    if colors[i][j]:
                        set_cell_shading(cell, colors[i][j])

    return table


# =====================================================
# PAGINA DE TITLU
# =====================================================
doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('DIAGRAME UML')
run.bold = True
run.font.size = Pt(24)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Sistem AI-Contabil')
run.font.size = Pt(18)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Aplicatie Web + Aplicatie Mobila + Backend API + Model LLM/AI')
run.font.size = Pt(14)
run.font.color.rgb = RGBColor(100, 100, 100)

doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Teza de licenta')
run.font.size = Pt(14)

doc.add_page_break()

# =====================================================
# CUPRINS
# =====================================================
doc.add_heading('Cuprins', level=1)
cuprins = [
    '1. Diagrama Use Case nr. 1 - Interactiunea Clientului si Contabilului cu Sistemul',
    '2. Diagrama Use Case nr. 2 - Administrarea si Antrenarea Modelului AI',
    '3. Diagrama de Activitati - Procesarea unui Document prin Pipeline-ul AI',
    '4. Diagrama de Secventa - Mersul Sistemului (Fluxul Complet de Comunicare)',
]
for item in cuprins:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(6)

doc.add_page_break()

# =====================================================
# DIAGRAMA 1: USE CASE - Client si Contabil
# =====================================================
doc.add_heading('1. Diagrama Use Case nr. 1', level=1)
doc.add_heading('Interactiunea Clientului si Contabilului cu Sistemul', level=2)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Descriere: ')
run.bold = True
p.add_run(
    'Aceasta diagrama prezinta cazurile de utilizare principale pentru doua categorii de utilizatori - '
    'Clientul (care incarca documente si vizualizeaza rapoarte) si Contabilul (care proceseaza, verifica '
    'si aproba documentele). Ambii interactioneaza cu sistemul prin doua interfete: aplicatia web si '
    'aplicatia mobila, care comunica cu Backend-ul API. Backend-ul transmite documentele catre '
    'Serviciul AI (LLM) pentru procesare automata.'
)

doc.add_paragraph()

# Diagrama ca tabel structurat
rows = [
    ['', '', 'SISTEM AI-CONTABIL', '', ''],
    ['', '', '(Backend API + AI Service)', '', ''],
    ['', '', '', '', ''],
    ['ACTOR: CLIENT', '', 'USE CASES', '', 'ACTOR: CONTABIL'],
    ['(Web + Mobile)', '', '', '', '(Web)'],
    ['', '', '', '', ''],
    ['  [Client]------->', '', '[UC1] Inregistrare / Autentificare', '', '<-------[Contabil]'],
    ['  [Client]------->', '', '[UC2] Incarcare document (scan/poza)', '', ''],
    ['  [Client]------->', '', '[UC3] Vizualizare documente proprii', '', ''],
    ['  [Client]------->', '', '[UC4] Vizualizare notificari', '', '<-------[Contabil]'],
    ['  [Client]------->', '', '[UC5] Editare profil / Setari', '', '<-------[Contabil]'],
    ['', '', '[UC6] Vizualizare coada documente', '', '<-------[Contabil]'],
    ['', '', '[UC7] Verificare rezultate OCR + AI', '', '<-------[Contabil]'],
    ['', '', '[UC8] Aprobare document', '', '<-------[Contabil]'],
    ['', '', '[UC9] Respingere document (cu motiv)', '', '<-------[Contabil]'],
    ['', '', '[UC10] Corectare campuri extrase', '', '<-------[Contabil]'],
    ['', '', '[UC11] Escaladare la manager', '', '<-------[Contabil]'],
    ['  [Client]------->', '', '[UC12] Vizualizare rapoarte', '', '<-------[Contabil]'],
    ['', '', '[UC13] Generare raport contabil', '', '<-------[Contabil]'],
    ['', '', '[UC14] Gestionare clienti', '', '<-------[Contabil]'],
    ['', '', '', '', ''],
    ['', '', '--- SERVICIUL AI (automat) ---', '', ''],
    ['', '', '[AI1] Procesare OCR (PaddleOCR)', '', ''],
    ['', '', '[AI2] Clasificare document (BERT)', '', ''],
    ['', '', '[AI3] Extractie entitati (NER)', '', ''],
    ['', '', '[AI4] Calcul scor urgenta', '', ''],
    ['', '', '[AI5] Detectie duplicate', '', ''],
    ['', '', '[AI6] Recomandari auto-completare', '', ''],
]

colors = []
for i, row in enumerate(rows):
    row_colors = [None] * 5
    if i in (0, 1):
        row_colors = ['D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8']
    elif i in (3, 4):
        row_colors = ['D5F5E3', None, 'FCF3CF', None, 'FADBD8']
    elif 6 <= i <= 19:
        row_colors[0] = 'D5F5E3' if '------->' in row[0] else None
        row_colors[2] = 'FCF3CF'
        row_colors[4] = 'FADBD8' if '<-------' in row[4] else None
    elif 22 <= i <= 27:
        row_colors[2] = 'E8DAEF'
    colors.append(row_colors)

add_colored_table(doc, rows, colors)

doc.add_paragraph()
doc.add_heading('Explicatie detaliata:', level=3)

explanations_uc1 = [
    ('UC1 - Inregistrare / Autentificare',
     'Ambii actori se autentifica prin acelasi mecanism JWT. Clientul se inregistreaza singur '
     '(rol CLIENT implicit). Contabilul primeste cont creat de administrator. '
     'Autentificarea functioneaza identic pe web si pe mobil - acelasi endpoint /api/auth/login '
     'returneaza access_token (15 min) si refresh_token (7 zile). '
     'Aplicatia web stocheaza tokenurile in localStorage, aplicatia mobila in SecureStore (Expo).'),

    ('UC2 - Incarcare document',
     'Clientul incarca documente scanate sau fotografiate (PNG, JPG, PDF, TIFF) '
     'prin POST /api/documents/upload. Fisierul este salvat pe disc cu hash SHA-256 ca nume. '
     'Imediat dupa incarcare, Backend-ul lanseaza un task Celery care trimite documentul '
     'catre Serviciul AI pentru procesare automata (OCR + clasificare + extractie).'),

    ('UC6-UC11 - Fluxul contabilului',
     'Contabilul vede coada de documente sortata dupa urgenta (GET /api/documents/queue). '
     'Pentru fiecare document poate: vizualiza rezultatele OCR cu overlay pe imagine (bounding boxes colorate '
     'pe baza confidence-ului), verifica si corecta campurile extrase (CUI, data, sume), '
     'aproba documentul (status -> APROBAT) sau respinge cu motiv. '
     'Fiecare corectie genereaza automat un exemplu de antrenare pentru modelul AI.'),

    ('AI1-AI6 - Procesare automata',
     'Serviciul AI (LLM) functioneaza 100% local, fara API-uri externe. '
     'Pipeline-ul proceseaza documentul in 6 pasi: '
     '(1) OCR cu PaddleOCR - extrage textul cu confidence per cuvant, '
     '(2) Clasificare cu BERT multilingual - determina tipul documentului, '
     '(3) NER cu BERT - extrage entitati (CUI, date, sume, IBAN), '
     '(4) Scoring urgenta - reguli + ML hybrid, '
     '(5) Detectie duplicate - hash SHA-256 + similaritate FAISS, '
     '(6) Recomandari - documente similare procesate anterior.'),
]

for title, text in explanations_uc1:
    p = doc.add_paragraph()
    run = p.add_run(title + ': ')
    run.bold = True
    p.add_run(text)

doc.add_page_break()

# =====================================================
# DIAGRAMA 2: USE CASE - Admin si Antrenare AI
# =====================================================
doc.add_heading('2. Diagrama Use Case nr. 2', level=1)
doc.add_heading('Administrarea si Antrenarea Modelului AI', level=2)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Descriere: ')
run.bold = True
p.add_run(
    'Aceasta diagrama se focalizeaza pe administrarea sistemului si procesul de antrenare '
    'a modelului AI. Administratorul gestioneaza utilizatorii, monitorizeaza sistemul si '
    'lanseaza antrenarea. Contabilul contribuie indirect la antrenare prin corectiile pe care '
    'le face pe documente. Modelul AI invata continuu din aceste corectii.'
)

doc.add_paragraph()

rows2 = [
    ['', '', 'ANTRENARE & ADMINISTRARE AI', '', ''],
    ['', '', '', '', ''],
    ['ACTOR: CONTABIL', '', 'USE CASES', '', 'ACTOR: ADMIN'],
    ['(contribuie la antrenare)', '', '', '', '(gestioneaza sistemul)'],
    ['', '', '', '', ''],
    ['  [Contabil]----->', '', '[UC1] Revizuire document OCR', '', '<-----[Admin]'],
    ['  [Contabil]----->', '', '[UC2] Corectare clasificare gresita', '', ''],
    ['  [Contabil]----->', '', '[UC3] Corectare campuri extrase', '', ''],
    ['  [Contabil]----->', '', '[UC4] Confirmare document corect', '', ''],
    ['  [Contabil]----->', '', '[UC5] Feedback urgenta (prea mare/mica)', '', ''],
    ['  [Contabil]----->', '', '[UC6] Vizualizare statistici antrenare', '', '<-----[Admin]'],
    ['', '', '', '', ''],
    ['', '', '--- ADMIN: GESTIONARE ---', '', ''],
    ['', '', '[UC7] Vizualizare dashboard antrenare', '', '<-----[Admin]'],
    ['', '', '[UC8] Lansare antrenare model', '', '<-----[Admin]'],
    ['', '', '[UC9] Vizualizare versiuni modele', '', '<-----[Admin]'],
    ['', '', '[UC10] Activare/Rollback versiune model', '', '<-----[Admin]'],
    ['', '', '[UC11] Vizualizare audit log', '', '<-----[Admin]'],
    ['', '', '[UC12] Verificare integritate audit', '', '<-----[Admin]'],
    ['', '', '[UC13] Monitorizare sanatate sistem', '', '<-----[Admin]'],
    ['', '', '[UC14] Gestionare utilizatori', '', '<-----[Admin]'],
    ['', '', '', '', ''],
    ['', '', '--- PIPELINE ANTRENARE (automat) ---', '', ''],
    ['', '', '[T1] Acumulare corectii (min 50)', '', ''],
    ['', '', '[T2] Pregatire dataset (80/20 split)', '', ''],
    ['', '', '[T3] Fine-tune BERT (PyTorch+HuggingFace)', '', ''],
    ['', '', '[T4] Evaluare pe set de validare', '', ''],
    ['', '', '[T5] Promovare daca acuratete > model vechi', '', ''],
    ['', '', '[T6] Curatare versiuni vechi (pastreaza 5)', '', ''],
]

colors2 = []
for i, row in enumerate(rows2):
    row_colors = [None] * 5
    if i == 0:
        row_colors = ['D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8']
    elif i in (2, 3):
        row_colors = ['FADBD8', None, 'FCF3CF', None, 'D5F5E3']
    elif 5 <= i <= 10:
        row_colors[0] = 'FADBD8' if '----->' in row[0] else None
        row_colors[2] = 'FCF3CF'
        row_colors[4] = 'D5F5E3' if '<-----' in row[4] else None
    elif 13 <= i <= 20:
        row_colors[2] = 'FCF3CF'
        row_colors[4] = 'D5F5E3' if '<-----' in row[4] else None
    elif 23 <= i <= 28:
        row_colors[2] = 'E8DAEF'
    colors2.append(row_colors)

add_colored_table(doc, rows2, colors2)

doc.add_paragraph()
doc.add_heading('Explicatie detaliata:', level=3)

explanations_uc2 = [
    ('UC1-UC5 - Contributia contabilului la antrenare',
     'Fiecare actiune a contabilului pe un document genereaza date de antrenare: '
     'corectarea tipului documentului (UC2) inregistreaza ca "clasificarea a fost gresita", '
     'corectarea campurilor (UC3) salveaza valoarea originala si cea corecta, '
     'confirmarea (UC4) creeaza un exemplu pozitiv ("AI-ul a facut totul corect"), '
     'feedback-ul de urgenta (UC5) ajusteaza scorul. Toate se salveaza in tabela training_examples.'),

    ('UC7-UC10 - Managementul modelelor AI',
     'Administratorul vede in dashboard: cate corectii s-au acumulat, '
     'cate sunt necesare (minim 50), ce modele sunt active, cu ce acuratete. '
     'Cand sunt suficiente corectii, lanseaza antrenarea (POST /api/training/trigger). '
     'Dupa antrenare, poate activa manual o versiune sau face rollback. '
     'Sistemul pastreaza ultimele 5 versiuni pentru siguranta.'),

    ('T1-T6 - Pipeline-ul de antrenare',
     'Procesul este complet automat dupa lansare: '
     '(T1) Se colecteaza toate corectiile nefolosite din DB, '
     '(T2) Se pregateste dataset-ul cu split 80% antrenare / 20% validare, '
     '(T3) Se face fine-tuning pe BERT multilingual cu PyTorch si HuggingFace Trainer '
     '(learning_rate=2e-5, epochs=10, batch_size=16), '
     '(T4) Se evalueaza pe setul de validare (accuracy + F1), '
     '(T5) Daca modelul nou e mai bun decat cel activ -> se promoveaza automat, '
     '(T6) Versiunile vechi se sterg (se pastreaza doar ultimele 5).'),

    ('UC11-UC13 - Securitate si monitorizare',
     'Audit log-ul (UC11) inregistreaza fiecare actiune in sistem cu hash chain '
     '(blockchain-style) - orice modificare a unui log vechi e detectabila. '
     'Verificarea integritatii (UC12) parcurge tot lantul de hash-uri. '
     'Monitorizarea (UC13) verifica: conexiunea la PostgreSQL, Redis, '
     'starea engine-ului OCR, modelele AI incarcate, numarul de Celery workers activi.'),
]

for title, text in explanations_uc2:
    p = doc.add_paragraph()
    run = p.add_run(title + ': ')
    run.bold = True
    p.add_run(text)

doc.add_page_break()

# =====================================================
# DIAGRAMA 3: ACTIVITATI - Procesare Document
# =====================================================
doc.add_heading('3. Diagrama de Activitati', level=1)
doc.add_heading('Procesarea unui Document prin Pipeline-ul AI', level=2)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Descriere: ')
run.bold = True
p.add_run(
    'Aceasta diagrama prezinta fluxul complet de activitati de la incarcarea unui document '
    'de catre client pana la aprobarea sau respingerea lui de catre contabil. '
    'Se evidentiaza cele 3 benzi (swimlanes): Clientul, Backend-ul si Serviciul AI (LLM). '
    'Fiecare activitate este o etapa din pipeline-ul de procesare.'
)

doc.add_paragraph()

rows3 = [
    ['CLIENT (Web/Mobile)', 'BACKEND API (Port 3777)', 'SERVICIU AI + LLM (Port 3778)'],
    ['', '', ''],
    ['(START)', '', ''],
    ['Selecteaza fisier', '', ''],
    ['(scan sau poza telefon)', '', ''],
    ['      |', '', ''],
    ['      v', '', ''],
    ['Incarca document ------>', 'Primeste fisierul', ''],
    ['', 'Salveaza pe disc (SHA-256)', ''],
    ['', 'Creeaza Document in DB', ''],
    ['', 'Status = INCARCAT', ''],
    ['', '      |', ''],
    ['', 'Lanseaza task Celery ---->', 'Primeste task din Redis'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[1] PREPROCESSING OpenCV'],
    ['', '', '  - Grayscale'],
    ['', '', '  - Deskew (corectie rotatie)'],
    ['', '', '  - Denoise + CLAHE'],
    ['', '', '  - Binarizare Otsu'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[2] OCR (PaddleOCR)'],
    ['', '', '  - Extrage text + bounding boxes'],
    ['', '', '  - Calculeaza confidence/cuvant'],
    ['', '', '  - Flaggeaza cuvinte <85%'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[3] CLASIFICARE (BERT/keywords)'],
    ['', '', '  - Determina tip document'],
    ['', '', '  - (factura/chitanta/contract/...)'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[4] EXTRACTIE NER (BERT/regex)'],
    ['', '', '  - CUI, data, sume, IBAN'],
    ['', '', '  - Confidence per camp'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[5] URGENCY SCORING'],
    ['', '', '  - Reguli (60%) + ML (40%)'],
    ['', '', '  - Scor 0-100'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '[6] DETECTIE DUPLICATE'],
    ['', '', '  - Hash exact (SHA-256)'],
    ['', '', '  - Similaritate FAISS'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', '< DECIZIE >'],
    ['', '', 'Confidence > 92% ?'],
    ['', '', 'Fara flagged fields ?'],
    ['', '', '  |            |'],
    ['', '', '  DA           NU'],
    ['', '', '  |            |'],
    ['', '', '  v            v'],
    ['', '', 'PENDING     REQUIRES'],
    ['', '', 'APPROVAL    MANUAL'],
    ['', '', '      |'],
    ['', '', '      v'],
    ['', '', 'Cripteaza date (AES-256)'],
    ['', '', 'Salveaza in DB'],
    ['', '', 'Notifica WebSocket ---->', ''],
    ['', '', ''],
    ['CONTABIL (Web)', '', ''],
    ['Vede document in coada', '', ''],
    ['Vizualizeaza OCR overlay', '', ''],
    ['      |', '', ''],
    ['      v', '', ''],
    ['< DECIZIE CONTABIL >', '', ''],
    ['  |        |       |', '', ''],
    [' APROBA  CORECTEAZA RESPINGE', '', ''],
    ['  |        |       |', '', ''],
    ['  v        v       v', '', ''],
    ['Status:  Salveaza  Status:', '', ''],
    ['APROBAT  training  RESPINS', '', ''],
    ['         example', '', ''],
    ['', '', ''],
    ['(END)', '', ''],
]

colors3 = []
for i, row in enumerate(rows3):
    row_colors = [None, None, None]
    if i == 0:
        row_colors = ['D5F5E3', 'D6EAF8', 'E8DAEF']
    elif 3 <= i <= 7 or 61 <= i <= 74:
        row_colors[0] = 'D5F5E3'
    elif 7 <= i <= 12:
        row_colors[1] = 'D6EAF8'
    elif 12 <= i <= 59:
        row_colors[2] = 'E8DAEF'
    if i == 48:
        row_colors[2] = 'FCF3CF'
    colors3.append(row_colors)

add_colored_table(doc, rows3, colors3)

doc.add_paragraph()
doc.add_heading('Explicatie detaliata:', level=3)

activity_explanations = [
    ('Banda CLIENT (verde)',
     'Clientul interactioneaza cu sistemul prin aplicatia web sau mobila. '
     'Incarca un document scanat sau fotografiat. Dupa procesare, primeste '
     'notificare (push pe mobil, WebSocket pe web). Nu are acces la procesarea AI - '
     'doar vede rezultatul final. Contabilul are acces la vizualizarea completa a '
     'rezultatelor OCR cu overlay pe imagine.'),

    ('Banda BACKEND (albastru)',
     'Backend-ul (FastAPI pe portul 3777) primeste fisierul, il salveaza pe disc '
     'cu nume bazat pe hash SHA-256 (previne duplicate la nivel de fisier), '
     'creeaza inregistrarea Document in PostgreSQL cu status INCARCAT, '
     'apoi lanseaza un task Celery asincron. Nu asteapta procesarea - '
     'raspunde imediat clientului cu ID-ul documentului si ID-ul task-ului.'),

    ('Banda SERVICIU AI (violet)',
     'Pipeline-ul complet ruleaza in Celery worker. Cele 6 etape se executa secvential: '
     'Preprocessing OpenCV pregateste imaginea (deskew, denoise, binarizare), '
     'PaddleOCR extrage textul cu pozitii si confidence, '
     'BERT clasifica tipul documentului, NER extrage entitatile, '
     'sistemul de scoring calculeaza urgenta, detectia de duplicate verifica '
     'daca documentul exista deja. La final, decizia automata: daca confidence > 92% '
     'si fara campuri flagged -> status PENDING_APPROVAL, altfel REQUIRES_MANUAL.'),

    ('Decizia contabilului',
     'Contabilul vede documentele in coada sortata dupa urgenta. '
     'Are 3 optiuni: APROBA (marcheaza ca procesat corect), '
     'CORECTEAZA (modifica campuri gresite - genereaza training example automat), '
     'RESPINGE (cu motiv - documentul e invalid). '
     'Fiecare corectie ajuta modelul AI sa invete si sa fie mai precis in viitor.'),
]

for title, text in activity_explanations:
    p = doc.add_paragraph()
    run = p.add_run(title + ': ')
    run.bold = True
    p.add_run(text)

doc.add_page_break()

# =====================================================
# DIAGRAMA 4: SECVENTA - Mersul Sistemului
# =====================================================
doc.add_heading('4. Diagrama de Secventa', level=1)
doc.add_heading('Mersul Sistemului - Fluxul Complet de Comunicare', level=2)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Descriere: ')
run.bold = True
p.add_run(
    'Aceasta diagrama prezinta ordinea temporala a mesajelor intre toate componentele '
    'sistemului: aplicatia web, aplicatia mobila, backend-ul API, serviciul AI, '
    'baza de date PostgreSQL, Redis (message broker) si Celery worker. '
    'Se evidentiaza comunicarea asincrona prin Celery si notificarile in timp real prin WebSocket.'
)

doc.add_paragraph()

rows4 = [
    ['Nr.', 'DE LA', 'CATRE', 'MESAJ / ACTIUNE', 'PROTOCOL'],
    ['', '', '', '', ''],
    ['', '--- FAZA 1: AUTENTIFICARE ---', '', '', ''],
    ['1', 'App Web/Mobile', 'Backend :3777', 'POST /api/auth/login {username, password}', 'HTTPS'],
    ['2', 'Backend', 'PostgreSQL', 'SELECT * FROM users WHERE username=?', 'SQL'],
    ['3', 'Backend', 'Backend', 'verify_password() + create_jwt()', 'intern'],
    ['4', 'Backend', 'App Web/Mobile', '{access_token, refresh_token}', 'HTTPS'],
    ['5', 'App Web', 'localStorage', 'Salveaza tokens', 'JS API'],
    ['5b', 'App Mobile', 'SecureStore', 'Salveaza tokens (Expo)', 'Native'],
    ['', '', '', '', ''],
    ['', '--- FAZA 2: INCARCARE DOCUMENT ---', '', '', ''],
    ['6', 'App Web/Mobile', 'Backend :3777', 'POST /api/documents/upload (multipart)', 'HTTPS+JWT'],
    ['7', 'Backend', 'Disc', 'Salveaza fisier (hash SHA-256)', 'I/O'],
    ['8', 'Backend', 'PostgreSQL', 'INSERT documents (status=INCARCAT)', 'SQL'],
    ['9', 'Backend', 'Redis :6379', 'Celery: process_document.delay(doc_id)', 'AMQP'],
    ['10', 'Backend', 'App Web/Mobile', '{document_id, task_id, status: "processing"}', 'HTTPS'],
    ['', '', '', '', ''],
    ['', '--- FAZA 3: PROCESARE AI (asincrona) ---', '', '', ''],
    ['11', 'Redis', 'Celery Worker', 'Preia task din coada', 'AMQP'],
    ['12', 'Celery', 'OCR Processor', 'Preprocessing OpenCV + PaddleOCR', 'intern'],
    ['13', 'Celery', 'Classifier', 'classify(ocr_text) -> (tip, confidence)', 'intern'],
    ['14', 'Celery', 'NER Extractor', 'extract(ocr_text) -> {entitati}', 'intern'],
    ['15', 'Celery', 'Urgency Scorer', 'score(tip, suma, conf) -> scor 0-100', 'intern'],
    ['16', 'Celery', 'FAISS Index', 'Detectie duplicate + similare', 'intern'],
    ['17', 'Celery', 'AES-256-GCM', 'Cripteaza text OCR + entitati', 'intern'],
    ['18', 'Celery', 'PostgreSQL', 'UPDATE documents, INSERT extracted_fields', 'SQL'],
    ['19', 'Celery', 'Redis pub/sub', 'PUBLISH document:{id} {status, result}', 'Redis'],
    ['', '', '', '', ''],
    ['', '--- FAZA 4: NOTIFICARE REAL-TIME ---', '', '', ''],
    ['20', 'Redis pub/sub', 'AI Service :3778', 'Primeste mesaj pe canal', 'Redis'],
    ['21', 'AI Service', 'App Web (WS)', 'WebSocket: {event: "processing_complete"}', 'WS'],
    ['22', 'App Web', 'Utilizator', 'Afiseaza: "Document procesat!"', 'UI'],
    ['', '', '', '', ''],
    ['', '--- FAZA 5: REVIZIE CONTABIL ---', '', '', ''],
    ['23', 'Contabil (Web)', 'Backend :3777', 'GET /api/training/documents/{id}/ocr', 'HTTPS+JWT'],
    ['24', 'Backend', 'PostgreSQL', 'SELECT document + extracted_fields', 'SQL'],
    ['25', 'Backend', 'Contabil (Web)', '{ocr_blocks, entities, confidence, image_path}', 'HTTPS'],
    ['26', 'Contabil (Web)', 'Contabil', 'Vede overlay OCR + campuri extrase', 'UI'],
    ['', '', '', '', ''],
    ['', '--- FAZA 6: CORECTIE SAU APROBARE ---', '', '', ''],
    ['27a', 'Contabil', 'Backend :3777', 'POST /training/.../correct {fields, type}', 'HTTPS+JWT'],
    ['27b', 'Contabil', 'Backend :3777', 'POST /training/.../confirm', 'HTTPS+JWT'],
    ['28', 'Backend', 'PostgreSQL', 'UPDATE extracted_fields + INSERT training_example', 'SQL'],
    ['29', 'Backend', 'PostgreSQL', 'INSERT audit_log (hash chain)', 'SQL'],
    ['30', 'Backend', 'Contabil (Web)', '{status: "corrected", training_example_id}', 'HTTPS'],
    ['', '', '', '', ''],
    ['', '--- FAZA 7: ANTRENARE MODEL (cand sunt 50+ corectii) ---', '', '', ''],
    ['31', 'Admin (Web)', 'AI Service :3778', 'POST /api/v1/training/trigger', 'HTTPS+JWT'],
    ['32', 'AI Service', 'Redis', 'Celery: train_classifier.delay()', 'AMQP'],
    ['33', 'Celery', 'PostgreSQL', 'SELECT training_examples (unused)', 'SQL'],
    ['34', 'Celery', 'PyTorch+BERT', 'Fine-tune model (epochs=10)', 'intern'],
    ['35', 'Celery', 'Disc', 'Salveaza model nou in model_storage/', 'I/O'],
    ['36', 'Celery', 'PostgreSQL', 'INSERT model_versions + UPDATE is_active', 'SQL'],
    ['37', 'Celery', 'Admin (Web)', '{status: "trained", accuracy: 94.2%}', 'WS/poll'],
]

colors4 = []
for i, row in enumerate(rows4):
    row_colors = [None, None, None, None, None]
    if i == 0:
        row_colors = ['D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8', 'D6EAF8']
    elif row[0] == '' and '---' in row[1]:
        row_colors = ['FCF3CF', 'FCF3CF', 'FCF3CF', 'FCF3CF', 'FCF3CF']
    colors4.append(row_colors)

add_colored_table(doc, rows4, colors4)

doc.add_paragraph()
doc.add_heading('Explicatie detaliata:', level=3)

seq_explanations = [
    ('Faza 1 - Autentificare',
     'Utilizatorul (web sau mobil) trimite credentialele catre Backend. '
     'Backend-ul verifica parola cu bcrypt, genereaza 2 tokene JWT (access + refresh) '
     'si le returneaza. Aplicatia web le salveaza in localStorage, aplicatia mobila '
     'in Expo SecureStore (criptat nativ). Fiecare cerere ulterioara include '
     'header-ul Authorization: Bearer {token}.'),

    ('Faza 2 - Incarcare document',
     'Documentul e trimis ca multipart/form-data. Backend-ul il salveaza pe disc, '
     'creeaza inregistrarea in DB, si lanseaza un task Celery ASINCRON. '
     'Nu asteapta procesarea AI - returneaza imediat {document_id, task_id}. '
     'Clientul poate urmari progresul prin WebSocket.'),

    ('Faza 3 - Procesare AI asincrona',
     'Celery worker preia task-ul din Redis si ruleaza pipeline-ul AI complet. '
     'Procesoarele (OCR, Classifier, NER, Urgency, Duplicate) sunt singleton-uri '
     'incarcate o singura data la startup (model.eval() + torch.no_grad()). '
     'Rezultatele sunt criptate cu AES-256-GCM inainte de salvare in DB. '
     'La final, publica eveniment pe Redis pub/sub.'),

    ('Faza 4 - Notificare real-time',
     'AI Service asculta pe Redis pub/sub si retransmite prin WebSocket. '
     'Clientii conectati pe /ws/documents/{id} primesc instant statusul. '
     'Coada /ws/queue se actualizeaza automat cand un document e procesat. '
     'Aceasta permite interfetei web sa afiseze progresul fara polling.'),

    ('Faza 5-6 - Revizia contabilului',
     'Contabilul solicita datele OCR complete: text extras, bounding boxes cu confidence, '
     'campuri extrase, clasificare, scor urgenta. Interfata web afiseaza overlay-ul colorat '
     '(verde >90%, galben 75-90%, rosu <75%). Contabilul corecteaza sau confirma. '
     'Fiecare corectie se salveaza si in audit log (hash chain tamper-evident).'),

    ('Faza 7 - Antrenare model',
     'Cand sunt 50+ corectii acumulate, administratorul lanseaza antrenarea. '
     'Task-ul Celery incarca datele, face fine-tuning pe BERT multilingual '
     'cu PyTorch si HuggingFace Trainer, evalueaza pe 20% date de validare, '
     'si daca acuratetea e mai buna -> promoveaza modelul nou automat. '
     'Procesul dureaza 5-10 minute si se ruleaza in background.'),
]

for title, text in seq_explanations:
    p = doc.add_paragraph()
    run = p.add_run(title + ': ')
    run.bold = True
    p.add_run(text)

# =====================================================
# SALVARE
# =====================================================
output_path = os.path.join(os.path.dirname(__file__), 'Diagrame-UML-AI-Contabil.docx')
doc.save(output_path)
print(f"Document salvat: {output_path}")

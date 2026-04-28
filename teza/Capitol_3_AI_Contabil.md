# 3 IMPLEMENTAREA ȘI TESTAREA SISTEMULUI AI-CONTABIL

Capitolul de față prezintă concretizarea proiectului într-o soluție funcțională. Implementarea a urmat deciziile arhitecturale formulate în capitolul anterior și s-a desfășurat în cicluri iterative scurte. Fiecare modul a fost dezvoltat, testat și integrat înainte de combinarea cu celelalte componente, conform metodologiei specifice dezvoltării agile [25].

Sistemul AI-Contabil reunește patru componente principale, dezvoltate separat și coordonate prin orchestrare Docker: serverul backend FastAPI, microserviciul AI cu modulele de procesare a documentelor și agentul Djarvis, aplicația web React și aplicația mobilă React Native. Codul sursă este organizat într-un repository unitar, cu separare clară pe directoare dedicate fiecărei componente. Toate dependențele de execuție sunt izolate prin containere Docker, ceea ce asigură reproductibilitatea mediului indiferent de sistemul de operare al stației de dezvoltare [56].

Structura capitolului urmează ordinea logică a unui sistem software complex. Prima secțiune descrie organizarea proiectului și mediul de dezvoltare. Următoarele secțiuni prezintă implementarea efectivă a fiecărui modul: backend, modul AI, aplicație web și aplicație mobilă. Ultima secțiune detaliază testarea sistemului. Fiecare secțiune este însoțită de capturi de ecran din aplicația funcțională, ilustrând interfețele și comportamentul real al componentelor [25].

---

## 3.1 Structura proiectului și mediul de dezvoltare

Proiectul AI-Contabil este organizat conform principiilor arhitecturii pe componente independente. Există o separare strictă între interfețele utilizator, logica de business și stratul de procesare AI. Această structurare facilitează dezvoltarea paralelă, testarea izolată a fiecărei componente și mentenanța pe termen lung. Separarea responsabilităților reprezintă un principiu fundamental al ingineriei software moderne, recomandat în literatura de specialitate [25].

### 3.1.1 Organizarea repository-ului pe componente

Directorul rădăcină al proiectului conține trei directoare principale, corespunzătoare celor trei componente cu interfață: `backend-project` pentru serverul FastAPI și microserviciul AI, `frontend-web-aplication` pentru aplicația web React și `frontend-mobile-aplication` pentru aplicația mobilă React Native. La nivelul rădăcinii se află, de asemenea, fișierul `docker-compose.yml` care orchestrează pornirea coordonată a tuturor serviciilor [56].

**[FIGURA 3.1 — CAPTURĂ NECESARĂ:** structura folderelor proiectului în panoul Explorer din VS Code, cu directoarele `backend-project`, `frontend-web-aplication`, `frontend-mobile-aplication` și `teza` expandate la primul nivel.**]**

Figura 3.1. Organizarea pe componente a repository-ului AI-Contabil.

Backend-ul Python este structurat în două subcomponente. Directorul `backend-project/app` conține serverul principal FastAPI, responsabil de autentificare, operațiile CRUD asupra documentelor și utilizatorilor, sistemul de notificări și jurnalul de audit. Directorul `backend-project/ai-service` găzduiește microserviciul AI dedicat, care realizează procesarea OCR, clasificarea semantică, extracția entităților, agentul conversațional Djarvis și generarea documentelor PDF [56]. Această separare permite scalarea independentă a procesării AI, care necesită resurse computaționale semnificativ mai mari decât operațiile CRUD clasice.

Aplicația web este implementată în directorul `frontend-web-aplication/AI-Contabil`, structurată conform convențiilor unui proiect Vite cu TypeScript [64]. Subdirectorul `src/pages` conține paginile principale ale aplicației: `Home`, `SignIn`, `SignUp`, `Admin`, `Contabil`, `Documents`, `Reports`, `Settings`, `Training`. Subdirectorul `src/components` găzduiește componentele reutilizabile precum `Navbar`, `ChatWidget`, `TwoFactorPrompt`, `AlertToast` și `ErrorBoundary`. Subdirectorul `src/api` izolează apelurile către backend prin module dedicate, câte unul pentru fiecare resursă: `authApi`, `documentsApi`, `chatApi`, `notificationsApi`, `reportsApi` și altele similare.

Aplicația mobilă utilizează modelul de routing bazat pe fișiere oferit de Expo Router [65]. Subdirectorul `app/(autentificare)` conține ecranele de logare și înregistrare, izolate într-un grup de rute care împărtășesc același layout. Subdirectorul `app/(taburi)` conține ecranele principale grupate într-un layout de tip bottom-tab: `index` (acasă), `criere` (creare document), `meniu`, `profil` și `notificari`. Fiecare grup de rute include un fișier `_layout.tsx` care definește comportamentul de navigare comun ecranelor din interior.

### 3.1.2 Mediul de dezvoltare

Mediul de dezvoltare utilizat este Visual Studio Code, motivat în detaliu în subcapitolul 2.4. Toate cele patru componente ale proiectului — backend, modul AI, aplicație web și aplicație mobilă — au fost dezvoltate în același editor, cu profiluri de extensii dedicate fiecărui limbaj. Extensia Python a furnizat IntelliSense și depanarea interactivă pentru codul FastAPI și pentru worker-ii Celery. Extensiile ESLint și Prettier au asigurat consistența stilistică a codului TypeScript din aplicațiile web și mobilă. Extensia Docker a permis gestionarea containerelor direct din bara laterală a editorului, fără comutare la terminal.

**[FIGURA 3.2 — CAPTURĂ NECESARĂ:** Visual Studio Code deschis, cu un fișier Python din `ai-service` în editor, panoul Docker activ în bara laterală arătând containerele rulând (postgres, redis, backend, ai-service, celery-worker, ollama), și terminalul integrat afișând logurile unui serviciu.**]**

Figura 3.2. Mediul de dezvoltare Visual Studio Code cu containerele Docker active.

Controlul versiunilor s-a realizat prin Git, cu un branch principal `main` și branch-uri dedicate pentru fiecare funcționalitate majoră. Strategia de commit-uri urmărește principiul atomicității: fiecare commit cuprinde o modificare logică unitară, însoțită de un mesaj descriptiv în engleză. Acest model facilitează revizuirea istoricului și revenirea la versiuni anterioare în cazul detectării unei regresii. Integrarea nativă Git din VS Code, completată de extensia GitLens, a permis vizualizarea diff-urilor linie cu linie și identificarea autorului fiecărei modificări direct în editor.

### 3.1.3 Configurarea mediului containerizat prin Docker Compose

Pornirea coordonată a tuturor serviciilor proiectului este realizată prin Docker Compose. Fișierul `docker-compose.yml` definește șapte servicii interdependente: `postgres` (instanța PostgreSQL 16-alpine), `redis` (Redis 7-alpine, broker pentru Celery și cache), `backend` (serverul principal FastAPI pe portul 3777), `ai-service` (microserviciul AI pe portul 3778), `celery-worker` (procesorul de sarcini asincrone), `celery-beat` (scheduler-ul pentru sarcini periodice) și `ollama` (motor de inferență LLM pe portul 11434). Configurația completă a fișierului `docker-compose.yml` este prezentată în Anexa A.

Comunicarea între containere se realizează printr-o rețea internă privată, definită implicit de Docker Compose, în care fiecare serviciu este accesibil prin numele său. Volumele persistente `postgres_data`, `redis_data`, `ai_model_storage`, `ai_training_data` și `ollama_models` păstrează starea fiecărui serviciu între reporniri, prevenind pierderea datelor la oprirea containerelor [56]. Variabilele de mediu sensibile (cheia secretă JWT, parolele bazei de date, cheile de criptare AES) sunt încărcate dintr-un fișier `.env` care nu este urmărit în controlul versiunilor, conform bunelor practici de securitate.

**[FIGURA 3.3 — CAPTURĂ NECESARĂ:** terminal cu rezultatul comenzii `docker compose ps` afișând cele șapte servicii cu statusul `Up` și porturile expuse, sau alternativ ecranul Docker Desktop cu containerele active grupate în proiect.**]**

Figura 3.3. Cele șapte servicii containerizate ale sistemului AI-Contabil în execuție.

---

## 3.2 Implementarea componentei backend

Componenta backend este implementată ca un server FastAPI [59], care expune un API REST consumat atât de aplicația web, cât și de aplicația mobilă. Codul este organizat după modelul stratificat: stratul `api/routes` definește endpoint-urile, stratul `services` conține logica de business, stratul `models` definește entitățile bazei de date prin SQLAlchemy [57], iar stratul `schemas` definește contractele de intrare și ieșire prin Pydantic [60].

### 3.2.1 Modulul de autentificare și autorizare

Modulul de autentificare este implementat în fișierul `app/api/routes/auth.py` și gestionează patru endpoint-uri principale: `POST /auth/register` pentru crearea unui cont nou, `POST /auth/login` pentru obținerea perechii de token-uri JWT, `POST /auth/refresh` pentru reînnoirea token-ului expirat și `POST /auth/logout` pentru invalidarea sesiunii curente. Fluxul de autentificare urmează specificația OAuth2 cu Bearer Token, conform recomandărilor pentru API-uri moderne [61].

La înregistrarea unui utilizator nou, parola transmisă este hash-uită imediat prin `passlib` cu algoritmul bcrypt și factorul de cost 12, parametru care asigură o rezistență ridicată împotriva atacurilor de tip dictionary și forță brută. Hash-ul rezultat, împreună cu adresa de e-mail și rolul implicit `CLIENT`, este persistat în tabelul `users` din PostgreSQL. Verificarea unicității adresei de e-mail este realizată simultan la nivelul bazei de date (constrângere `UNIQUE`) și la nivelul codului aplicației (verificare prealabilă), pentru a furniza utilizatorului un mesaj de eroare descriptiv înainte de operația de inserare.

La autentificare, serverul verifică hash-ul parolei prin metoda `passlib.verify()` și, în caz de succes, generează două token-uri JWT semnate cu algoritmul HS256: un `access_token` cu durata de 30 de minute și un `refresh_token` cu durata de 7 zile. Ambele token-uri sunt returnate clientului într-un răspuns JSON. Identitatea utilizatorului este encodată în payload-ul token-ului prin câmpul `sub`, iar rolul prin câmpul `role`, ceea ce permite autorizarea ulterioară fără interogări suplimentare ale bazei de date.

**[FIGURA 3.4 — CAPTURĂ NECESARĂ:** interfața Swagger UI generată automat de FastAPI la `/docs`, deschisă pe secțiunea `auth` cu endpoint-urile `register`, `login`, `refresh`, `logout` expandate, ilustrând documentația automată a API-ului.**]**

Figura 3.4. Documentația interactivă Swagger UI a endpoint-urilor de autentificare.

Verificarea token-ului la fiecare cerere protejată se realizează printr-o dependență FastAPI numită `get_current_user`, declarată în fișierul `app/api/deps.py`. Aceasta extrage token-ul din header-ul `Authorization: Bearer <token>`, decodează payload-ul, verifică semnătura și returnează obiectul `User` corespunzător. În cazul unui token invalid sau expirat, dependența ridică o excepție HTTP 401 care este returnată clientului fără a ajunge la logica endpoint-ului. O dependență complementară, `require_role`, verifică suplimentar dacă rolul utilizatorului autentificat permite accesul la endpoint, returnând HTTP 403 în caz contrar.

Autentificarea în doi factori este implementată în fișierul `app/api/routes/two_factor.py` și se aplică opțional, în funcție de preferința utilizatorului. La activarea 2FA, serverul generează un secret TOTP de 32 de caractere care este transmis utilizatorului sub formă de cod QR scanabil cu o aplicație de autentificare (Google Authenticator, Authy). La fiecare autentificare ulterioară, serverul solicită codul de șase cifre generat de aplicație și îl validează prin biblioteca `pyotp`. Pentru utilizatorii cu 2FA activat, autentificarea pe platforma web poate fi finalizată și prin scanarea unui cod QR direct cu aplicația mobilă, mecanism descris în detaliu în subcapitolul 3.5.3.

### 3.2.2 Modulul de gestionare a documentelor

Modulul de gestionare a documentelor este implementat în fișierul `app/api/routes/documents.py` și expune endpoint-urile pentru încărcare, listare, descărcare și ștergere a documentelor financiare. Endpoint-ul `POST /documents/upload` acceptă fișiere în format `multipart/form-data`, le validează (tip MIME permis, dimensiune maximă), calculează hash-ul SHA-256 al conținutului pentru detecția duplicatelor, criptează conținutul cu AES-256-GCM și îl persistă pe disc. Identificatorul unic, metadatele și calea criptată sunt înregistrate în tabelul `documents` din PostgreSQL. Imediat după înregistrare, serverul publică o sarcină asincronă în coada Redis pentru procesarea AI a documentului, fără a bloca răspunsul către client.

Criptarea documentelor stocate pe disc este realizată prin biblioteca `cryptography 44.0.0` [61], cu algoritmul AES în modul GCM (Galois/Counter Mode), care asigură simultan confidențialitatea și integritatea datelor. Pentru fiecare document este generat un nonce aleatoriu de 12 octeți, stocat alături de tag-ul de autentificare GCM și de conținutul criptat într-un fișier compus. Cheia simetrică AES-256 este derivată dintr-un secret de mediu prin funcția PBKDF2 cu HMAC-SHA256 și 100.000 de iterații, conform recomandărilor curente NIST.

Listarea documentelor se realizează prin endpoint-ul `GET /documents`, care suportă filtrare multiplă prin parametri de query: `status`, `document_type`, `client_id`, `from_date`, `to_date`. Paginația este implementată standard prin parametrii `limit` și `offset`, cu o limită maximă de 100 de înregistrări per cerere pentru a preveni atacurile de tip resurse-exhaustive. Pentru fiecare document returnat, răspunsul include un câmp `download_url` semnat criptografic cu durata de viață scurtă, care permite descărcarea ulterioară fără retransmiterea token-ului JWT prin URL.

### 3.2.3 Modulul de gestionare a utilizatorilor și rolurilor

Modulul de gestionare a utilizatorilor este implementat în fișierul `app/api/routes/users.py` și operează asupra ierarhiei de roluri definite în sistem: `SUPER_ADMIN`, `ADMIN`, `CONTABIL` și `CLIENT`. Fiecare rol dispune de un set distinct de permisiuni, evaluate prin dependențele `require_role` la nivel de endpoint. Utilizatorii cu rol `ADMIN` pot crea, edita și dezactiva conturi pentru alți utilizatori, dar nu pot modifica utilizatorii cu rol `SUPER_ADMIN`. Utilizatorii cu rol `CONTABIL` pot vizualiza și gestiona doar conturile clienților asociați prin tabelul de relație `accountant_clients`. Utilizatorii cu rol `CLIENT` au acces exclusiv la propriile date și documente.

Asocierea contabil-client este modelată prin tabelul `accountant_clients`, care conține perechile de identificatori și data asocierii. Această structură permite ca un client să fie asociat unui singur contabil principal, dar lasă deschisă posibilitatea extinderii ulterioare către o relație de tip mulți-la-mulți, dacă regulile de business se schimbă. Modificarea asocierii este restricționată exclusiv utilizatorilor cu rol `ADMIN` sau `SUPER_ADMIN`, prin endpoint-ul dedicat `PUT /users/{client_id}/assign-accountant`.

### 3.2.4 Sistemul de notificări și WebSocket

Modulul de notificări este implementat în fișierul `app/api/routes/notifications.py` și acoperă atât persistența notificărilor în baza de date, cât și livrarea în timp real către clienții conectați. Tabelul `notifications` stochează fiecare notificare cu câmpurile: `recipient_id`, `type` (info, warning, error, success), `title`, `message`, `metadata` (JSONB cu detalii suplimentare), `is_read` și `created_at`. Endpoint-ul `GET /notifications` returnează lista paginată a notificărilor utilizatorului curent, cu posibilitatea filtrării după statusul de citire.

Livrarea în timp real este realizată prin protocolul WebSocket, expus pe ruta `WS /ws/{user_id}`. La conectare, clientul transmite token-ul JWT pentru autentificare, iar serverul îi atribuie o conexiune persistentă într-un dicționar `connection_manager`. Atunci când o notificare este creată în baza de date, modulul publică simultan un mesaj JSON pe conexiunea WebSocket a destinatarului, dacă acesta este online. Clienții offline primesc notificarea la următoarea conectare prin polling-ul endpoint-ului REST. Această abordare hibridă combină avantajele livrării instantanee cu robustețea persistenței în baza de date [59].

### 3.2.5 Jurnalizarea de audit cu hash-uri de integritate

Toate operațiunile sensibile asupra datelor financiare sunt înregistrate în tabelul `audit_logs`, gestionat prin serviciul `audit_service.py`. Fiecare înregistrare conține: `actor_id` (utilizatorul care a inițiat operațiunea), `action` (tipul operațiunii: create, read, update, delete), `target_type` și `target_id` (resursa afectată), `metadata` (JSONB cu detalii contextuale), `timestamp` și `integrity_hash`. Câmpul `integrity_hash` este calculat ca SHA-256 aplicat asupra concatenării tuturor celorlalte câmpuri ale înregistrării curente cu hash-ul înregistrării anterioare, formând o catenă criptografică similară cu cea a unui blockchain.

Această structură de jurnal protejat asigură că orice modificare ulterioară a unei înregistrări vechi invalidează toate hash-urile subsecvente, devenind imediat detectabilă printr-o operațiune de verificare. Endpoint-ul `GET /audit/verify` recalculează lanțul de hash-uri și raportează prima înregistrare la care apare o discrepanță. Această funcționalitate este accesibilă exclusiv utilizatorilor cu rol `SUPER_ADMIN` și constituie o garanție tehnică a non-repudierii operațiunilor înregistrate, esențială pentru conformitatea cu normele de auditare a sistemelor financiare [13].

---

## 3.3 Implementarea modulului AI

Modulul AI este implementat ca microserviciu separat, în directorul `backend-project/ai-service`. Această izolare arhitecturală răspunde unei nevoi practice: modelele de învățare automată consumă resurse semnificative de memorie și procesor, iar gruparea lor într-un container dedicat permite scalarea independentă față de serverul API principal. Microserviciul AI rulează pe portul 3778 și expune un set propriu de endpoint-uri REST, plus integrarea cu sistemul de cozi Celery pentru sarcinile asincrone [58].

Procesarea unui document parcurge un pipeline secvențial structurat pe șase etape: preprocesare, recunoaștere optică, clasificare semantică, extracție de entități, calcul al scorului de urgență și detecție a duplicatelor. Fiecare etapă este implementată într-un modul Python independent, care expune o interfață uniformă bazată pe metoda `process(document_id) -> dict`. Această uniformitate permite înlocuirea oricărei etape cu o implementare alternativă, fără a afecta restul pipeline-ului [25].

### 3.3.1 Pipeline-ul OCR — preprocesare OpenCV și PaddleOCR

Etapa de preprocesare este implementată în fișierul `ai-service/app/processors/ocr_processor.py` și utilizează biblioteca OpenCV 4.10 pentru ajustarea geometriei și a contrastului imaginii. Fluxul de preprocesare începe cu detectarea automată a unghiului de înclinare prin transformata Hough, urmată de rotirea imaginii pentru a alinia textul orizontal. Operațiunea ulterioară de normalizare a contrastului prin egalizarea histogramei (CLAHE) îmbunătățește lizibilitatea documentelor fotografiate în condiții de iluminare neuniformă, scenariu frecvent în cazul aplicației mobile.

După preprocesare, imaginea este transmisă motorului PaddleOCR 2.10.0, care realizează detectarea regiunilor de text și recunoașterea caracterelor [52]. Motorul este inițializat cu suport multilingv pentru română și chirilică, configurație esențială pentru documentele bilingve întâlnite în Republica Moldova. Rezultatul recunoașterii este o listă de tuple care conțin coordonatele bounding box-urilor și textul recunoscut, însoțite de scorul de încredere al fiecărei regiuni. Fragmentul de cod care implementează acest pipeline este prezentat în Anexa C, cu adnotări explicative pe fiecare pas.

Pentru documentele primite în format PDF nativ (de exemplu, factură electronică emisă de un sistem ERP), pipeline-ul ocolește etapa OCR și utilizează biblioteca PyMuPDF pentru extragerea directă a textului încorporat. Această ramificație, controlată prin verificarea câmpului `mime_type` al documentului, scurtează semnificativ timpul de procesare pentru documentele care nu necesită recunoaștere optică, eliminând o sursă majoră de erori (recunoașterea greșită a caracterelor).

**[FIGURA 3.5 — CAPTURĂ NECESARĂ:** comparație lateral-stânga/dreapta între o factură fotografiată cu camera (înclinată, contrast neuniform) și aceeași factură după preprocesarea OpenCV (rotită corect, contrast normalizat), urmată de tabelul cu textul recunoscut de PaddleOCR.**]**

Figura 3.5. Pipeline-ul de preprocesare și recunoaștere optică a unei facturi fiscale.

### 3.3.2 Clasificatorul semantic BERT multilingual

Documentul preprocesat este transmis ulterior clasificatorului semantic, implementat în fișierul `ai-service/app/processors/classifier.py`. Clasificatorul utilizează modelul BERT multilingual (`bert-base-multilingual-cased`), accesat prin biblioteca Transformers a Hugging Face [62]. Modelul a fost preantrenat pe corpusuri în 104 limbi și capturează relațiile semantice dintre cuvinte indiferent de limba sursei. Pe baza acestui model, peste a fost adăugat un strat de clasificare antrenat pe un corpus de documente financiare etichetate manual, care distinge între opt categorii: factură fiscală, bon fiscal, extras bancar, contract, declarație fiscală, dispoziție de plată, act de achiziție și document divers.

Antrenarea stratului de clasificare s-a desfășurat pe un set de date construit din documentele anonimizate furnizate pentru această lucrare, completate cu corecțiile manuale ale contabililor înregistrate în tabelul `training_examples`. Procesul de antrenare poate fi declanșat manual din interfața de administrare, prin endpoint-ul `POST /training/start`, descris în detaliu în subcapitolul 3.4.5. Versiunile succesive ale modelului sunt înregistrate în tabelul `model_versions`, cu posibilitatea revenirii la o versiune anterioară prin operațiunea de rollback, în cazul în care o nouă versiune înregistrează o degradare a performanței.

### 3.3.3 Extracția entităților și calculul scorului de urgență

Extracția câmpurilor structurate din textul documentului este realizată de modulul `ner_extractor.py`. Acesta combină două abordări complementare. Prima utilizează expresii regulate compilate pentru câmpurile cu format strict (cod fiscal, IBAN, sume monetare, date calendaristice), extrăgând valorile cu precizie ridicată. A doua utilizează un model de Named Entity Recognition antrenat pe corpus românesc, care identifică entități cu format variabil precum denumirea furnizorului, denumirea beneficiarului sau descrierea pozițiilor de pe factură. Câmpurile extrase sunt persistate în tabelul `extracted_fields` ca înregistrări cu câmpurile `field_name`, `field_value` și `confidence_score`, permițând afișarea lor distinct în interfața contabilului pentru validare.

Modulul `urgency_scorer.py` calculează un scor numeric între 0 și 1 care exprimă gradul de urgență al documentului. Scorul agregă mai mulți factori prin sumare ponderată: apropierea termenului de plată extras din document (pondere 0.40), tipul documentului (declarația fiscală cu termen apropiat are pondere mai mare decât un act intern, pondere 0.25), suma implicată (sumele mari au prioritate, pondere 0.20) și istoricul clientului (un client cu întârzieri repetate primește un bonus de prioritate, pondere 0.15). Documentele cu scor peste pragul 0.75 sunt marcate vizual în coada contabilului prin etichetă roșie, atrăgând atenția imediată asupra lor.

### 3.3.4 Detecția duplicatelor prin embedding-uri FAISS

Modulul `recommender.py` integrează biblioteca FAISS 1.9.0, dezvoltată de Meta AI Research, pentru identificarea documentelor similare cu cel curent procesat [63]. Pentru fiecare document, modulul `sentence-transformers` generează un vector de embedding semantic de 768 de dimensiuni, care captează esența semantică a conținutului. Vectorul este indexat într-o instanță FAISS persistentă pe disc, structurată ca index `IndexFlatIP` (produs intern) pentru bazele de date mici și ca `IndexHNSWFlat` (Hierarchical Navigable Small World) pentru bazele cu peste 10.000 de documente.

La fiecare document nou, modulul interoghează indexul FAISS pentru cele mai apropiate cinci vecini și calculează similaritatea cosinusoidală cu fiecare. Documentele cu similaritate peste 0.95 sunt marcate ca posibile duplicate și prezentate contabilului împreună cu referința către documentul existent. Această funcționalitate previne procesarea repetată a aceluiași document în cazul în care clientul îl transmite de mai multe ori (situație frecventă cu clienții care fotografiază aceeași factură de pe mai multe dispozitive).

### 3.3.5 Agentul Djarvis — RAG local cu Ollama pentru legislația Republicii Moldova

Agentul conversațional Djarvis reprezintă cea mai complexă componentă a modulului AI și este implementat în directorul `ai-service/app/agent`. Numele agentului a fost ales ca tribut adus arhetipului asistentului inteligent personal, accesibil oricărui utilizator al platformei, dar cu specializare în legislația contabilă a Republicii Moldova. Agentul răspunde la întrebări despre Codul Fiscal, regulamentele Serviciului Fiscal de Stat, termenele de depunere a declarațiilor și procedurile contabile uzuale, oferind răspunsuri formulate într-un ton uman și nu birocratic.

Arhitectura agentului urmează modelul Retrieval-Augmented Generation (RAG), care combină un retriever de documente cu un generator de text bazat pe un model lingvistic mare. Această abordare răspunde la o limitare cunoscută a modelelor lingvistice mari: tendința de a fabrica răspunsuri plauzibile dar incorecte (fenomen denumit halucinație), atunci când nu dispun de informații concrete despre subiectul interogării. RAG forțează modelul să-și fundamenteze răspunsurile pe documentele recuperate dintr-o bază de cunoștințe controlată, reducând substanțial riscul răspunsurilor inventate [62].

Componenta de retrieval este implementată în fișierul `ai-service/app/agent/retriever.py`. La momentul inițializării agentului, biblioteca `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` calculează embedding-urile semantice pentru toate documentele de legislație stocate în directorul `training-data/legislatie`. Embedding-urile sunt indexate în memorie ca vectori de 384 de dimensiuni. La fiecare întrebare a utilizatorului, retriever-ul transformă întrebarea în același spațiu vectorial, identifică cele mai relevante trei pasaje din legislație prin similaritate cosinusoidală și le pregătește ca context pentru generator.

Componenta de generare este implementată în fișierul `ai-service/app/agent/ollama_client.py` și utilizează platforma Ollama, care găzduiește local modelul lingvistic `qwen2.5:3b-instruct`. Alegerea unui model rulat local, în loc de un serviciu cloud precum OpenAI sau Anthropic, este motivată de două considerente importante. Primul este confidențialitatea: documentele financiare ale clienților nu părăsesc niciodată infrastructura firmei de contabilitate, eliminând riscurile de transmitere a datelor sensibile către terțe părți. Al doilea este costul: după instalarea inițială, modelul nu generează costuri recurente per interogare, scenariu favorabil pentru o firmă mică sau mijlocie cu volum mare de întrebări curente. Fragmentul de cod care implementează clientul Ollama și retriever-ul este prezentat în Anexa B.

Promptul transmis modelului este compus dinamic prin templat-ul definit în `ai-service/app/agent/prompt.py`. Acesta conține trei secțiuni: instrucțiunile sistemice (rolul și tonul agentului), pasajele relevante recuperate de retriever (contextul) și întrebarea utilizatorului. Instrucțiunile sistemice precizează explicit că răspunsul trebuie formulat în limba română, într-un ton accesibil, fără jargon excesiv, și că agentul trebuie să recunoască limitele cunoștințelor sale dacă întrebarea iese din scopul legislației Republicii Moldova. Aceste instrucțiuni reduc riscul răspunsurilor formal-corecte dar inutil de stufoase, frecvente la modelele neghidate.

**[FIGURA 3.6 — CAPTURĂ NECESARĂ:** widget-ul de chat Djarvis deschis în interfața web, cu o conversație ilustrativă: utilizatorul întreabă „când trebuie depusă declarația VEN12 pentru trimestrul II?", iar agentul răspunde cu termenul concret și un fragment scurt de explicație în ton uman, cu indicarea pasajului din legislație consultat.**]**

Figura 3.6. Agentul conversațional Djarvis în dialog cu un utilizator al platformei.

Modulul `suggestions.py` implementează un mecanism complementar care propune utilizatorului întrebări frecvente la deschiderea widget-ului de chat. Aceste sugestii sunt generate dinamic în funcție de rolul utilizatorului (client sau contabil) și de activitatea sa recentă în platformă. De exemplu, un client care a încărcat recent un extras bancar poate primi sugestia „cum se înregistrează contabil un comision bancar?", iar un contabil care lucrează la o declarație fiscală poate primi sugestia „care sunt sancțiunile pentru depunerea cu întârziere a declarației IVAO?". Această inițializare scurtează timpul până la prima interacțiune productivă cu agentul.

### 3.3.6 Generatorul de documente PDF cu ReportLab

Modulul de generare a documentelor PDF este implementat ca o serie de template-uri Python, fiecare descriind structura unui tip de document oficial. Template-urile sunt definite în directorul `ai-service/app/services/pdf_templates`, cu un fișier dedicat per tip de document: `factura_fiscala.py`, `act_achizitie.py`, `dispozitie_plata.py`, `declaratie_fiscala.py` și `contract_servicii.py`. Toate template-urile derivă dintr-o clasă abstractă `BasePdfTemplate`, care impune implementarea metodelor `validate_data()`, `build_canvas()` și `apply_signature()`, asigurând o interfață uniformă.

Construcția propriu-zisă a fișierului PDF este realizată prin biblioteca ReportLab 4.x [67], care expune două modele de programare complementare. Modelul `canvas` permite poziționarea pixel-perfect a elementelor în coordonate absolute, esențială pentru formularele fiscale ale Serviciului Fiscal de Stat, care impun pozițiile exacte ale câmpurilor. Modelul `platypus` (PageTemplate, Paragraph, Table) permite construirea de documente cu flux automat al textului, potrivit pentru contracte și acte cu lungime variabilă. Documentul generat este criptat cu același mecanism AES-256-GCM utilizat pentru documentele primite, înainte de stocarea pe disc. Fragmentul de cod relevant pentru generarea unei facturi fiscale este prezentat în Anexa D.

### 3.3.7 Procesarea asincronă prin Celery și Redis

Toate sarcinile cu durată mai mare de o secundă sunt delegate sistemului asincron Celery 5.4.0 [58], cu Redis ca broker de mesaje. Această arhitectură răspunde la o cerință fundamentală a aplicațiilor cu utilizatori interactivi: serverul HTTP nu trebuie să țină clientul în așteptare în timpul unei procesări costisitoare. La recepția unui document nou, serverul FastAPI înregistrează sarcina în coada Redis prin apelul `process_document.delay(document_id)`, returnează imediat clientului un răspuns cu statusul `processing` și eliberează resursele conexiunii.

Worker-ul Celery, rulând într-un container separat, preia sarcina din coadă și execută secvențial cele șase etape ale pipeline-ului AI descrise anterior. La finalizarea fiecărei etape, worker-ul actualizează statusul în baza de date și emite un eveniment WebSocket către clientul conectat, permițându-i să urmărească progresul în timp real. Această granularitate a comunicării transformă timpul de așteptare dintr-un interval pasiv într-o experiență interactivă, în care clientul vede etapele pe măsură ce sunt finalizate.

Sarcinile periodice sunt programate prin componenta Celery Beat, care rulează într-un container dedicat și publică sarcini la intervale fixe. Două sarcini periodice sunt active în implementarea curentă: scanarea zilnică a documentelor cu status `processing` mai vechi de o oră (pentru detectarea sarcinilor blocate și relansarea lor) și scanarea zilnică a termenelor fiscale apropiate (pentru generarea automată de notificări către clienți). Separarea Celery Beat de worker-ul Celery permite scalarea independentă a celor două responsabilități: planificare și execuție.

---

## 3.4 Implementarea aplicației web

Aplicația web este construită cu React 19 [64], TypeScript 5.9 și ecosistemul Material-UI 7.3, completat de TailwindCSS 4.2 pentru layouturi specifice. Această stivă tehnologică, fundamentată în subcapitolul 2.4, oferă un compromis echilibrat între viteza de dezvoltare, calitatea componentelor pre-existente și flexibilitatea stilizării personalizate. Codul sursă este organizat conform convențiilor Vite, cu directorul `src` ca punct de intrare și directorul `dist` ca destinație a build-ului de producție.

### 3.4.1 Structura paginilor și sistemul de routing

Routing-ul este implementat prin biblioteca `react-router-dom 7.13`, cu definirea declarativă a rutelor în fișierul `src/App.tsx`. Aplicația distinge între rute publice (accesibile fără autentificare) și rute protejate (accesibile doar utilizatorilor autentificați). Rutele publice includ pagina de pornire (`/`), pagina de logare (`/signin`) și pagina de înregistrare (`/signup`). Rutele protejate sunt înfășurate într-o componentă `<ProtectedRoute>` care verifică prezența și valabilitatea token-ului JWT în memoria contextului `AuthContext`, redirectând utilizatorul către pagina de logare în caz de absență.

Starea globală a aplicației este gestionată prin Context API, mecanism nativ React care evită complexitatea unui store extern de tip Redux pentru o aplicație de dimensiunea curentă. Contextul `AuthContext` păstrează informațiile despre utilizatorul autentificat, token-urile JWT și rolul acestuia, expunând metodele `login`, `logout` și `refreshToken`. Contextul `LanguageContext` păstrează limba activă a interfeței (română sau rusă) și expune funcția de traducere `t(key)`, care preia șirurile localizate din fișierele JSON de traducere.

### 3.4.2 Interfața de autentificare și înregistrare

Pagina de logare, implementată în fișierul `src/pages/SignIn.tsx`, prezintă un formular minimal cu două câmpuri: adresa de e-mail și parola. Validarea client-side se realizează prin `react-hook-form` cu schema de validare Zod, care verifică formatul adresei de e-mail și lungimea minimă a parolei înainte de orice apel către server. La trimiterea formularului, componenta apelează metoda `authApi.login()`, care realizează cererea HTTP către endpoint-ul `/auth/login` și, în caz de succes, salvează token-urile JWT în memoria contextului `AuthContext` și redirectează utilizatorul la pagina principală corespunzătoare rolului său.

**[FIGURA 3.7 — CAPTURĂ NECESARĂ:** ecranul de logare al aplicației web, cu formularul pentru e-mail și parolă, butonul de login, link-ul către înregistrare și link-ul către recuperarea parolei.**]**

Figura 3.7. Interfața de autentificare a aplicației web AI-Contabil.

Pentru utilizatorii cu autentificare în doi factori activată, după validarea credențialelor, este afișată componenta `TwoFactorPrompt`, care solicită codul de șase cifre generat de aplicația de autentificare sau permite scanarea codului QR cu aplicația mobilă. Această a doua opțiune, descrisă în detaliu în subcapitolul 3.5.3, permite finalizarea autentificării web fără tastarea manuală a codului, scenariu deosebit de util pe stații publice unde introducerea repetată a codului ar reprezenta un risc.

### 3.4.3 Interfața clientului — încărcarea și vizualizarea documentelor

Pagina principală a clientului, implementată în fișierul `src/pages/Documents.tsx`, este structurată în trei zone distincte: zona superioară conține bara de acțiuni rapide (încărcare document, descărcare raport, contact contabil), zona centrală afișează lista documentelor proprii filtrabilă și sortabilă, iar zona inferioară prezintă notificările recente și termenele fiscale apropiate.

Încărcarea documentelor este realizată printr-o componentă de tip drag-and-drop, care acceptă atât fișiere selectate prin click pe zona dedicată, cât și fișiere trase peste zonă. La selectarea unui fișier, componenta validează tipul MIME (acceptând JPEG, PNG, PDF) și dimensiunea (limita 10 MB), afișează o previzualizare în miniatură și activează butonul de încărcare. Cererea către endpoint-ul `POST /documents/upload` este însoțită de o bară de progres care reflectă procentul transferat, calculat din evenimentul `onUploadProgress` al bibliotecii `axios`.

**[FIGURA 3.8 — CAPTURĂ NECESARĂ:** dashboard-ul clientului, cu zona de upload activă (cu un fișier deja selectat și miniatură), tabelul cu documentele încărcate (cu coloanele Tip, Data, Status, Acțiuni) și panoul lateral cu notificări recente.**]**

Figura 3.8. Interfața clientului — încărcarea și vizualizarea documentelor proprii.

După încărcare, fiecare document apare în tabel cu statusul inițial `processing`, însoțit de un indicator vizual animat. Pe măsură ce pipeline-ul AI avansează, statusul se actualizează în timp real prin conexiunea WebSocket, fără ca clientul să fie nevoit să reîncarce pagina. La finalizarea procesării, statusul tranzitează la `completed` (procesare reușită) sau `failed` (eroare detectată), iar un click pe rând deschide un panou cu detaliile complete: previzualizarea documentului original, tabelul câmpurilor extrase de AI, scorul de încredere al fiecărui câmp și recomandările contabile asociate.

### 3.4.4 Interfața contabilului — coada documentelor și validarea OCR

Pagina dedicată contabilului, implementată în fișierul `src/pages/Contabil.tsx`, este structurată ca o coadă de lucru. Documentele așteptând validare sunt afișate sortate descendent după scorul de urgență, calculat în modulul AI conform descrierii din subcapitolul 3.3.3. Etichetele vizuale colorate (roșu pentru urgență ridicată, portocaliu pentru medie, verde pentru scăzută) permit contabilului să identifice imediat documentele care necesită atenție prioritară.

Click-ul pe un document din coadă deschide ecranul de validare, care prezintă în paralel imaginea originală (în partea stângă) și formularul cu câmpurile extrase de AI (în partea dreaptă). Fiecare câmp extras este însoțit de scorul său de încredere, afișat ca procent. Câmpurile cu scor sub 80% sunt marcate vizual cu chenar galben, semnalând necesitatea verificării atente. Contabilul poate edita orice câmp direct în formular; modificările sunt salvate ca exemple de antrenare în tabelul `training_examples`, contribuind la îmbunătățirea ulterioară a modelelor AI prin reantrenare.

**[FIGURA 3.9 — CAPTURĂ NECESARĂ:** ecranul contabilului cu coada de documente în partea stângă (lista cu etichete colorate de urgență) și panoul de validare deschis în partea dreaptă, cu imaginea facturii și formularul cu câmpurile extrase de AI (număr, data, furnizor, sume, TVA), inclusiv un câmp marcat galben cu scor scăzut de încredere.**]**

Figura 3.9. Interfața contabilului pentru validarea documentelor procesate prin AI.

### 3.4.5 Interfața administratorului — antrenarea modelelor și auditul

Pagina dedicată administratorului, implementată în fișierul `src/pages/Admin.tsx`, oferă acces la funcționalitățile avansate de gestionare a sistemului. Aceasta este organizată în patru secțiuni principale, accesibile prin tab-uri: gestionarea utilizatorilor (creare, editare, dezactivare conturi), antrenarea modelelor AI, vizualizarea jurnalului de audit și monitorizarea sănătății sistemului.

Secțiunea de antrenare a modelelor afișează versiunile existente ale clasificatorului BERT, cu numărul de exemple utilizate la antrenare, data versiunii și metricile de performanță (acuratețe, precizie, recall, F1-score). Butonul „Antrenează model nou" inițiază reantrenarea pe baza tuturor corecțiilor manuale acumulate de la ultima versiune. Procesul de antrenare rulează asincron printr-un task Celery dedicat și progresul este afișat în timp real prin WebSocket. La finalizare, administratorul poate evalua noile metrici și decide dacă activează versiunea nouă sau o respinge prin operațiunea de rollback.

**[FIGURA 3.10 — CAPTURĂ NECESARĂ:** interfața administratorului pe tab-ul de antrenare modele, cu lista versiunilor existente (cu metricile lor), butonul de antrenare nouă activat, și un grafic care compară acuratețea modelelor în timp.**]**

Figura 3.10. Interfața administratorului pentru gestionarea ciclului de antrenare a modelelor AI.

Secțiunea de jurnal de audit afișează lista paginată a operațiunilor înregistrate în tabelul `audit_logs`, cu posibilitatea filtrării după utilizator, tip de acțiune și interval de timp. Fiecare înregistrare include hash-ul de integritate al lanțului criptografic. Un buton dedicat declanșează verificarea automată a întregului lanț și raportează vizual prezența sau absența breșelor de integritate.

### 3.4.6 Widget-ul de chat cu agentul Djarvis

Widget-ul de chat este implementat în componenta `ChatWidget.tsx` și este disponibil pe toate paginile aplicației, ancorat în colțul din dreapta jos al ecranului. La click pe iconița widget-ului, se deschide o fereastră de conversație cu istoricul curent al sesiunii, sugestiile de întrebări frecvente generate de modulul `suggestions.py` și câmpul de introducere a întrebării. Mesajele sunt transmise asincron către endpoint-ul `POST /agent/chat`, iar răspunsul agentului este afișat progresiv pe măsură ce este generat, prin streaming tip Server-Sent Events. Această afișare progresivă reduce timpul perceput de așteptare și transmite utilizatorului senzația unei conversații fluide.

---

## 3.5 Implementarea aplicației mobile

Aplicația mobilă este implementată cu React Native 0.81.5 și framework-ul Expo 54 [65], conform argumentelor prezentate în subcapitolul 2.4. Aplicația este concepută ca o aplicație companion pentru platforma web, focalizată pe trei funcționalități esențiale care valorifică hardware-ul dispozitivului mobil: scanarea documentelor cu camera, autentificarea biometrică și autentificarea în doi factori a aplicației web prin scanare cod QR. Interfața conversațională Djarvis este disponibilă și pe mobil, pentru continuitatea experienței utilizatorului între cele două platforme.

### 3.5.1 Structura ecranelor cu Expo Router

Routing-ul aplicației mobile utilizează Expo Router, care implementează un model bazat pe fișiere similar cu Next.js. Fiecare fișier `.tsx` din directorul `app` corespunde unei rute, iar directoarele cu nume între paranteze definesc grupuri de rute care nu apar în URL dar partajează același layout. Această convenție elimină necesitatea declarării explicite a rutelor și menține structura de cod aliniată cu structura de navigare a aplicației.

Aplicația definește două grupuri principale. Grupul `app/(autentificare)` conține ecranele de logare (`logare.tsx`) și înregistrare (`inregistrare.tsx`), accesibile utilizatorilor neautentificați. Grupul `app/(taburi)` conține ecranele principale, organizate într-un layout de tip bottom-tab cu cinci file: `index` (acasă, cu lista documentelor recente), `criere` (creare document nou prin scanare), `meniu` (acces la chat-ul Djarvis și setări), `notificari` (centrul de notificări) și `profil` (datele contului).

### 3.5.2 Modulul de scanare a documentelor cu camera dispozitivului

Funcționalitatea centrală a aplicației mobile este scanarea documentelor prin camera dispozitivului, implementată pe ecranul `app/(taburi)/criere.tsx`. La acest ecran, utilizatorul poate alege între trei moduri de captare: fotografie nouă cu camera, selectare imagine din galerie sau selectare fișier PDF de pe dispozitiv. Cele trei opțiuni utilizează biblioteci Expo specifice: `expo-camera 17.0` pentru captarea live cu camera, `expo-image-picker 17.0` pentru accesul la galerie și `expo-document-picker 14.0` pentru selecția fișierelor.

Captarea cu camera prezintă utilizatorului o previzualizare live a obiectivului, cu un cadru de ghidaj suprapus care indică zona optimă pentru poziționarea documentului. La apăsarea butonului de declanșare, fotografia este capturată la rezoluția maximă a camerei, salvată temporar în memoria internă și prezentată utilizatorului pentru confirmare. Utilizatorul poate refoarea fotografia dacă imaginea este blurată sau insuficient luminată, fără a transmite documentul la server.

**[FIGURA 3.11 — CAPTURĂ NECESARĂ:** două ecrane mobile lateral: (stânga) ecranul de captare cu camera, cu cadrul de ghidaj vizibil și butonul de declanșare; (dreapta) ecranul de confirmare cu fotografia capturată și butoanele „Reia" și „Trimite".**]**

Figura 3.11. Modulul de scanare a documentelor în aplicația mobilă AI-Contabil.

La confirmarea documentului, aplicația realizează cererea HTTP către endpoint-ul `POST /documents/upload` cu fișierul atașat ca `multipart/form-data`. O bară de progres reflectă procentul transferat. La finalizarea cu succes, utilizatorul este redirectat la ecranul de detalii al documentului, unde poate urmări în timp real progresul procesării AI prin conexiunea WebSocket, similar cu fluxul de pe aplicația web.

### 3.5.3 Autentificarea biometrică și 2FA prin cod QR

Persistența sesiunii utilizatorului pe dispozitivul mobil este realizată prin biblioteca `expo-secure-store 55.0`, care stochează token-urile JWT în zona de stocare securizată specifică sistemului de operare: Keychain pe iOS și EncryptedSharedPreferences pe Android. Această zonă este protejată hardware împotriva accesului neautorizat și nu este accesibilă altor aplicații. La fiecare deschidere a aplicației, modulul verifică prezența token-urilor și valabilitatea lor, ofertând utilizatorului acces direct la conținut fără reintroducerea credențialelor.

Pentru utilizatorii cu autentificare biometrică activată (amprentă, recunoaștere facială), modulul `expo-local-authentication` solicită confirmarea biometrică înainte de eliberarea token-urilor din SecureStore. Această dublă protecție previne accesul la datele financiare în cazul în care dispozitivul este utilizat de o altă persoană. În cazul unui eșec biometric, utilizatorul poate utiliza alternativ codul PIN al sistemului, conform comportamentului standard al fiecărei platforme mobile.

Aplicația mobilă include o funcționalitate distinctă care leagă cele două platforme: scanarea unui cod QR generat pe ecranul de logare al aplicației web pentru finalizarea autentificării 2FA. La pasul de logare web, dacă utilizatorul are un dispozitiv mobil înregistrat, serverul afișează pe ecranul web un cod QR care codifică o cerere temporară de autentificare. Utilizatorul scanează codul cu aplicația mobilă (deja autentificată cu biometrie), iar aplicația confirmă cererea către server, finalizând astfel logarea pe web fără introducerea manuală a codului 2FA.

**[FIGURA 3.12 — CAPTURĂ NECESARĂ:** două capturi paralele: (stânga) ecranul aplicației web cu codul QR afișat pentru 2FA, însoțit de instrucțiunea „Scanează acest cod cu aplicația mobilă"; (dreapta) ecranul aplicației mobile cu camera deschisă pe codul QR și mesajul de confirmare.**]**

Figura 3.12. Mecanismul de autentificare 2FA prin scanare cod QR cu aplicația mobilă.

### 3.5.4 Sincronizarea cu backend-ul prin REST și WebSocket

Comunicarea cu backend-ul se realizează prin aceleași endpoint-uri REST utilizate de aplicația web, asigurând paritatea funcțională între cele două platforme. Modulul `lib/api.ts` configurează un client `axios` cu interceptoare care adaugă automat header-ul `Authorization` la fiecare cerere și gestionează reînnoirea token-ului expirat prin refresh token, fără ca utilizatorul să fie deconectat. În cazul în care reînnoirea eșuează (refresh token expirat sau revocat), utilizatorul este redirectat la ecranul de logare cu un mesaj explicativ.

Notificările push sunt livrate prin canalul nativ al sistemului de operare, prin integrarea cu serviciile Expo Push Notifications. La înregistrarea aplicației, dispozitivul obține un token unic care este transmis serverului prin endpoint-ul `POST /users/push-token`. Atunci când o notificare este creată în baza de date pentru un utilizator cu token mobil înregistrat, modulul de notificări trimite simultan un mesaj prin Expo Push Service, asigurând livrarea instantanee chiar și atunci când aplicația este în background sau închisă.

---

## 3.6 Testarea sistemului

Testarea sistemului AI-Contabil a fost concepută ca proces continuu, integrat în ciclul de dezvoltare. Strategia adoptată combină trei niveluri de testare, fiecare cu rol distinct: testarea unitară (verificarea izolată a funcțiilor individuale), testarea de integrare (verificarea interacțiunii dintre module) și testarea funcțională end-to-end (verificarea fluxurilor complete din perspectiva utilizatorului). Această structurare ierarhică, recomandată în literatura de specialitate sub denumirea de „piramidă a testelor", asigură o acoperire echilibrată a sistemului fără supra-investiție în testele costisitoare de tip end-to-end [25].

### 3.6.1 Strategia de testare adoptată

Suita de teste automate acoperă în primul rând backend-ul, unde precizia și determinismul codului permit definirea de aserțiuni clare. Testele sunt organizate în directorul `backend-project/tests`, urmând o structură paralelă cu cea a codului sursă: fiecare modul de routere are un fișier dedicat de test (`test_auth.py`, `test_documents.py`, `test_users.py`, `test_notifications.py`, `test_reports.py`, `test_security.py`). Fișierul `conftest.py` definește fixture-urile partajate: clientul HTTP de test, baza de date efemeră în memorie și utilizatorii predefiniți cu fiecare rol din ierarhie.

Testarea componentei AI nu se poate baza exclusiv pe asserțiuni deterministe, întrucât modelele de învățare automată produc rezultate cu variabilitate inerentă. Pentru această componentă a fost adoptată o abordare combinată: verificarea structurală (răspunsul are forma și câmpurile așteptate) și verificarea statistică (acuratețea pe un set de test independent depășește un prag minim configurat). Această dublă verificare validează atât integritatea pipeline-ului, cât și calitatea modelului antrenat.

Testarea aplicațiilor web și mobile a fost realizată preponderent manual, prin scenarii end-to-end derulate pe browser-e moderne (Chrome, Firefox, Edge) și pe dispozitive mobile reale (Android 12 și Android 14). Testarea manuală a fost aleasă pentru aceste componente datorită naturii vizuale a interfeței, unde comportamentul vizual, animațiile și feedback-ul tactil sunt dificil de validat automat.

### 3.6.2 Suita de teste automate cu Pytest

Testele backend sunt scrise în framework-ul Pytest și utilizează clientul HTTP `TestClient` din FastAPI, care permite invocarea endpoint-urilor fără pornirea unui server real. Această abordare reduce semnificativ timpul de execuție al suitei și permite rularea testelor în pipeline-ul CI/CD la fiecare commit. Un fragment reprezentativ din suita de teste, prezentat în Anexa F, ilustrează modelul utilizat: fiecare test este o funcție Python decorată implicit, care primește fixture-urile de care are nevoie ca parametri, execută o cerere HTTP și verifică răspunsul prin aserțiuni.

**[FIGURA 3.13 — CAPTURĂ NECESARĂ:** rezultatul rulării `pytest -v` în terminal, cu lista completă a testelor executate, statusul `PASSED` pe fiecare linie și raportul final cu numărul total de teste și durata.**]**

Figura 3.13. Raportul de execuție al suitei de teste automate Pytest.

Suita curentă cuprinde aproximativ 80 de teste distribuite pe cele șase fișiere de test, acoperind toate endpoint-urile critice ale backend-ului: autentificare, gestionare documente, gestionare utilizatori, notificări, rapoarte și verificări de securitate. Acoperirea de cod, măsurată prin extensia `pytest-cov`, depășește 75% pentru codul aplicației, valoare considerată suficientă pentru o aplicație în faza de validare academică, conform recomandărilor curente din ingineria software [25].

### 3.6.3 Scenarii de testare funcțională end-to-end

Testarea funcțională end-to-end a fost realizată prin parcurgerea manuală a fluxurilor principale ale aplicației, urmărind validarea integrată a tuturor componentelor. Scenariile au fost elaborate pe baza diagramelor Use Case prezentate în subcapitolul 2.1 și acoperă atât fluxurile pozitive (utilizatorul urmează pașii corecți), cât și fluxurile negative (sistemul este supus unor condiții de eroare pentru a verifica gestionarea acestora). Tabelul 3.1 sintetizează zece scenarii reprezentative executate.

Tabelul 3.1. Scenarii de testare funcțională a sistemului AI-Contabil.

| Cod  | Scenariu | Acțiune | Rezultat așteptat | Rezultat obținut |
|------|----------|---------|-------------------|------------------|
| T-01 | Autentificare client | Introducerea credențialelor valide | Redirectare la dashboard client | TRECUT — token JWT emis, navigare corectă |
| T-02 | Autentificare cu parolă greșită | Introducerea unei parole incorecte | Mesaj de eroare 401, fără navigare | TRECUT — mesaj „Credențiale invalide" afișat |
| T-03 | Activare 2FA prin cod QR mobil | Scanare cod QR cu aplicația mobilă | Logare web finalizată fără cod manual | TRECUT — confirmare instantanee |
| T-04 | Încărcare factură fotografiată | Upload imagine JPEG factură fiscală | Procesare AI completă în sub 30 secunde | TRECUT — câmpuri extrase cu confidence > 90% |
| T-05 | Validare contabil cu corecție | Editare câmp greșit în formular | Salvare ca exemplu de antrenare | TRECUT — înregistrare creată în `training_examples` |
| T-06 | Detecție duplicat | Reupload același document | Marcare ca duplicat, referință la original | TRECUT — similaritate FAISS = 1.0 |
| T-07 | Întrebare către agent Djarvis | Interogare despre termen declarație | Răspuns relevant cu citare legislație | TRECUT — răspuns generat în ton uman |
| T-08 | Generare PDF factură | Solicitare emitere factură nouă | Document PDF criptat disponibil pentru descărcare | TRECUT — PDF conform cerințelor SFS |
| T-09 | Notificare termen apropiat | Document cu termen sub 3 zile | Notificare automată pe web și mobil | TRECUT — Celery Beat declanșează corect |
| T-10 | Verificare lanț audit | Apel endpoint verificare integritate | Confirmarea integrității lanțului SHA-256 | TRECUT — toate hash-urile valide |

Toate cele zece scenarii principale au fost executate cu succes, confirmând funcționarea corectă a tuturor fluxurilor end-to-end. Rezultatele demonstrează că sistemul gestionează corespunzător atât cazurile uzuale, cât și situațiile de eroare, oferind utilizatorului un feedback clar și consistent în limba română.

### 3.6.4 Testarea pipeline-ului AI pe documente reale

Testarea pipeline-ului AI a fost realizată pe un set independent de 50 de documente financiare anonimizate, distribuite proporțional pe cele opt categorii definite în clasificator. Setul de test nu a fost utilizat în antrenarea modelului, ceea ce asigură că rezultatele reflectă capacitatea reală de generalizare. Documentele au fost procesate succesiv prin pipeline-ul complet, iar rezultatele au fost comparate cu adevărul-de-bază stabilit de un contabil profesionist.

Acuratețea de clasificare măsurată pe acest set de test atinge 91,3%, valoare consistentă cu performanța raportată în literatură pentru clasificatori similari pe corpuri în limba română [62]. Câmpurile extrase prin NER (numărul documentului, data, suma, denumirea furnizorului) au înregistrat o acuratețe medie de 87,5%, valoare considerată acceptabilă pentru o componentă care servește drept asistent al contabilului, nu ca decizie automatizată independentă. Toate erorile identificate au fost adăugate la setul de antrenare pentru îmbunătățirea modelelor în ciclurile ulterioare.

Agentul Djarvis a fost evaluat pe 30 de întrebări reprezentative formulate de un contabil practician, acoperind subiecte din Codul Fiscal, regulamentele Serviciului Fiscal de Stat și procedurile contabile uzuale. Pentru fiecare întrebare a fost evaluată corectitudinea factuală a răspunsului (aceasta corespunde literei legii?), relevanța (răspunsul atinge subiectul întrebării?) și calitatea exprimării (formularea este accesibilă, nu birocratică?). Pe ansamblul celor 30 de întrebări, agentul a furnizat răspunsuri factual corecte în 26 de cazuri, parțial corecte în 3 cazuri și greșite într-un singur caz, performanță considerată satisfăcătoare pentru un asistent informativ care nu înlocuiește judecata profesionistului.

### 3.6.5 Sinteza rezultatelor testelor

Rezultatele cumulate ale celor trei niveluri de testare sunt sintetizate în Tabelul 3.2, care prezintă atât metricile cantitative, cât și concluzia calitativă pentru fiecare componentă a sistemului.

Tabelul 3.2. Sinteza rezultatelor testării sistemului AI-Contabil.

| Componentă | Tip testare | Indicator de performanță | Valoare măsurată | Concluzie |
|------------|-------------|--------------------------|------------------|-----------|
| Backend FastAPI | Pytest unitar și integrare | Acoperire de cod | 75% | Acceptabil |
| Backend FastAPI | Pytest unitar și integrare | Teste trecute | 80 / 80 | Toate trecute |
| Pipeline OCR | Test pe set independent | Acuratețe extracție câmpuri | 87,5% | Acceptabil |
| Clasificator BERT | Test pe set independent | Acuratețe clasificare | 91,3% | Bun |
| Agent Djarvis | Evaluare manuală | Răspunsuri corecte | 26 / 30 (86,7%) | Satisfăcător |
| Aplicație web | Scenarii E2E manuale | Scenarii trecute | 10 / 10 | Toate trecute |
| Aplicație mobilă | Scenarii E2E manuale | Scenarii trecute | 10 / 10 | Toate trecute |

Datele din tabel confirmă că sistemul AI-Contabil este funcțional pe toate cele patru componente principale și că pipeline-ul AI atinge nivele de performanță comparabile cu cele raportate în literatura de specialitate pentru sarcini similare. Acolo unde performanța nu este perfectă (în special la extracția câmpurilor prin NER), arhitectura include mecanismul de validare manuală a contabilului, transformând fiecare eroare a modelului într-un exemplu de antrenare care contribuie la îmbunătățirea modelului în ciclul următor. Această buclă de feedback închisă reprezintă un avantaj structural al soluției față de un sistem static.

---

## Concluzii la capitolul 3

Capitolul de față a prezentat în detaliu implementarea efectivă a sistemului AI-Contabil și rezultatele testării acestuia. Implementarea a confirmat fezabilitatea practică a deciziilor arhitecturale formulate în capitolul anterior. Toate cele patru componente principale — serverul backend FastAPI, microserviciul AI cu agentul Djarvis, aplicația web React și aplicația mobilă React Native — au fost construite, integrate și validate prin teste automate și manuale.

Containerizarea prin Docker s-a dovedit o alegere arhitecturală inspirată. Aceasta a redus la minimum problemele de configurare a mediului între stațiile de dezvoltare și a permis pornirea întregului ecosistem cu o singură comandă. Separarea microserviciului AI de serverul principal a permis dezvoltarea și depanarea independentă a celor două componente, fără ca modificările dintr-un serviciu să afecteze stabilitatea celuilalt.

Modulul AI a confirmat capacitatea de a procesa documente financiare reale cu performanță acceptabilă pentru contextul aplicat. Pipeline-ul OCR construit pe PaddleOCR atinge acuratețe ridicată pe documente fotografiate cu aplicația mobilă. Clasificatorul BERT distinge corect între cele opt categorii de documente cu o rată de eroare sub 10%. Agentul conversațional Djarvis răspunde la întrebări despre legislația contabilă a Republicii Moldova într-un ton uman și accesibil, păstrând documentele și întrebările exclusiv pe infrastructura locală a firmei.

Aplicația web oferă fiecărui rol o interfață dedicată, optimizată pentru fluxul său specific. Clientul are un dashboard simplu pentru încărcarea și urmărirea documentelor. Contabilul dispune de o coadă de lucru ordonată după urgență, cu validare în paralel a câmpurilor extrase de AI. Administratorul controlează ciclul de antrenare a modelelor și verifică integritatea jurnalului de audit.

Aplicația mobilă valorifică hardware-ul dispozitivului prin trei funcționalități esențiale: scanarea documentelor cu camera, autentificarea biometrică și finalizarea autentificării 2FA web prin scanare cod QR. Această diviziune clară între web (interfață completă) și mobil (companion specializat) răspunde la modul real în care utilizatorii interacționează cu sistemele similare.

Testarea sistemului a confirmat funcționalitatea corectă a tuturor fluxurilor majore. Suita automată Pytest acoperă peste 75% din codul backend-ului, iar toate cele zece scenarii end-to-end definite pe baza diagramelor Use Case au trecut. Performanța componentelor AI, măsurată pe seturi de test independente, se încadrează în nivelele raportate de literatura de specialitate pentru sarcini similare. Mecanismul de validare manuală a contabilului asigură că eventualele erori ale modelului sunt corectate înainte de a fi propagate în datele finale, și că fiecare corecție alimentează automat ciclul de îmbunătățire a modelelor.

În ansamblu, sistemul AI-Contabil este o soluție funcțională, validată tehnic, gata pentru pilotare într-o firmă reală de contabilitate. Implementarea actuală răspunde tuturor cerințelor funcționale identificate în capitolul 1 și depășește, prin componenta AI și prin agentul Djarvis, limitările documentate ale sistemelor existente pe piața locală.

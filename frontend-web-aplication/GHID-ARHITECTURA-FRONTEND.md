# GHID ARHITECTURĂ FRONTEND — AI Contabil

## Cuprins

1. [Prezentare generală](#1-prezentare-generală)
2. [Tehnologii folosite](#2-tehnologii-folosite)
3. [Cum pornește aplicația](#3-cum-pornește-aplicația)
4. [Structura folderelor](#4-structura-folderelor)
5. [Fiecare folder — ce face și de ce există](#5-fiecare-folder--ce-face-și-de-ce-există)
6. [Rutarea — cum navighez între pagini](#6-rutarea--cum-navighez-între-pagini)
7. [Stilurile CSS — cum funcționează](#7-stilurile-css--cum-funcționează)
8. [Componentele — piese reutilizabile](#8-componentele--piese-reutilizabile)
9. [Paginile — ecranele aplicației](#9-paginile--ecranele-aplicației)
10. [Modelele TypeScript — tipuri de date](#10-modelele-typescript--tipuri-de-date)
11. [API-urile — comunicarea cu backend-ul](#11-api-urile--comunicarea-cu-backend-ul)
12. [Animațiile — cum funcționează](#12-animațiile--cum-funcționează)
13. [Convenții de cod](#13-convenții-de-cod)
14. [Fluxul complet: de la click la ecran](#14-fluxul-complet-de-la-click-la-ecran)
15. [Foldere pregătite pentru viitor](#15-foldere-pregătite-pentru-viitor)

---

## 1. Prezentare generală

**AI Contabil** este o aplicație web de gestiune documente contabile/legale.

Aplicația frontend este construită cu **React** și are următoarele pagini:
- **Home** (`/` și `/home`) — pagina principală cu secțiuni informative
- **Sign In** (`/signin`) — formularul de logare
- **Sign Up** (`/signup`) — formularul de înregistrare
- **Settings** (`/settings`) — setările utilizatorului (profil, notificări, securitate, ajutor)

Fiecare pagină are propriul folder cu fișierul `.tsx` (logica + structura) și `.css` (stilurile vizuale).

---

## 2. Tehnologii folosite

| Tehnologie | Versiune | Ce face |
|---|---|---|
| **React** | 19.2 | Librăria principală — construiește interfața din componente |
| **TypeScript** | 5.9 | Superset JavaScript — adaugă tipuri de date (previne erori) |
| **Vite** | 7.3 | Build tool — pornește serverul de dezvoltare, compilează codul |
| **React Router DOM** | 7.13 | Gestionează navigarea între pagini (SPA — Single Page Application) |
| **Material UI Icons** | 7.3 | Librărie de iconițe (lacăt, ochi, clopoțel, etc.) |
| **Emotion** | 11.14 | Motor CSS-in-JS (necesar pentru Material UI) |

### Comenzi disponibile

```bash
npm run dev      # Pornește serverul de dezvoltare (http://localhost:5173)
npm run build    # Compilează aplicația pentru producție
npm run lint     # Verifică codul cu ESLint (reguli de calitate)
npm run preview  # Previzualizează versiunea compilată
```

---

## 3. Cum pornește aplicația

Lanțul de pornire (în ordinea execuției):

```
index.html                    ← Browserul încarcă acest fișier
  └── src/main.tsx            ← Punctul de intrare JavaScript
        ├── src/index.css     ← Stilurile globale (culori, fonturi, reset CSS)
        └── <App />           ← Componenta principală
              └── <Routes>    ← Sistemul de rutare (decidă ce pagină se afișează)
                    ├── "/" → <Home isLoggedIn={false} />
                    ├── "/home" → <Home isLoggedIn={true} />
                    ├── "/signin" → <SignIn />
                    ├── "/signup" → <SignUp />
                    └── "/settings" → <Settings />
```

### Ce se întâmplă pas cu pas:

**Pasul 1:** `index.html` se încarcă în browser și conține un singur `<div id="root">`.

**Pasul 2:** `main.tsx` se execută:
```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>     {/* ← Activează sistemul de rute */}
      <App />           {/* ← Componenta principală */}
    </BrowserRouter>
  </StrictMode>,
);
```
- `StrictMode` — mod de dezvoltare React (verificări suplimentare, nu afectează producția)
- `BrowserRouter` — înconjoară toată aplicația pentru a permite navigarea între pagini fără reload

**Pasul 3:** `App.tsx` citește URL-ul curent și afișează pagina corespunzătoare:
```tsx
const location = useLocation();  // Citește URL-ul curent

<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Home isLoggedIn={false} />} />
  {/* ... alte rute */}
</Routes>
```
- `key={location.pathname}` — forțează re-render la schimbarea paginii (necesar pentru animații de tranziție)

---

## 4. Structura folderelor

```
AI-Contabil/
├── public/                 ← Fișiere statice (servite direct, fără procesare)
├── src/                    ← TOT codul sursă al aplicației
│   ├── api/                ← Funcții de comunicare cu backend-ul
│   ├── assets/             ← Imagini, fonturi, fișiere media
│   ├── components/         ← Componente reutilizabile (Navbar, Footer, AlertToast...)
│   ├── config/             ← Configurări (URL API, constante de mediu) [VIITOR]
│   ├── constants/          ← Constante ale aplicației (roluri, statusuri) [VIITOR]
│   ├── context/            ← React Context (state global partajat) [VIITOR]
│   ├── hooks/              ← Custom hooks React (logică reutilizabilă) [VIITOR]
│   ├── layouts/            ← Layout-uri (structuri de pagină partajate) [VIITOR]
│   ├── middleware/         ← Interceptori HTTP, verificări auth [VIITOR]
│   ├── models/             ← Interfețe TypeScript (tipuri de date)
│   ├── pages/              ← Paginile aplicației (Home, SignIn, SignUp, Settings)
│   ├── routes/             ← Configurare rute avansată [VIITOR]
│   ├── services/           ← Logica de business (procesare date) [VIITOR]
│   ├── store/              ← State management global (Redux/Zustand) [VIITOR]
│   ├── types/              ← Tipuri TypeScript globale [VIITOR]
│   ├── utils/              ← Funcții utilitare (formatare date, validare) [VIITOR]
│   ├── validation/         ← Reguli de validare formulare [VIITOR]
│   ├── App.tsx             ← Componenta principală + rute
│   ├── App.css             ← Stiluri container principal
│   ├── index.css           ← Stiluri GLOBALE (variabile CSS, reset, animații)
│   └── main.tsx            ← Punctul de intrare al aplicației
├── index.html              ← Pagina HTML de bază
├── package.json            ← Dependențe + scripturi npm
├── tsconfig.json           ← Configurare TypeScript
├── vite.config.ts          ← Configurare Vite (build tool)
└── eslint.config.js        ← Reguli de calitate cod
```

---

## 5. Fiecare folder — ce face și de ce există

### `src/api/` — Comunicarea cu backend-ul

**Scop:** Toate funcțiile care trimit/primesc date de la server sunt aici.

**Principiu:** Fiecare fișier corespunde unui grup de endpoint-uri API.

| Fișier | Ce conține |
|---|---|
| `settingsApi.ts` | Funcții pentru profil utilizator, parolă, documente securitate |
| `notificationsApi.ts` | Funcții pentru lista de notificări, marcare citită, ștergere |

**Cum funcționează:**
```tsx
// Fiecare funcție este async și returnează un Promise
export const fetchNotifications = async (): Promise<Notification[]> => {
  // Momentan returnează date mock (test)
  // În viitor: return await fetch('/api/notifications').then(res => res.json());
  return mockNotifications;
};
```

**De ce e separat:** Când conectezi backend-ul, schimbi DOAR fișierele din `api/` — restul aplicației rămâne neschimbat.

---

### `src/models/` — Tipuri de date TypeScript

**Scop:** Definește STRUCTURA datelor folosite în aplicație.

**Principiu:** Fiecare interfață descrie cum arată un obiect de date.

```tsx
// Ce câmpuri are un profil de utilizator?
export interface UserProfile {
  name: string;           // Numele utilizatorului
  email: string;          // Adresa de email
  contactNumber: string;  // Numărul de telefon
  avatarUrl?: string;     // URL-ul pozei (opțional — semnul ?)
}

// Ce câmpuri are o notificare?
export interface Notification {
  id: string;                              // Identificator unic
  title: string;                           // Titlul notificării
  message: string;                         // Textul notificării
  date: string;                            // Data notificării
  type: 'urgent' | 'info' | 'warning';    // Poate fi DOAR una din aceste 3 valori
  isRead: boolean;                         // A fost citită? (true/false)
}
```

**De ce e important:** TypeScript te avertizează la compilare dacă încerci să folosești un câmp care nu există sau dacă trimiți tipul greșit de date. Previne erori.

---

### `src/components/` — Componente reutilizabile

**Scop:** Piese de interfață care se folosesc pe MAI MULTE pagini.

**Principiu:** O componentă = un folder cu `.tsx` (logica) + `.css` (stilul).

| Componentă | Unde se folosește | Ce face |
|---|---|---|
| `Navbar/` | Home, SignIn, SignUp, Settings | Bara de navigare de sus |
| `Footer/` | Home | Footer-ul cu linkuri + buton chat |
| `SettingsSidebar/` | Settings | Meniul lateral din stânga (Edit profile, Notification...) |
| `AlertToast/` | Oriunde în aplicație | Alerte pop-up (Success, Error, Warning, Info) |

**Exemplu — cum funcționează Navbar:**
```tsx
// Navbar primește props (proprietăți) care îi spun ce să afișeze
interface NavbarProps {
  isLoggedIn?: boolean;    // Utilizatorul e logat?
  showNavLinks?: boolean;  // Afișăm linkuri de navigare?
}

// Componenta folosește props-urile pentru a decide ce randează
const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  return (
    <nav className="navbar">
      {/* Logo-ul — mereu vizibil */}
      <div className="navbar__logo">Logo</div>

      {/* Linkuri — doar dacă showNavLinks e true */}
      {showNavLinks && (
        <div className="navbar__links">...</div>
      )}

      {/* Partea dreaptă — depinde de isLoggedIn */}
      {isLoggedIn ? (
        // Dacă e logat: notificări + avatar
        <> <NotificationsIcon /> <PersonIcon /> </>
      ) : (
        // Dacă NU e logat: butoane Sign In + Sign Up
        <> <button>Sign In</button> <button>Sign Up</button> </>
      )}
    </nav>
  );
};
```

**Concepte cheie:**
- `{condiție && <element>}` — afișează elementul DOAR dacă condiția e true
- `{condiție ? <A> : <B>}` — if/else vizual: afișează A sau B
- `<> ... </>` — Fragment React: grupează elemente fără a adăuga un div suplimentar

---

### `src/pages/` — Paginile aplicației

**Scop:** Fiecare pagină (ecran) al aplicației.

**Principiu:** O pagină asamblează componente și secțiuni într-un layout complet.

```
pages/
├── Home/
│   ├── Home.tsx              ← Asamblează secțiunile într-o pagină
│   ├── Home.css
│   └── sections/             ← Secțiuni specifice paginii Home
│       ├── HeroSection.tsx   ← Titlul principal + imagine
│       ├── AboutSection.tsx  ← Despre proiect + legi
│       ├── StagesSection.tsx ← Pașii creării documentului
│       ├── DocumentsSection.tsx ← Tabel documente frecvente
│       ├── NewsSection.tsx   ← Știri
│       └── ConnectSection.tsx ← Contact
├── SignIn/
│   ├── SignIn.tsx            ← Formular de logare
│   └── SignIn.css
├── SignUp/
│   ├── SignUp.tsx            ← Formular de înregistrare
│   └── SignUp.css
└── Settings/
    ├── Settings.tsx          ← Layout: sidebar + zona de conținut
    ├── Settings.css
    └── sections/
        ├── EditProfile.tsx   ← Formularul de editare profil
        ├── NotificationList.tsx ← Lista de notificări
        ├── SecuritySettings.tsx ← Setări securitate
        └── HelpFaq.tsx       ← Întrebări frecvente
```

**Diferența pagină vs componentă:**
- **Pagina** = un ecran complet, legat de o rută URL
- **Componenta** = o piesă reutilizabilă care apare pe mai multe pagini
- **Secțiunea** = o parte a unei pagini (nu e reutilizabilă pe alte pagini)

---

## 6. Rutarea — cum navighez între pagini

### Ce este rutarea?

Aplicația este un **SPA (Single Page Application)** — browserul încarcă O SINGURĂ pagină HTML și React schimbă conținutul dinamic, fără a reîncărca pagina.

**React Router DOM** gestionează acest mecanism.

### Definirea rutelor (în `App.tsx`):

```tsx
<Routes location={location} key={location.pathname}>
  <Route path="/"          element={<Home isLoggedIn={false} />} />
  <Route path="/home"      element={<Home isLoggedIn={true} />} />
  <Route path="/signin"    element={<SignIn />} />
  <Route path="/signup"    element={<SignUp />} />
  <Route path="/settings"  element={<Settings />} />
</Routes>
```

Fiecare `<Route>` leagă un **URL** (path) de o **componentă** (element).

### Navigarea programatică (din cod):

```tsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/signin')}>
      Du-te la Sign In
    </button>
  );
};
```

- `useNavigate()` — hook React Router care returnează funcția de navigare
- `navigate('/signin')` — schimbă URL-ul fără reload de pagină

### Unde se face navigare în aplicație:

| De unde | Unde merge | Cum |
|---|---|---|
| Navbar → Logo | `/` (Home) | `navigate('/')` |
| Navbar → Sign In buton | `/signin` | `navigate('/signin')` |
| Navbar → Sign Up buton | `/signup` | `navigate('/signup')` |
| Navbar → Avatar (logat) | `/settings` | `navigate('/settings')` |
| SignIn → "Sign up" link | `/signup` | `navigate('/signup')` |
| SignUp → "Sign In" link | `/signin` | `navigate('/signin')` |
| Settings Sidebar → ← | `/home` | `navigate('/home')` |

---

## 7. Stilurile CSS — cum funcționează

### Variabilele CSS Globale (`index.css`)

Toate culorile, fonturile și dimensiunile sunt definite ca **variabile CSS** într-un singur loc:

```css
:root {
  /* Culori principale — albastru închis */
  --color-primary: #1a3a4a;
  --color-primary-light: #2a5a6a;

  /* Culori accent — verde olive */
  --color-accent: #8a9a6a;

  /* Fonturi */
  --font-primary: 'Inter', sans-serif;      /* Text normal */
  --font-heading: 'Playfair Display', serif; /* Titluri */

  /* Spațiere */
  --spacing-md: 1rem;   /* 16px */
  --spacing-lg: 1.5rem; /* 24px */

  /* Border radius */
  --radius-lg: 12px;
  --radius-full: 50px;  /* Complet rotunjit */
}
```

**Avantajul:** Schimbi o culoare ODATĂ în `:root` și se actualizează PESTE TOT.

**Folosire:**
```css
.buton {
  background-color: var(--color-primary);   /* Folosește variabila */
  border-radius: var(--radius-full);
  padding: var(--spacing-md);
}
```

### Convenția de denumire: BEM

Fiecare clasă CSS urmează pattern-ul **BEM (Block Element Modifier)**:

```
.block__element--modifier
```

| Parte | Ce înseamnă | Exemplu |
|---|---|---|
| **Block** | Componenta principală | `.navbar` |
| **Element** | O parte din block | `.navbar__logo`, `.navbar__link` |
| **Modifier** | O variantă/stare | `.navbar__btn--signin`, `.sidebar__item--active` |

**Exemplu real:**
```css
.signin-card                       /* Block: cardul de sign in */
.signin-card__title                /* Element: titlul din card */
.signin-card__input-group          /* Element: grupul de input */
.signin-card__footer-link--bold    /* Modifier: link-ul bold din footer */
```

### Fiecare componentă are propriul CSS

```
Navbar/
  ├── Navbar.tsx    ← import './Navbar.css'
  └── Navbar.css    ← stiluri DOAR pentru Navbar
```

Stilurile NU sunt CSS modules (nu au hash unic), dar datorită convenției BEM, clasele sunt suficient de specifice ca să nu se suprapună.

---

## 8. Componentele — piese reutilizabile

### Navbar (`src/components/Navbar/`)

**Ce face:** Bara de navigare fixată sus pe pagină.

**Comportament diferit pe baza props-urilor:**

| Pagina | `isLoggedIn` | `showNavLinks` | Ce apare |
|---|---|---|---|
| Home (nelogat) | `false` | `true` | Logo + Linkuri + Sign In/Sign Up |
| Home (logat) | `true` | `true` | Logo + Linkuri + Notificări + Avatar |
| SignIn / SignUp | `false` | `false` | Logo + Sign In/Sign Up |
| Settings | `true` | `false` | Logo + Notificări + Avatar |

**Cod important:**
```tsx
// Operatorul ternary decide ce se randează
{isLoggedIn ? (
  // LOGAT: iconițe
  <> <NotificationsIcon /> <PersonIcon onClick={navigateToSettings} /> </>
) : (
  // NELOGAT: butoane
  <> <button>Sign In</button> <button>Sign Up</button> </>
)}
```

---

### SettingsSidebar (`src/components/SettingsSidebar/`)

**Ce face:** Meniul lateral din pagina Settings.

**Cum funcționează navigarea între secțiuni:**

```tsx
// Sidebar-ul primește secțiunea activă și funcția de schimbare
interface SettingsSidebarProps {
  activeSection: SettingsSection;                      // Ce secțiune e activă acum
  onSectionChange: (section: SettingsSection) => void; // Funcția de schimbare
}

// La click pe un element din meniu:
<div onClick={() => onSectionChange('notification')}>
  Notification
</div>
```

Sidebar-ul NU schimbă URL-ul — schimbă doar un state intern al paginii Settings. Asta face comutarea instantanee (fără request HTTP).

---

### AlertToast (`src/components/AlertToast/`)

**Ce face:** Afișează o alertă pop-up cu 4 variante vizuale.

**Cele 4 tipuri:**

| Tip | Culoare | Când se folosește |
|---|---|---|
| `success` | Verde | Operație reușită (document creat, profil salvat) |
| `error` | Roșu | Eroare (document respins, cerere eșuată) |
| `warning` | Galben | Avertisment (document expiră, acțiune riscantă) |
| `info` | Violet/Albastru | Informare (cerere în procesare, actualizare) |

**Cum se folosește:**
```tsx
import AlertToast from '../components/AlertToast/AlertToast';

// Într-o componentă:
<AlertToast
  type="success"
  title="Success"
  message="Documentul a fost creat cu succes!"
  onClose={() => setShowAlert(false)}
  duration={5000}   // Dispare automat după 5 secunde
/>
```

**Cum funcționează auto-close:**
```tsx
useEffect(() => {
  if (duration > 0) {
    const timer = setTimeout(() => {
      setIsVisible(false);                    // Începe animația de ieșire
      setTimeout(() => onClose?.(), 300);     // După 300ms (animația), apelează onClose
    }, duration);
    return () => clearTimeout(timer);         // Cleanup la unmount
  }
}, [duration, onClose]);
```

---

## 9. Paginile — ecranele aplicației

### Home (`src/pages/Home/`)

**Layout:** Navbar + 6 secțiuni verticale + Footer

```tsx
const Home = ({ isLoggedIn = false }: HomeProps) => {
  return (
    <div className="home-page">
      <Navbar isLoggedIn={isLoggedIn} showNavLinks={true} />
      <div className="home-page__content">
        <HeroSection />          {/* Secțiunea hero — titlu + imagine */}
        <AboutSection />         {/* Despre proiect + legi */}
        <StagesSection />        {/* Pașii creării documentului */}
        <DocumentsSection />     {/* Tabel documente */}
        <NewsSection />          {/* Știri */}
        <ConnectSection />       {/* Contact */}
      </div>
      <Footer showChat={isLoggedIn} />  {/* Chat doar dacă e logat */}
    </div>
  );
};
```

**Concept important — secțiuni (`sections/`):**
O pagină complexă se împarte în secțiuni separate. Fiecare secțiune are propriul fișier `.tsx` + `.css`. Asta face codul mai ușor de citit și de modificat.

---

### SignIn + SignUp (`src/pages/SignIn/`, `src/pages/SignUp/`)

**Layout:** Navbar + fundal animat gradient + card centrat cu formular

**Fundalul animat — cum funcționează:**

```tsx
// În SignIn.tsx — elemente HTML goale care sunt animate cu CSS
<div className="signin-page__bg-shapes">
  <div className="signin-page__shape signin-page__shape--1" />
  <div className="signin-page__shape signin-page__shape--2" />
  <div className="signin-page__shape signin-page__shape--3" />
  <div className="signin-page__shape signin-page__shape--4" />
  <div className="signin-page__shape signin-page__shape--5" />
</div>
```

```css
/* Fiecare formă este un cerc cu blur */
.signin-page__shape {
  position: absolute;         /* Poziționate absolut (plutesc liber) */
  border-radius: 50%;         /* Formă de cerc */
  filter: blur(80px);         /* Blur puternic — efect de lumină difuză */
  opacity: 0.35;              /* Semi-transparent */
}

/* Forma 1 — cerc mare verde olive, stânga sus */
.signin-page__shape--1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #8a9a6a, #6b7a4e);
  top: -100px;
  left: -100px;
  animation: authFloat1 20s ease-in-out infinite;  /* Se mișcă la infinit */
}
```

**State management în formulare:**
```tsx
const [showPassword, setShowPassword] = useState(false);

// useState(false) — creează un state cu valoarea inițială false
// showPassword — valoarea curentă
// setShowPassword — funcția care schimbă valoarea

// Folosire:
<input type={showPassword ? 'text' : 'password'} />
<span onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
</span>
```

---

### Settings (`src/pages/Settings/`)

**Layout:** Navbar + Sidebar (stânga) + Conținut dinamic (dreapta)

**Cum funcționează comutarea secțiunilor:**

```tsx
const Settings = () => {
  // State-ul decide ce secțiune se afișează
  const [activeSection, setActiveSection] = useState<SettingsSection>('edit-profile');

  // Funcția care returnează componenta corespunzătoare
  const renderSection = () => {
    switch (activeSection) {
      case 'edit-profile':  return <EditProfile />;
      case 'notification':  return <NotificationList />;
      case 'security':      return <SecuritySettings />;
      case 'help':          return <HelpFaq />;
    }
  };

  return (
    <div className="settings-page">
      <Navbar isLoggedIn={true} showNavLinks={false} />
      <div className="settings-page__content">
        {/* Sidebar-ul trimite funcția setActiveSection ca prop */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}   {/* ← La click, schimbă state-ul */}
        />
        <main>{renderSection()}</main>         {/* ← Afișează secțiunea activă */}
      </div>
    </div>
  );
};
```

**Fluxul:**
1. Utilizatorul face click pe "Notification" în sidebar
2. Sidebar-ul apelează `onSectionChange('notification')`
3. `onSectionChange` este de fapt `setActiveSection` → state-ul devine `'notification'`
4. React re-randează → `renderSection()` returnează `<NotificationList />`
5. Secțiunea se schimbă instant (fără reload, fără request)

---

### Secțiunile Settings — detaliat

#### EditProfile
- **Formular:** Name, Email (cu iconița de verificare), Contact Number
- **Avatar:** Cerc cu placeholder sau imagine + link "Edit profile photo"
- **State:** `useState<UserProfile>` — obiect cu toate câmpurile
- **Handler:** `handleChange(field, value)` — actualizează un câmp specific

#### NotificationList
- **useEffect:** Încarcă notificările din API la montare
- **Filtrare:** `searchTerm` filtrează notificările în timp real
- **Badge-uri:** `urgent` (roșu), `warning` (galben) — afișate pe baza `notif.type`

#### SecuritySettings
- **4 secțiuni:** Parolă, Documente identitate, 2FA, Sesiuni active
- **Toggle 2FA:** Buton custom CSS (nu librărie) cu animație pe knob
- **Parole:** 3 câmpuri separate, fiecare cu propriul toggle vizibilitate

#### HelpFaq
- **Accordion:** Click pe întrebare deschide/închide răspunsul
- **Categorii:** Butoane filter (Toate, Documente, Cont, Securitate, Suport)
- **Căutare:** Filtrează simultan după întrebare ȘI răspuns

---

## 10. Modelele TypeScript — tipuri de date

Fișierul `src/models/settingsTypes.ts` definește toate structurile de date:

```tsx
// Tipul literal — poate fi DOAR una din aceste valori
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type SettingsSection = 'edit-profile' | 'notification' | 'security' | 'help';

// Interfața — definește forma unui obiect
export interface UserProfile {
  name: string;
  email: string;
  contactNumber: string;
  avatarUrl?: string;     // "?" = câmp opțional (poate fi undefined)
}

// Interfața cu câmp enum-like
export interface Notification {
  id: string;
  type: 'urgent' | 'info' | 'warning';  // Doar 3 valori posibile
  isRead: boolean;
  // ... alte câmpuri
}
```

**De ce contează:**
```tsx
// TypeScript te oprește de la erori:
const notif: Notification = {
  type: 'critical',  // ❌ EROARE: 'critical' nu e 'urgent' | 'info' | 'warning'
};

const profile: UserProfile = {};  // ❌ EROARE: lipsesc câmpurile obligatorii
```

---

## 11. API-urile — comunicarea cu backend-ul

### Structura unui fișier API

```tsx
// 1. Importăm tipurile
import type { Notification } from '../models/settingsTypes';

// 2. Date mock (simulare) pentru dezvoltare
const mockNotifications: Notification[] = [
  { id: '1', title: 'Document procesat', message: '...', ... },
];

// 3. Funcția API (async — returnează un Promise)
export const fetchNotifications = async (): Promise<Notification[]> => {
  // ACUM: returnează date mock
  return mockNotifications;

  // VIITOR: va fi înlocuit cu:
  // const response = await fetch('/api/notifications');
  // return await response.json();
};
```

### Cum se consumă API-ul din componente:

```tsx
const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // useEffect cu [] se execută O SINGURĂ DATĂ la montarea componentei
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNotifications();  // Apelăm API-ul
      setNotifications(data);                    // Salvăm rezultatul în state
    };
    loadData();
  }, []);  // [] = dependency array gol = rulează doar la mount

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
};
```

**Concepte cheie:**
- `async/await` — modul modern de a lucra cu operații asincrone
- `useEffect` — hook React care execută cod la montare sau la schimbare de dependențe
- `useState` — hook React care creează un state reactiv (React re-randează la schimbare)

---

## 12. Animațiile — cum funcționează

### Animații de tranziție între pagini (`index.css`)

```css
/* Definim animația cu @keyframes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }   /* Starea inițială */
  to { opacity: 1; transform: translateY(0); }         /* Starea finală */
}

/* O aplicăm pe o clasă */
.signin-card {
  animation: scaleIn 0.5s ease forwards;
  /* scaleIn = numele animației
     0.5s = durata
     ease = curba de accelerare (pornește lent, accelerează, încetinește)
     forwards = rămâne la starea finală */
}
```

### Animații fundal auth (SignIn/SignUp)

**3 tipuri de animații simultane:**

1. **Gradient shift** — fundalul își schimbă gradientul lent:
```css
.signin-page {
  background: linear-gradient(135deg, #0d1b2a, #1b2a4a, #162d3e, #0a1628);
  background-size: 400% 400%;               /* Gradient 4x mai mare decât viewport-ul */
  animation: authGradientShift 15s ease infinite;  /* Se mișcă la infinit */
}

@keyframes authGradientShift {
  0%   { background-position: 0% 50%; }      /* Stânga */
  50%  { background-position: 100% 50%; }     /* Dreapta */
  100% { background-position: 0% 50%; }       /* Înapoi la stânga */
}
```

2. **Forme plutitoare** — cercuri cu blur care se mișcă:
```css
.signin-page__shape--1 {
  filter: blur(80px);          /* Blur puternic = efect de lumină */
  animation: authFloat1 20s ease-in-out infinite;  /* Plutire 20 secunde ciclu */
}

@keyframes authFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }       /* Poziția inițială */
  25% { transform: translate(60px, 40px) scale(1.1); }     /* Se mișcă + crește */
  50% { transform: translate(30px, 80px) scale(0.95); }     /* Continuă + micșorare */
  75% { transform: translate(-20px, 40px) scale(1.05); }    /* Revine treptat */
}
```

3. **Glass effect pe card** — card semi-transparent:
```css
.signin-card {
  background: rgba(255, 255, 255, 0.95);    /* Alb 95% opac */
  backdrop-filter: blur(20px);               /* Blur pe ce e în spatele cardului */
  border: 1px solid rgba(255, 255, 255, 0.2);  /* Border subtil alb */
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);   /* Umbră puternică */
}
```

---

## 13. Convenții de cod

### Denumirea fișierelor

| Tip | Format | Exemplu |
|---|---|---|
| Componente | PascalCase | `Navbar.tsx`, `AlertToast.tsx` |
| Stiluri | Același nume ca componenta | `Navbar.css`, `AlertToast.css` |
| API | camelCase + "Api" | `settingsApi.ts`, `notificationsApi.ts` |
| Modele | camelCase + "Types" | `settingsTypes.ts` |
| Pagini | PascalCase | `SignIn.tsx`, `Settings.tsx` |
| Secțiuni | PascalCase | `EditProfile.tsx`, `HelpFaq.tsx` |

### Structura unei componente TSX

```tsx
/* ============================================
   COMENTARIU HEADER — ce face componenta
   ============================================ */

// 1. Importuri React
import { useState, useEffect } from 'react';

// 2. Importuri navigare
import { useNavigate } from 'react-router-dom';

// 3. Importuri iconițe/librării externe
import SomeIcon from '@mui/icons-material/SomeIcon';

// 4. Importuri interne (tipuri, API, componente)
import type { SomeType } from '../../models/someTypes';
import { someApiCall } from '../../api/someApi';

// 5. Importuri stiluri
import './ComponentName.css';

// 6. Interfața props-urilor
interface ComponentNameProps {
  someProp: string;
}

// 7. Componenta
const ComponentName = ({ someProp }: ComponentNameProps) => {
  // 7a. Hooks (useState, useEffect, useNavigate)
  const [state, setState] = useState('');
  const navigate = useNavigate();

  // 7b. Funcții handler
  const handleClick = () => { ... };

  // 7c. useEffect (dacă e necesar)
  useEffect(() => { ... }, []);

  // 7d. Return JSX
  return (
    <div className="component-name">
      ...
    </div>
  );
};

// 8. Export
export default ComponentName;
```

### Reguli CSS

```css
/* 1. Header cu explicație */
/* ============================================
   COMPONENT NAME - Descriere scurtă
   ============================================ */

/* 2. Fiecare selector are un comentariu */
/* --- Descriere element --- */
.component-name__element {
  /* Proprietăți ordonate logic:
     1. Display/Position
     2. Dimensiuni
     3. Spacing (margin/padding)
     4. Culori/Background
     5. Font/Text
     6. Border/Shadow
     7. Transitions/Animations
  */
}
```

---

## 14. Fluxul complet: de la click la ecran

**Scenariul:** Utilizatorul e pe Home logat și face click pe avatar.

```
1. Click pe avatar (Navbar.tsx)
   └── onClick={() => navigate('/settings')}

2. React Router detectează schimbarea URL-ului
   └── URL devine: /settings

3. App.tsx re-randează Routes
   └── <Route path="/settings" element={<Settings />} />
   └── React montează componenta <Settings />

4. Settings.tsx se montează
   ├── useState('edit-profile') → secțiunea activă = Edit Profile
   ├── Randează <Navbar isLoggedIn={true} showNavLinks={false} />
   ├── Randează <SettingsSidebar activeSection="edit-profile" />
   └── Randează <EditProfile /> (din renderSection())

5. Utilizatorul face click pe "Notification" în sidebar
   ├── onClick → onSectionChange('notification')
   ├── setActiveSection('notification') → state-ul se schimbă
   ├── React re-randează Settings
   └── renderSection() returnează <NotificationList />

6. NotificationList se montează
   ├── useEffect → fetchNotifications() → primește date mock
   ├── setNotifications(data) → state-ul se actualizează
   └── React randează lista de carduri cu .map()
```

---

## 15. Foldere pregătite pentru viitor

Aceste foldere sunt goale (conțin doar `.gitkeep`) dar au un scop planificat:

| Folder | Ce va conține | Când |
|---|---|---|
| `context/` | React Context pentru state global (user logat, temă) | La implementarea autentificării |
| `store/` | State management avansat (Redux sau Zustand) | Când aplicația crește |
| `hooks/` | Custom hooks (useAuth, useNotifications, useForm) | La refactorizare |
| `services/` | Logica de business (procesare date, calcule) | La conectarea cu backend |
| `middleware/` | Interceptori HTTP (adaugă token la requesturi) | La autentificare |
| `config/` | URL-uri API, setări de mediu (dev/prod) | La deploy |
| `constants/` | Enums, roluri utilizator, statusuri documente | La business logic |
| `types/` | Tipuri TypeScript globale (shared între module) | Când cresc modelele |
| `utils/` | Funcții utilitare (formatare dată, validare email) | La nevoie |
| `validation/` | Schema de validare formulare (Zod/Yup) | La validare formular |
| `routes/` | Configurare rute avansată (protected routes, lazy loading) | La autentificare |
| `layouts/` | Layout-uri partajate (AuthLayout, DashboardLayout) | La refactorizare |

---

## Glosar de termeni

| Termen | Ce înseamnă |
|---|---|
| **Component** | O funcție React care returnează JSX (HTML-like) |
| **Props** | Proprietăți trimise de la componentă părinte la componentă copil |
| **State** | Date interne ale unei componente care, când se schimbă, provoacă re-render |
| **Hook** | Funcție specială React (useState, useEffect, useNavigate) — mereu începe cu `use` |
| **JSX** | Syntax care arată ca HTML dar e JavaScript (compilat de Vite) |
| **SPA** | Single Page Application — o singură pagină HTML, conținut schimbat dinamic |
| **Route** | O legătură între un URL și o componentă |
| **Mount** | Momentul când o componentă apare prima dată în DOM |
| **Unmount** | Momentul când o componentă dispare din DOM |
| **Re-render** | React re-execută funcția componentei și actualizează DOM-ul |
| **BEM** | Block Element Modifier — convenție de denumire clase CSS |
| **CSS Variable** | Valoare reutilizabilă definită cu `--` și folosită cu `var()` |
| **Mock data** | Date false folosite pentru test în loc de date reale de la server |

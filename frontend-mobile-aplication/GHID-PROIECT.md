# Ghid Explicativ — Aplicatie Mobila React Native cu Expo

## Cuprins

1. [Ce Tehnologii Folosim si De Ce](#1-ce-tehnologii-folosim-si-de-ce)
2. [Structura Proiectului](#2-structura-proiectului)
3. [Cum Functioneaza Rutarea (Navigarea)](#3-cum-functioneaza-rutarea-navigarea)
4. [Sistemul de Autentificare — Pas cu Pas](#4-sistemul-de-autentificare--pas-cu-pas)
5. [Validarea Datelor cu Zod](#5-validarea-datelor-cu-zod)
6. [Formulare cu React Hook Form](#6-formulare-cu-react-hook-form)
7. [Stocarea Securizata a Token-ului](#7-stocarea-securizata-a-token-ului)
8. [Context si Hook-uri Personalizate](#8-context-si-hook-uri-personalizate)
9. [Componente UI Reutilizabile](#9-componente-ui-reutilizabile)
10. [Animatii cu Reanimated](#10-animatii-cu-reanimated)
11. [Bara de Navigare Personalizata](#11-bara-de-navigare-personalizata)
12. [Compatibilitate Web + Native](#12-compatibilitate-web--native)
13. [Fluxul Complet al Aplicatiei](#13-fluxul-complet-al-aplicatiei)
14. [Diagrama Arhitecturii](#14-diagrama-arhitecturii)
15. [Glosar de Termeni](#15-glosar-de-termeni)

---

## 1. Ce Tehnologii Folosim si De Ce

### React Native
React Native ne permite sa scriem **o singura baza de cod** in JavaScript/TypeScript care ruleaza pe **iOS, Android si Web**. In loc sa scriem 3 aplicatii separate (Swift pentru iOS, Kotlin pentru Android, HTML/JS pentru web), scriem totul o singura data.

### Expo
Expo este un **framework** construit deasupra React Native care simplifica totul:
- Nu trebuie sa configurezi Xcode sau Android Studio manual
- Vine cu librarii pre-configurate (camera, stocare, haptics, blur etc.)
- `expo start` porneste aplicatia instant pe telefon, emulator sau browser

### TypeScript
TypeScript este JavaScript cu **tipuri**. In loc sa scrii:
```javascript
function aduna(a, b) { return a + b; }
```
Scrii:
```typescript
function aduna(a: number, b: number): number { return a + b; }
```
Avantajul: editorul iti arata erori **inainte** sa rulezi codul. Daca incerci `aduna("text", 5)`, TypeScript iti spune ca e gresit.

### Expo Router
Expo Router implementeaza **rutare bazata pe fisiere** (file-based routing). Asta inseamna ca **structura folderelor din `app/`** devine automat structura de navigare a aplicatiei:
```
app/
  (autentificare)/
    logare.tsx        →  /logare
    inregistrare.tsx  →  /inregistrare
  (taburi)/
    index.tsx         →  /  (pagina principala)
    profil.tsx        →  /profil
```

Nu trebuie sa configurezi rute manual — le creezi pur si simplu ca fisiere.

### Zod
Librarie de **validare a datelor**. Definesti o schema (un set de reguli) si Zod verifica automat daca datele introduse de utilizator respecta acele reguli.

### React Hook Form
Librarie pentru **gestionarea formularelor**. Tine evidenta valorilor campurilor, a erorilor, si a starii de submit — fara sa rescrii logica de la zero de fiecare data.

---

## 2. Structura Proiectului

```
frontend-mobile-aplication/
│
├── app/                          # ECRANE (pagini vizibile utilizatorului)
│   ├── _layout.tsx               # Layout-ul PRINCIPAL - wrap totul in AuthProvider
│   ├── (autentificare)/          # Grup de ecrane pentru auth
│   │   ├── _layout.tsx           # Layout pentru ecranele de auth (Stack)
│   │   ├── logare.tsx            # Ecranul de logare
│   │   └── inregistrare.tsx      # Ecranul de inregistrare
│   └── (taburi)/                 # Grup de ecrane cu tab-uri
│       ├── _layout.tsx           # Layout cu bara de navigare (Tabs)
│       ├── index.tsx             # Pagina principala (Home)
│       ├── meniu.tsx             # Pagina Meniu
│       ├── creare.tsx            # Pagina Creare Document
│       ├── notificari.tsx        # Pagina Notificari
│       └── profil.tsx            # Pagina Profil (cu buton delogare)
│
├── components/                   # COMPONENTE REUTILIZABILE
│   ├── autentificare/            # Componente specifice auth
│   │   ├── formular-logare/
│   │   │   ├── index.tsx         # UI-ul formularului de logare
│   │   │   ├── styles.ts         # Stilurile formularului
│   │   │   └── use-formular-logare.ts  # Hook-ul cu logica
│   │   └── formular-inregistrare/
│   │       ├── index.tsx         # UI-ul formularului de inregistrare
│   │       ├── styles.ts         # Stilurile formularului
│   │       └── use-formular-inregistrare.ts  # Hook-ul cu logica
│   ├── ui/                       # Componente UI generice
│   │   ├── buton/                # Buton reutilizabil
│   │   ├── camp-formular/        # Camp de input cu iconita si eroare
│   │   └── captcha-checkbox/     # Checkbox "Nu sunt robot"
│   ├── acasa/                    # Componente pentru pagina Home
│   ├── bara-navigare/            # Bara de navigare personalizata
│   └── sectiune-animata.tsx      # Componenta de animatie
│
├── contexts/                     # CONTEXT-URI REACT
│   └── context-autentificare.tsx # Furnizorul de autentificare
│
├── hooks/                        # HOOK-URI PERSONALIZATE
│   └── use-autentificare.ts      # Scurtatura catre contextul de auth
│
├── lib/                          # LOGICA DE BUSINESS
│   ├── api/                      # Comunicare cu serverul
│   │   ├── client-api.ts         # Functia generica de cereri HTTP
│   │   └── serviciu-autentificare.ts  # Endpoint-uri auth (mock)
│   ├── stocare/                  # Stocare locala
│   │   └── stocare-securizata.ts # Wrapper SecureStore / localStorage
│   └── validari/                 # Scheme de validare Zod
│       └── autentificare.ts      # Regulile pentru logare/inregistrare
│
├── types/                        # TIPURI TYPESCRIPT
│   ├── utilizator.ts             # Interfata Utilizator
│   └── autentificare.ts          # Interfete auth (DateLogare, etc.)
│
├── constants/                    # CONSTANTE
│   └── culori.ts                 # Paleta de culori a aplicatiei
│
└── package.json                  # Dependinte si scripturi
```

### Principiul din spatele structurii: Separarea Responsabilitatilor

Fiecare folder are **o singura responsabilitate**:
- `app/` = **CE ecrane exista** (cat mai putin cod, doar importa componente)
- `components/` = **CUM arata** lucrurile (UI)
- `hooks/` = **LOGICA** componentelor
- `lib/` = **LOGICA DE BUSINESS** (API, validari, stocare)
- `types/` = **CE forma au datele**
- `contexts/` = **STARE GLOBALA** (date partajate intre componente)

### Principiul din spatele componentelor: Folder cu 3 fisiere

Fiecare componenta complexa are propriul folder cu 3 fisiere:
```
formular-logare/
  ├── index.tsx              # UI — ce vede utilizatorul
  ├── styles.ts              # Stiluri — cum arata
  └── use-formular-logare.ts # Hook — logica si date
```

**De ce?**
- **Lizibilitate**: Deschizi `index.tsx` si vezi doar structura vizuala, fara logica
- **Reutilizare**: Hook-ul poate fi reutilizat in alt context
- **Testare**: Poti testa logica (hook) separat de UI
- **Colaborare**: Un coleg lucreaza pe stiluri, altul pe logica

---

## 3. Cum Functioneaza Rutarea (Navigarea)

### Layout-ul Principal (`app/_layout.tsx`)

Acesta este **punctul de intrare** al intregii aplicatii. Tot ce se afiseaza trece prin acest fisier.

```typescript
// app/_layout.tsx
export default function LayoutPrincipal() {
  return (
    <FurnizorAutentificare>        {/* 1. Furnizeaza datele de auth */}
      <ProtectieRute>              {/* 2. Verifica daca esti logat */}
        <Stack>                    {/* 3. Navigare de tip "stiva" */}
          <Stack.Screen name="(autentificare)" />
          <Stack.Screen name="(taburi)" />
        </Stack>
      </ProtectieRute>
      <StatusBar style="auto" />
    </FurnizorAutentificare>
  );
}
```

**Cum functioneaza pe pasi:**

1. `FurnizorAutentificare` — un "wrapper" care face datele de auth (utilizator, logare, delogare) disponibile in TOATA aplicatia
2. `ProtectieRute` — un component care verifica starea de autentificare si redirectioneaza automat
3. `Stack` — un navigator de tip "stiva" care afiseaza fie ecranele de auth, fie tab-urile

### Protectia Rutelor

```typescript
function ProtectieRute({ children }) {
  const { esteAutentificat, seIncarca } = useAutentificare();
  const segmente = useSegments(); // ["(autentificare)", "logare"] sau ["(taburi)"]
  const router = useRouter();

  useEffect(() => {
    if (seIncarca) return; // Asteapta pana se verifica tokenul

    const peEcranAuth = segmente[0] === '(autentificare)';

    if (!esteAutentificat && !peEcranAuth) {
      // Nu esti logat si incerci sa vezi tab-uri → du-te la logare
      router.replace('/(autentificare)/logare');
    } else if (esteAutentificat && peEcranAuth) {
      // Esti logat dar esti pe ecranul de logare → du-te la Home
      router.replace('/(taburi)');
    }
  }, [esteAutentificat, seIncarca, segmente]);
  // ...
}
```

**Explicatie:**
- `useSegments()` returneaza un array cu segmentele URL-ului curent. De exemplu, daca esti pe pagina de logare, returneaza `["(autentificare)", "logare"]`
- `useRouter()` iti da acces la functii de navigare (`replace`, `push`, `back`)
- `useEffect` ruleaza de fiecare data cand se schimba starea de autentificare sau ecranul curent
- `router.replace()` inlocuieste ecranul curent (nu adauga in istoric, deci nu poti da "Back")

### Grupuri de Rute — Paranteze Rotunde `()`

Folderele cu paranteze `(autentificare)` si `(taburi)` sunt **grupuri de rute**. Ele:
- NU apar in URL (nu vei vedea `/autentificare/logare`, ci doar `/logare`)
- Servesc doar ca **organizare logica** — grupeaza ecranele care impart acelasi layout
- Au propriul `_layout.tsx` care defineste cum se navigheaza in cadrul grupului

### Stack vs Tabs

```
Stack (stiva):    Ecranele se pun una peste alta, ca niste carti
                  Poti da "Back" pentru a te intoarce
                  Folosit pentru: auth flow (logare → inregistrare → inapoi)

Tabs (tab-uri):   Ecranele sunt una langa alta, selectezi cu bara de jos
                  Nu ai "Back", ai butoane de tab
                  Folosit pentru: navigarea principala (Home, Meniu, Profil)
```

---

## 4. Sistemul de Autentificare — Pas cu Pas

### Pasul 1: Tipuri TypeScript — Definim forma datelor

Inainte de a scrie orice logica, definim **ce forma au datele** cu care lucram.

```typescript
// types/utilizator.ts
export interface Utilizator {
  id: string;
  numeUtilizator: string;
  email: string;
  telefon?: string;   // ? = optional, poate sa lipseasca
}
```

```typescript
// types/autentificare.ts
export interface DateLogare {
  numeUtilizator: string;
  parola: string;
}

export interface DateInregistrare {
  numeUtilizator: string;
  parola: string;
  email: string;
  telefon: string;
  captchaValidat: boolean;
}

export interface RaspunsAutentificare {
  utilizator: Utilizator;
  token: string;          // JWT token primit de la server
}
```

**De ce folosim interfete?**
- Daca incerci sa accesezi `utilizator.adresa` (care nu exista), TypeScript iti arata eroare inainte sa rulezi codul
- Toate componentele stiu exact ce campuri primesc si ce campuri trimit

### Pasul 2: API Layer — Comunicarea cu serverul

```typescript
// lib/api/client-api.ts
export async function cerereApi<T>(cale: string, optiuni = {}): Promise<T> {
  const { metoda = 'GET', corp, token } = optiuni;

  const headere = { 'Content-Type': 'application/json' };
  if (token) headere['Authorization'] = `Bearer ${token}`;

  const raspuns = await fetch(`${URL_BAZA}${cale}`, {
    method: metoda,
    headers: headere,
    body: corp ? JSON.stringify(corp) : undefined,
  });

  if (!raspuns.ok) throw new Error('Eroare la comunicarea cu serverul');
  return raspuns.json();
}
```

**Explicatie linie cu linie:**
- `async function` — functie asincrona (nu blocheaza UI-ul cat asteapta raspunsul)
- `<T>` — **generic** — T este un placeholder pentru tipul de date pe care il asteptam inapoi. La apelare, specificam ce tip primim: `cerereApi<Utilizator>(...)` inseamna ca raspunsul va fi de tip `Utilizator`
- `fetch()` — functia nativa de browser/React Native pentru cereri HTTP
- `Bearer ${token}` — standard de autentificare: trimitem token-ul JWT in header-ul `Authorization`
- `JSON.stringify(corp)` — converteste obiectul JavaScript in string JSON pentru a-l trimite la server

```typescript
// lib/api/serviciu-autentificare.ts
export async function logareApi(date: DateLogare): Promise<RaspunsAutentificare> {
  // MOCK — simuleaza un raspuns de la server
  // In productie, ar fi: return cerereApi('/auth/login', { metoda: 'POST', corp: date });
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simuleaza 1 sec asteptare

  return {
    utilizator: { id: '1', numeUtilizator: date.numeUtilizator, email: 'user@example.com' },
    token: 'mock_jwt_token_' + Date.now(),
  };
}
```

**De ce mock?** Inca nu avem backend. Functia simuleaza un raspuns de la server cu un delay de 1 secunda (ca sa vedem loading-ul). Cand va exista backend-ul, inlocuim cu `cerereApi()`.

### Pasul 3: Stocare Securizata — Persistarea sesiunii

```typescript
// lib/stocare/stocare-securizata.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHEIE_TOKEN = 'token_autentificare';
const esteWeb = Platform.OS === 'web';

export async function salveazaToken(token: string): Promise<void> {
  if (esteWeb) {
    localStorage.setItem(CHEIE_TOKEN, token);  // Web: localStorage (necriptat)
  } else {
    await SecureStore.setItemAsync(CHEIE_TOKEN, token); // Native: criptat pe dispozitiv
  }
}

export async function citesteToken(): Promise<string | null> {
  if (esteWeb) return localStorage.getItem(CHEIE_TOKEN);
  return await SecureStore.getItemAsync(CHEIE_TOKEN);
}

export async function stergeToken(): Promise<void> {
  if (esteWeb) localStorage.removeItem(CHEIE_TOKEN);
  else await SecureStore.deleteItemAsync(CHEIE_TOKEN);
}
```

**De ce verificam platforma?**
- `expo-secure-store` foloseste **Keychain** (iOS) si **EncryptedSharedPreferences** (Android) — stocare criptata la nivel de sistem de operare
- Pe **web**, aceste API-uri nu exista, asa ca folosim `localStorage` ca fallback
- `Platform.OS` returneaza `'ios'`, `'android'` sau `'web'` — ne permite sa scriem cod specific pentru fiecare platforma

### Pasul 4: Context-ul de Autentificare — Starea globala

**Problema:** Multe componente au nevoie de date despre utilizator (Header-ul arata numele, Profil-ul arata emailul, ProtectieRute verifica daca esti logat). Cum le dam aceste date fara sa le transmitem prin fiecare componenta intermediara?

**Solutia:** React Context — un "canal de date" care traverseaza intregul arbore de componente.

```typescript
// contexts/context-autentificare.tsx

// 1. Definim CE date si functii va furniza contextul
interface ValoareContextAutentificare {
  utilizator: Utilizator | null;        // Datele utilizatorului sau null daca nu e logat
  esteAutentificat: boolean;            // Scurtatura: true daca utilizator !== null
  seIncarca: boolean;                   // true cat timp verificam tokenul salvat
  logare: (date: DateLogare) => Promise<void>;
  inregistrare: (date) => Promise<string>;
  delogare: () => Promise<void>;
}

// 2. Cream contextul cu valori implicite
export const ContextAutentificare = createContext<ValoareContextAutentificare>({
  utilizator: null,
  esteAutentificat: false,
  seIncarca: true,
  logare: async () => {},
  inregistrare: async () => '',
  delogare: async () => {},
});

// 3. Cream furnizorul — componenta care FURNIZEAZA datele
export function FurnizorAutentificare({ children }) {
  const [utilizator, setUtilizator] = useState<Utilizator | null>(null);
  const [seIncarca, setSeIncarca] = useState(true);

  // La pornirea aplicatiei, verificam daca exista un token salvat
  useEffect(() => {
    verificaTokenSalvat();
  }, []);

  async function verificaTokenSalvat() {
    try {
      const token = await citesteToken();
      if (token) {
        // Token exista → utilizatorul era logat anterior
        setUtilizator({ id: '1', numeUtilizator: 'Utilizator', email: 'user@example.com' });
      }
    } catch {
      await stergeToken(); // Token corupt → il stergem
    } finally {
      setSeIncarca(false); // Am terminat verificarea, indiferent de rezultat
    }
  }

  // Functia de logare: apeleaza API → salveaza token → seteaza utilizatorul
  const logare = useCallback(async (date: DateLogare) => {
    const raspuns = await logareApi(date);
    await salveazaToken(raspuns.token);
    setUtilizator(raspuns.utilizator);
  }, []);

  // Functia de delogare: sterge token → seteaza utilizatorul la null
  const delogare = useCallback(async () => {
    await stergeToken();
    setUtilizator(null);
  }, []);

  // 4. Furnizam toate datele si functiile catre copii
  return (
    <ContextAutentificare.Provider
      value={{ utilizator, esteAutentificat: !!utilizator, seIncarca, logare, inregistrare, delogare }}>
      {children}
    </ContextAutentificare.Provider>
  );
}
```

**Flux vizual:**
```
FurnizorAutentificare
  │
  ├── furnizeaza: { utilizator, logare, delogare, ... }
  │
  └── copii (TOATA aplicatia) pot accesa aceste date cu useAutentificare()
        │
        ├── ProtectieRute  → citeste esteAutentificat
        ├── EcranProfil    → citeste utilizator, apeleaza delogare
        └── FormularLogare → apeleaza logare
```

### Pasul 5: Hook-ul personalizat

```typescript
// hooks/use-autentificare.ts
export function useAutentificare() {
  const context = useContext(ContextAutentificare);
  if (!context) {
    throw new Error('useAutentificare trebuie folosit in interiorul FurnizorAutentificare');
  }
  return context;
}
```

**De ce un hook separat in loc de `useContext(ContextAutentificare)` direct?**
1. **Mai scurt** — scrii `useAutentificare()` in loc de `useContext(ContextAutentificare)`
2. **Eroare clara** — daca uiti sa pui `FurnizorAutentificare` in arborele de componente, primesti un mesaj clar in loc de `undefined`
3. **Encapsulare** — daca schimbi implementarea (de ex. treci de la Context la Zustand), schimbi doar acest fisier

---

## 5. Validarea Datelor cu Zod

### Ce este o schema Zod?

O schema este un **set de reguli** care descrie cum trebuie sa arate datele valide.

```typescript
// lib/validari/autentificare.ts
import { z } from 'zod';

export const schemaLogare = z.object({
  numeUtilizator: z
    .string()                                           // Trebuie sa fie text
    .min(1, 'Username-ul este obligatoriu')              // Minimum 1 caracter (nu gol)
    .min(3, 'Username-ul trebuie sa aiba minim 3 caractere'), // Minimum 3 caractere
  parola: z
    .string()
    .min(1, 'Parola este obligatorie')
    .min(6, 'Parola trebuie sa aiba minim 6 caractere'),
});
```

**Cum se citeste:** "Un obiect care are campul `numeUtilizator` (string, minim 3 caractere) si campul `parola` (string, minim 6 caractere)."

### Schema de inregistrare (mai complexa)

```typescript
export const schemaInregistrare = z.object({
  numeUtilizator: z.string().min(3, '...'),
  parola: z.string().min(6, '...'),
  email: z.string().min(1, '...').email('Adresa de email nu este valida'),
  telefon: z.string().regex(/^\+?[0-9]{7,15}$/, 'Numarul de telefon nu este valid'),
  captchaValidat: z.boolean().refine((val) => val === true, 'Confirma ca nu esti robot'),
});
```

**Validari speciale:**
- `.email()` — verifica automat formatul email (contine `@` si domeniu)
- `.regex()` — verifica cu o expresie regulata: `^\+?[0-9]{7,15}$` inseamna "optional `+`, urmat de 7-15 cifre"
- `.refine()` — validare personalizata: `captchaValidat` trebuie sa fie exact `true`

### Extragerea tipului din schema

```typescript
export type TipSchemaLogare = z.infer<typeof schemaLogare>;
// Echivalent cu:
// type TipSchemaLogare = { numeUtilizator: string; parola: string; }
```

`z.infer<typeof schema>` genereaza automat tipul TypeScript din schema Zod. Astfel **nu scrii tipul de doua ori** — schema defineste si regulile SI tipul.

---

## 6. Formulare cu React Hook Form

### De ce React Hook Form?

Fara librarie, gestionarea unui formular cu 4 campuri ar insemna:
- 4x `useState` pentru valori
- 4x `useState` pentru erori
- 1x `useState` pentru loading
- Validare manuala la submit
- ~100 linii de cod boilerplate

Cu React Hook Form + Zod: ~20 linii.

### Hook-ul formularului de logare

```typescript
// components/autentificare/formular-logare/use-formular-logare.ts

export function useFormularLogare() {
  const { logare } = useAutentificare();        // Functia de logare din context
  const [seIncarca, setSeIncarca] = useState(false);

  const {
    control,                    // Obiect care "controleaza" campurile formularului
    handleSubmit,               // Functie care valideaza si apoi apeleaza callback-ul
    formState: { errors },      // Obiect cu erorile curente pe fiecare camp
  } = useForm<TipSchemaLogare>({
    resolver: zodResolver(schemaLogare),  // Conecteaza Zod la React Hook Form
    defaultValues: {
      numeUtilizator: '',       // Valori initiale
      parola: '',
    },
  });

  // Functia apelata dupa validare reusita
  const laTrimitere = async (date: TipSchemaLogare) => {
    setSeIncarca(true);
    try {
      await logare(date);       // Apeleaza logarea din context
    } catch {
      Alert.alert('Eroare', 'Logarea a esuat.');
    } finally {
      setSeIncarca(false);      // finally ruleaza mereu, fie succes, fie eroare
    }
  };

  return {
    control,                              // Il dam catre UI pentru Controller
    errors,                               // Il dam catre UI pentru mesajele de eroare
    seIncarca,                            // Il dam catre UI pentru starea butonului
    trimite: handleSubmit(laTrimitere),   // handleSubmit VALIDEAZA inainte de laTrimitere
  };
}
```

**Fluxul la apasarea butonului "Sign in":**
```
1. Utilizatorul apasa "Sign in"
2. Se apeleaza `trimite` (care e handleSubmit(laTrimitere))
3. handleSubmit VALIDEAZA datele cu schema Zod
   ├── Daca VALID   → apeleaza laTrimitere(date)
   │                    └── logare(date) → API → salveaza token → seteaza utilizator
   │                                                                 └── ProtectieRute detecteaza → redirect la (taburi)
   └── Daca INVALID → seteaza errors → UI afiseaza mesajele de eroare sub campuri
```

### Controller — legatura intre hook si UI

```tsx
// In componenta UI (index.tsx)
<Controller
  control={control}           // Obiectul de control din useForm
  name="numeUtilizator"       // Numele campului (trebuie sa coincida cu schema)
  render={({ field: { onChange, onBlur, value } }) => (
    <CampFormular
      placeholder="Username"
      value={value}            // Valoarea curenta a campului
      onChangeText={onChange}  // Se apeleaza cand utilizatorul scrie
      onBlur={onBlur}          // Se apeleaza cand paraseste campul
      eroare={errors.numeUtilizator?.message}  // Mesajul de eroare (sau undefined)
    />
  )}
/>
```

`Controller` este **puntea** intre React Hook Form si componentele React Native. El:
1. Primeste `control` si `name` — stie ce camp gestioneaza
2. Furnizeaza `value`, `onChange`, `onBlur` — valorile si functiile de update
3. UI-ul le conecteaza la componenta vizuala `CampFormular`

---

## 7. Stocarea Securizata a Token-ului

### Ce este un JWT Token?

**JWT** (JSON Web Token) este un string care dovedeste ca esti autentificat. Il primesti de la server la logare si il trimiti inapoi la fiecare cerere.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiaWF0IjoxNzA5MTIzNDU2fQ.abc123
```

Acest string contine 3 parti separate de `.`:
1. **Header** — algoritmul de criptare
2. **Payload** — datele (userId, expirare)
3. **Signature** — semnatura criptografica (dovedeste ca nu a fost modificat)

### De ce il stocam securizat?

Daca cineva obtine token-ul tau, se poate da drept tine. De aceea:
- Pe **iOS/Android** → `expo-secure-store` il cripteaza la nivel de OS (Keychain / EncryptedSharedPreferences)
- Pe **Web** → `localStorage` (necriptat, dar acceptabil pentru dezvoltare)

### Fluxul de persistenta

```
PRIMA DESCHIDERE A APLICATIEI:
1. FurnizorAutentificare se monteaza
2. useEffect → verificaTokenSalvat()
3. citesteToken() → null (nu exista token)
4. setSeIncarca(false) → ProtectieRute detecteaza !esteAutentificat → redirect la logare

DUPA LOGARE:
1. logare(date) → API raspunde cu token
2. salveazaToken(token) → salvat in SecureStore
3. setUtilizator(utilizator) → esteAutentificat devine true
4. ProtectieRute detecteaza → redirect la (taburi)

INCHIDERE SI REDESCHIDERE APLICATIE:
1. FurnizorAutentificare se monteaza
2. useEffect → verificaTokenSalvat()
3. citesteToken() → "mock_jwt_token_123" (exista!)
4. setUtilizator(dateMock) → esteAutentificat devine true
5. ProtectieRute detecteaza → redirect la (taburi)
→ Utilizatorul RAMANE LOGAT fara sa se re-autentifice!

DELOGARE:
1. delogare() → stergeToken() → localStorage/SecureStore gol
2. setUtilizator(null) → esteAutentificat devine false
3. ProtectieRute detecteaza → redirect la logare
```

---

## 8. Context si Hook-uri Personalizate

### Ce este React Context?

Imagineaza-ti ca ai un arbore de componente:

```
App
  └── Layout
        └── Taburi
              └── Profil (are nevoie de utilizator)
```

**Fara Context** — trebuie sa transmiti `utilizator` prin FIECARE componenta intermediara (Layout → Taburi → Profil), chiar daca Layout si Taburi nu au nevoie de el. Asta se numeste **prop drilling**.

**Cu Context** — definesti datele la nivel de `App`, si `Profil` le citeste direct, fara sa treaca prin intermediari.

### Anatomia unui Context

```
1. createContext()          → Creeaza "canalul"
2. Context.Provider         → Componenta care PUNE date in canal
3. useContext(Context)      → Hook-ul care CITESTE din canal
```

### Ce este un Hook personalizat?

Un hook personalizat este **o functie care incepe cu `use`** si poate folosi alte hook-uri React.

```typescript
// Hook personalizat simplu
function useContorApasari() {
  const [numar, setNumar] = useState(0);
  const incrementeaza = () => setNumar(n => n + 1);
  return { numar, incrementeaza };
}

// Folosire in componenta
function Buton() {
  const { numar, incrementeaza } = useContorApasari();
  return <Pressable onPress={incrementeaza}><Text>{numar}</Text></Pressable>;
}
```

**Regula de aur:** Hook-urile trebuie apelate:
- La nivelul TOP al componentei (nu in `if`, `for`, sau functii nested)
- Doar in componente React sau in alte hook-uri

### useCallback — de ce il folosim?

```typescript
const logare = useCallback(async (date: DateLogare) => {
  const raspuns = await logareApi(date);
  await salveazaToken(raspuns.token);
  setUtilizator(raspuns.utilizator);
}, []);
```

`useCallback` **memoreaza** functia — o creeaza o singura data si o reutilizeaza la fiecare render. Fara el, functia `logare` ar fi recreata la fiecare render, ceea ce ar putea cauza re-render-uri inutile in componentele copil.

---

## 9. Componente UI Reutilizabile

### CampFormular — Input cu iconita si erori

```typescript
// components/ui/camp-formular/index.tsx
interface ProprietatiCampFormular extends TextInputProps {
  iconita?: keyof typeof Ionicons.glyphMap;  // Numele iconitei (type-safe)
  eroare?: string;                            // Mesajul de eroare
}

export function CampFormular({ iconita, eroare, style, ...restProps }: ProprietatiCampFormular) {
  const [esteFocusat, setEsteFocusat] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[
        styles.containerInput,
        esteFocusat && styles.containerInputFocus,    // Bordura neagra cand e focusat
        eroare && styles.containerInputEroare,        // Bordura rosie cand e eroare
      ]}>
        {iconita && <Ionicons name={iconita} size={20} color={...} />}
        <TextInput
          placeholderTextColor={CuloriApp.textEstompat}
          onFocus={() => setEsteFocusat(true)}
          onBlur={() => setEsteFocusat(false)}
          {...restProps}           // Toate celelalte props (value, onChangeText, etc.)
        />
      </View>
      {eroare && <Text style={styles.textEroare}>{eroare}</Text>}
    </View>
  );
}
```

**Concepte cheie:**
- `extends TextInputProps` — mosteneste TOATE proprietatile unui `TextInput` nativ, plus adauga `iconita` si `eroare`
- `...restProps` — **spread operator** — transmite toate props-urile ramase catre `TextInput`. Daca cineva paseaza `autoCapitalize="none"`, acesta ajunge direct la `TextInput`
- `keyof typeof Ionicons.glyphMap` — TypeScript stie exact ce iconite exista, deci nu poti scrie `iconita="inexistenta"`

### Buton — Cu cerc si sageata

```typescript
// components/ui/buton/index.tsx
export function Buton({ text, laApasare, seIncarca = false, dezactivat = false }) {
  return (
    <Pressable
      onPress={laApasare}
      disabled={dezactivat || seIncarca}    // Dezactivat cand se incarca
      style={[styles.container, (seIncarca || dezactivat) && styles.containerSeIncarca]}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.cercIconita}>
        {seIncarca ? (
          <ActivityIndicator color="#FFFFFF" size="small" />  // Spinner
        ) : (
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />  // Sageata
        )}
      </View>
    </Pressable>
  );
}
```

**Pattern:** Butonul are doua stari vizuale:
- **Normal**: Text + cerc negru cu sageata alba
- **Loading**: Text + cerc negru cu spinner alb + opacitate redusa

### CaptchaCheckbox — Verificare "Nu sunt robot"

```typescript
// components/ui/captcha-checkbox/index.tsx
export function CaptchaCheckbox({ valoare, laSchimbare, eroare }) {
  const [seVerifica, setSeVerifica] = useState(false);
  const timpApasare = useRef<number>(0);

  const laApasare = () => {
    if (valoare || seVerifica) return;  // Deja validat sau in curs

    timpApasare.current = Date.now();   // Inregistreaza CAND a fost apasarea
    setSeVerifica(true);                // Afiseaza spinner-ul

    setTimeout(() => {
      const durataApasare = Date.now() - timpApasare.current;

      if (durataApasare < 500) {        // Sub 500ms = probabil bot
        setSeVerifica(false);           // Anuleaza
        return;
      }

      setSeVerifica(false);
      laSchimbare(true);                // Confirma validarea
    }, 2000);                           // Asteapta 2 secunde (simuleaza verificare)
  };
  // ... render checkbox cu 3 stari: gol, spinner, bifat verde
}
```

**Logica anti-bot simplificata:**
1. Utilizatorul apasa checkbox-ul
2. Se afiseaza un spinner (2 secunde)
3. Dupa 2 secunde, verificam: daca cumva a trecut sub 500ms din momentul apasarii, anulam (comportament suspect de bot)
4. Daca totul e OK, bifam verde si setam `captchaValidat = true` in formular

**`useRef` vs `useState`:**
- `useState` — cand valoarea se schimba, componenta se RE-RENDEREAZA
- `useRef` — stocheaza o valoare care NU cauzeaza re-render. Perfect pentru `timpApasare` — il stocam dar nu vrem sa re-desenam UI-ul cand se schimba.

---

## 10. Animatii cu Reanimated

### Ce este React Native Reanimated?

O librarie de animatii performanta care ruleaza pe **UI thread** (firul grafic), nu pe JS thread. Asta inseamna animatii la **60fps** fara sacadari.

### SectiuneAnimata — Componenta de animatie

```typescript
// components/sectiune-animata.tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

export function SectiuneAnimata({ children, intarziere = 0, stil }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(intarziere).duration(700).springify()}
      style={stil}>
      {children}
    </Animated.View>
  );
}
```

**Explicatie:**
- `Animated.View` — versiunea animata a `View` (componenta de baza pentru layout in React Native)
- `entering` — animatia care ruleaza cand componenta **apare pe ecran**
- `FadeInDown` — animatie predefinita: elementul "apare de jos in sus" cu fade
- `.delay(intarziere)` — asteapta X milisecunde inainte de a incepe
- `.duration(700)` — animatia dureaza 700ms
- `.springify()` — face miscarea sa arate ca un arc (bounce natural), nu liniar

### Folosire pe ecranul Home — efect cascada

```tsx
<SectiuneAnimata intarziere={0}>      {/* Apare prima */}
  <SectiuneAntet />
</SectiuneAnimata>

<SectiuneAnimata intarziere={100}>    {/* Apare dupa 100ms */}
  <BannerPrincipal />
</SectiuneAnimata>

<SectiuneAnimata intarziere={200}>    {/* Apare dupa 200ms */}
  <SectiuneDespreProiect />
</SectiuneAnimata>
```

Rezultatul: elementele apar unul dupa altul, de sus in jos, cu un efect de "cascada" placut vizual.

### Animatii pe ecranele de auth

Pe logare/inregistrare, fiecare sectiune (titlu, formular, buton, link) apare cu `FadeInDown` cascadat:

```tsx
<Animated.View entering={FadeInDown.duration(600)}>           {/* Titlu — instant */}
<Animated.View entering={FadeInDown.delay(150).duration(600)}> {/* Formular — dupa 150ms */}
<Animated.View entering={FadeInDown.delay(300).duration(600)}> {/* Buton — dupa 300ms */}
<Animated.View entering={FadeInDown.delay(400).duration(600)}> {/* Link — dupa 400ms */}
```

---

## 11. Bara de Navigare Personalizata

### De ce personalizata?

Bara de navigare implicita din React Navigation este simpla (text + iconite). Noi vrem:
- Forma de **pastila** (border-radius mare)
- Efect de **blur** (se vede continutul sub ea)
- Buton central **rotund** pentru "Creare"
- **Floating** (pozitionata absolut deasupra continutului)

### Cum functioneaza

```typescript
// components/bara-navigare/index.tsx

// Incarcam BlurView si Haptics doar pe native (nu exista pe web)
let BlurView = null;
let Haptics = null;
if (Platform.OS !== 'web') {
  BlurView = require('expo-blur').BlurView;
  Haptics = require('expo-haptics');
}

// Wrapper care alege intre BlurView (native) si View simplu (web)
function ContainerBlur({ children }) {
  if (Platform.OS === 'web' || !BlurView) {
    return <View style={[styles.container, styles.containerWeb]}>{children}</View>;
  }
  return (
    <BlurView intensity={60} tint="light" style={styles.container}>
      <View style={styles.suprapunereBlur} />
      {children}
    </BlurView>
  );
}

export function BaraNavigare({ state, navigation }: BottomTabBarProps) {
  const ruteVizibile = state.routes.filter(ruta => !TABURI_ASCUNSE.includes(ruta.name));

  return (
    <View style={styles.wrapper}>    {/* Wrapper — position: absolute, bottom: 0 */}
      <ContainerBlur>                {/* Container cu blur sau background solid */}
        {ruteVizibile.map((ruta) => {
          const esteActiv = state.index === state.routes.indexOf(ruta);
          const esteCreare = ruta.name === 'creare';

          const laApasare = () => {
            if (Platform.OS === 'ios' && Haptics) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Vibratia pe iOS
            }
            navigation.navigate(ruta.name);
          };

          if (esteCreare) {
            return (/* Cerc negru cu + alb */);
          }
          return (/* Iconita normala, neagra daca activa, gri altfel */);
        })}
      </ContainerBlur>
    </View>
  );
}
```

**Concepte cheie:**
- `BottomTabBarProps` — tipul furnizat de React Navigation cu `state` (ruta curenta) si `navigation` (functii de navigare)
- `state.routes` — array cu toate rutele (index, meniu, creare, notificari, profil)
- `state.index` — indexul rutei active
- `position: 'absolute'` — bara pluteste deasupra continutului, nu impinge continutul in sus
- `require()` conditionat — incarcam `expo-blur` si `expo-haptics` doar pe platformele suportate

### Conectarea la Tab Navigator

```typescript
// app/(taburi)/_layout.tsx
export default function LayoutTaburi() {
  return (
    <Tabs tabBar={(props) => <BaraNavigare {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="meniu" />
      <Tabs.Screen name="creare" />
      <Tabs.Screen name="notificari" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
```

`tabBar={(props) => <BaraNavigare {...props} />}` — inlocuieste bara implicita cu componenta noastra personalizata. React Navigation ii paseaza automat `state` si `navigation`.

---

## 12. Compatibilitate Web + Native

### Problema

React Native a fost creat pentru iOS si Android. Unele librarii **nu functioneaza pe web**:

| Librarie | iOS/Android | Web |
|----------|-------------|-----|
| `expo-secure-store` | Da (criptat) | NU |
| `expo-blur` (BlurView) | Da | NU |
| `expo-haptics` | Da (vibratie) | NU |
| `react-native-reanimated` | Da | Da (cu configurare) |
| `react-hook-form` | Da | Da |
| `zod` | Da | Da |

### Solutia: Verificare platforma

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Cod specific web
} else if (Platform.OS === 'ios') {
  // Cod specific iOS
} else if (Platform.OS === 'android') {
  // Cod specific Android
}
```

### Pattern: Import conditionat

```typescript
// NU face asta — crapa pe web:
import { BlurView } from 'expo-blur'; // Eroare pe web!

// FA asta — import conditionat:
let BlurView = null;
if (Platform.OS !== 'web') {
  BlurView = require('expo-blur').BlurView;
}
```

`require()` este **sincron** si conditionat — codul din `if` nu se executa pe web, deci `expo-blur` nu se incarca niciodata.

---

## 13. Fluxul Complet al Aplicatiei

### Scenariul 1: Prima deschidere (nelogat)

```
1. App porneste → _layout.tsx se monteaza
2. FurnizorAutentificare → verificaTokenSalvat()
3. citesteToken() → null
4. seIncarca = false, esteAutentificat = false
5. ProtectieRute → segmente = ["(taburi)"] (default)
   → !esteAutentificat && !peEcranAuth
   → router.replace('/(autentificare)/logare')
6. Se afiseaza ecranul de LOGARE cu animatii FadeInDown
```

### Scenariul 2: Logare

```
1. Utilizatorul scrie username + parola → Controller actualizeaza form state
2. Apasa "Sign in" → handleSubmit valideaza cu schemaLogare
3. Date valide → laTrimitere(date) se apeleaza
4. setSeIncarca(true) → butonul arata spinner
5. logareApi(date) → simuleaza 1 sec → returneaza { utilizator, token }
6. salveazaToken(token) → salvat in SecureStore/localStorage
7. setUtilizator(utilizator) → esteAutentificat devine true
8. ProtectieRute → esteAutentificat && peEcranAuth
   → router.replace('/(taburi)')
9. Se afiseaza Home cu animatii cascada
```

### Scenariul 3: Redeschidere aplicatie (deja logat)

```
1. App porneste → FurnizorAutentificare → verificaTokenSalvat()
2. citesteToken() → "mock_jwt_token_123" (exista!)
3. setUtilizator(dateMock) → esteAutentificat = true
4. ProtectieRute → esteAutentificat && peEcranAuth
   → router.replace('/(taburi)')
5. Direct pe Home, fara ecranul de logare!
```

### Scenariul 4: Delogare

```
1. Pe ecranul Profil, utilizatorul apasa "Delogare"
2. delogare() → stergeToken() + setUtilizator(null)
3. esteAutentificat devine false
4. ProtectieRute → !esteAutentificat && !peEcranAuth
   → router.replace('/(autentificare)/logare')
5. Inapoi pe logare
```

### Scenariul 5: Inregistrare

```
1. Pe ecranul de logare, apasa "Create"
2. Link href="/(autentificare)/inregistrare" → navigare
3. Completeaza formularul → valideaza cu schemaInregistrare
4. CAPTCHA: apasa checkbox → asteapta 2 sec → bifat verde
5. Apasa "Create" → inregistrareApi(date) → succes
6. Alert "Contul a fost creat cu succes!"
7. Apasa OK → router.replace('/(autentificare)/logare')
8. Se re-logheaza cu contul nou
```

---

## 14. Diagrama Arhitecturii

```
┌─────────────────────────────────────────────────────────┐
│                    app/_layout.tsx                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │           FurnizorAutentificare                    │  │
│  │  (Context cu: utilizator, logare, delogare...)     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │            ProtectieRute                     │  │  │
│  │  │  (Redirectioneaza pe baza esteAutentificat)  │  │  │
│  │  │                                              │  │  │
│  │  │  ┌──────────────┐  ┌──────────────────────┐ │  │  │
│  │  │  │(autentificare)│  │     (taburi)         │ │  │  │
│  │  │  │              │  │                      │ │  │  │
│  │  │  │ ┌──────────┐│  │ ┌────┐┌─────┐┌────┐ │ │  │  │
│  │  │  │ │ logare   ││  │ │Home││Meniu││Prof.│ │ │  │  │
│  │  │  │ └──────────┘│  │ └────┘└─────┘└────┘ │ │  │  │
│  │  │  │ ┌──────────┐│  │                      │ │  │  │
│  │  │  │ │inregistr.││  │   BaraNavigare       │ │  │  │
│  │  │  │ └──────────┘│  │   (custom tab bar)   │ │  │  │
│  │  │  └──────────────┘  └──────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Fluxul Datelor                        │
│                                                         │
│  UI (FormularLogare)                                    │
│    │ trimite date                                       │
│    ▼                                                    │
│  Hook (useFormularLogare)                               │
│    │ valideaza cu Zod → apeleaza context                │
│    ▼                                                    │
│  Context (FurnizorAutentificare)                        │
│    │ apeleaza API → salveaza token                      │
│    ▼                                                    │
│  API (serviciu-autentificare)         Stocare           │
│    │ cerere HTTP la server    ←→   (SecureStore)        │
│    ▼                                                    │
│  Server (backend)                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 15. Glosar de Termeni

| Termen | Explicatie |
|--------|-----------|
| **Component** | Bloc de constructie al UI-ului. Poate fi o functie care returneaza JSX (elemente vizuale). |
| **Props** | Proprietati transmise unei componente de catre parinte (ca argumente la o functie). |
| **State** | Date interne ale unei componente care, cand se schimba, cauzeaza re-render. `useState()` |
| **Hook** | Functie speciala React (incepe cu `use`) care da acces la functionalitati React (state, efecte, context). |
| **Context** | Mecanism de partajare a datelor intre componente fara prop drilling. |
| **Provider** | Componenta care FURNIZEAZA date prin Context. |
| **useEffect** | Hook care ruleaza cod la montare, demontare, sau cand dependentele se schimba. |
| **useCallback** | Hook care memoreaza o functie pentru a evita recrearea ei la fiecare render. |
| **useRef** | Hook care stocheaza o valoare mutabila fara a cauza re-render. |
| **async/await** | Sintaxa pentru cod asincron (operatii care dureaza — cereri HTTP, citirea fisierelor). |
| **Promise** | Obiect care reprezinta rezultatul viitor al unei operatii asincrone. |
| **JWT** | JSON Web Token — string criptat care dovedeste identitatea utilizatorului. |
| **Bearer Token** | Metoda de autentificare HTTP: se trimite token-ul in header-ul `Authorization`. |
| **Middleware** | Cod care ruleaza INTRE cerere si raspuns (in cazul nostru, ProtectieRute). |
| **Generic `<T>`** | Parametru de tip in TypeScript — permite functiilor sa fie flexibile fara a pierde tipizarea. |
| **Interface** | Defineste structura unui obiect in TypeScript (ce campuri are si ce tip au). |
| **Spread `...`** | Operator care "despacheteaza" proprietatile unui obiect in altul. |
| **Schema (Zod)** | Set de reguli care descrie cum trebuie sa arate datele valide. |
| **Resolver** | Adaptor care conecteaza o librarie de validare (Zod) la React Hook Form. |
| **Controller** | Componenta React Hook Form care leaga un camp din formular la o componenta UI. |
| **Platform.OS** | Proprietate React Native care returneaza platforma curenta ('ios', 'android', 'web'). |
| **entering** | Prop Reanimated care defineste animatia de aparitie a unei componente. |
| **FadeInDown** | Animatie predefinita Reanimated: apare de jos in sus cu fade. |
| **Stack Navigator** | Navigare de tip stiva — ecranele se suprapun, poti da "Back". |
| **Tab Navigator** | Navigare de tip tab-uri — ecranele sunt una langa alta, selectezi cu butoane. |
| **File-based routing** | Structura folderelor devine automat structura de navigare (specific Expo Router). |
| **Route Group `()`** | Folder cu paranteze — grupeaza rute logic fara a afecta URL-ul. |
| **Layout `_layout.tsx`** | Fisier special care defineste layout-ul partajat de toate ecranele din folder. |
| **Render** | Procesul prin care React transforma componentele in elemente vizuale pe ecran. |
| **Re-render** | Re-executarea unei componente cand state-ul sau props-urile se schimba. |
| **Mount/Unmount** | Cand o componenta apare (mount) sau dispare (unmount) din arbore. |

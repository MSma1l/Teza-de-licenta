---
name: security
description: >
  Auditează și securizează aplicații web și site-uri: identifică vulnerabilități,
  configurează headers HTTP, protejează endpoint-uri, sanitizează input-uri, și
  implementează autentificare sigură. Folosește acest skill ori de câte ori utilizatorul
  menționează "securitate", "security", "vulnerabilitate", "hack", "XSS", "CSRF", "SQL injection",
  "autentificare", "JWT", "CORS", "headers", "HTTPS", "parole", "rate limiting",
  "audit de securitate", "penetration test", "sanitizare input", sau cere să "securizeze"
  o aplicație / un site. Aplică și automat dacă codul conține pattern-uri nesigure detectate
  (concatenare SQL, eval(), token-uri hardcodate, parole în clar). Produce cod corectiv real,
  nu doar recomandări — fiecare problemă identificată vine cu fix-ul corespunzător.
---

# Security Skill

Auditează, identifică și remediază vulnerabilități de securitate în aplicații web.

> **Referință OWASP completă**: citește `references/owasp-checklist.md` pentru checklist-ul
> complet OWASP Top 10 când faci un audit exhaustiv.

---

## 1. Workflow de audit

```
Pas 1: Scanează codul → identifică pattern-uri nesigure
Pas 2: Clasifică severitatea (Critical / High / Medium / Low)
Pas 3: Generează raport structurat
Pas 4: Implementează fix-urile, unul câte unul
Pas 5: Verifică că fix-urile nu introduc regresii
```

---

## 2. Pattern-uri critice — detectează automat

### Injection (SQL / NoSQL / Command)

```typescript
// ❌ VULNERABIL — SQL Injection
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ FIX — Query parametrizat
const user = await db.query('SELECT * FROM users WHERE email = $1', [email])

// ❌ VULNERABIL — Command Injection
import { exec } from 'child_process'
exec(`convert ${filename} output.pdf`)  // filename poate conține ; rm -rf /

// ✅ FIX — execFile cu argumente separate
import { execFile } from 'child_process'
execFile('convert', [filename, 'output.pdf'])
```

### XSS (Cross-Site Scripting)

```typescript
// ❌ VULNERABIL
element.innerHTML = userInput
document.write(userInput)

// ✅ FIX — DOMPurify sau textContent
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userInput)
// sau mai bine:
element.textContent = userInput  // dacă nu e nevoie de HTML
```

### CSRF Protection

```typescript
// Express — middleware CSRF
import csrf from 'csurf'
import cookieParser from 'cookie-parser'

app.use(cookieParser())
app.use(csrf({ cookie: true }))

// Trimite token-ul în formulare
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() })
})
```

---

## 3. Security Headers — configurare completă

```typescript
// Express — folosește Helmet.js
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],      // fără 'unsafe-inline'
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 an
    includeSubDomains: true,
    preload: true,
  },
}))
```

```nginx
# Nginx — headers de securitate
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## 4. Autentificare securizată

### Hash parole

```typescript
import bcrypt from 'bcrypt'

// Înregistrare
const SALT_ROUNDS = 12
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)

// Login
const isValid = await bcrypt.compare(plainPassword, storedHash)
if (!isValid) throw new Error('Credențiale invalide')
```

### JWT securizat

```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET  // minim 32 caractere random
if (!JWT_SECRET) throw new Error('JWT_SECRET lipsă din env')

// Generare token
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
)

// Verificare
try {
  const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
} catch (err) {
  // TokenExpiredError, JsonWebTokenError
  res.status(401).json({ error: 'Token invalid' })
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

// Limită globală
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// Limită strictă pe auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Prea multe încercări. Încearcă din nou în 15 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
```

---

## 5. Validare și sanitizare input

```typescript
import { z } from 'zod'

// Schema de validare strictă
const CreateUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(12).max(128),
  name: z.string().min(2).max(100).trim()
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Numele conține caractere invalide'),
  age: z.number().int().min(13).max(120).optional(),
})

// În controller
app.post('/api/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  // Folosește result.data — validat și sanitizat
})
```

---

## 6. Variabile de mediu — gestiune sigură

```bash
# .env.example (commit în repo — fără valori reale!)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=                    # minim 32 caractere random
SESSION_SECRET=                # minim 32 caractere random
ALLOWED_ORIGINS=http://localhost:3000

# Generează secrete sigure
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```typescript
// Verificare la startup
const required = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET']
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variabila de mediu ${key} lipsește`)
  }
}
```

---

## 7. CORS configurat corect

```typescript
import cors from 'cors'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? []

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} nu este permis`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
```

---

## 8. Upload fișiere — securizare

```typescript
import multer from 'multer'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

const upload = multer({
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tip de fișier nepermis'))
    }
    // Verifică și extensia (nu te baza doar pe mimetype)
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
    if (!allowedExt.includes(ext)) {
      return cb(new Error('Extensie nepermisă'))
    }
    cb(null, true)
  },
  storage: multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => {
      // Randomizează numele — nu folosi originalname direct
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      cb(null, unique + path.extname(file.originalname))
    }
  })
})
```

---

## 9. Raport de audit — format standard

Când faci un audit, structurează răspunsul astfel:

```
## Raport de Securitate — [Nume Aplicație]

### 🔴 CRITICE (remediezi imediat)
1. [Vulnerabilitate] — [Locație în cod]
   Risc: [ce poate face un atacator]
   Fix: [cod sau configurație corectivă]

### 🟠 HIGH
...

### 🟡 MEDIUM
...

### 🟢 LOW / Îmbunătățiri
...

### ✅ Ce este deja securizat
...
```

---

## 10. Dependințe — verificare vulnerabilități

```bash
# Node.js
npm audit
npm audit fix          # fix automat pentru patch-uri
npm audit fix --force  # atenție — poate introduce breaking changes

# Python
pip install pip-audit
pip-audit

# Verifică .gitignore
grep -E "^\.env" .gitignore || echo "⚠️ .env nu este în .gitignore!"

# Caută secrete hardcodate accidental
grep -rn "password\s*=\s*['\"][^'\"]\+['\"]" src/
grep -rn "api_key\s*=\s*['\"][^'\"]\+['\"]" src/
```

---
name: testing
description: >
  Generează și rulează teste automate complete pentru aplicații web și mobile: unit tests,
  integration tests, end-to-end tests, API tests și snapshot tests. Folosește acest skill
  ori de câte ori utilizatorul menționează cuvinte precum "testează", "scrie teste", "testing",
  "jest", "vitest", "playwright", "cypress", "pytest", "coverage", "TDD", "test suite",
  "unit test", "integration test", "e2e", sau cere să verifice dacă codul funcționează corect.
  Aplică și când utilizatorul vrea să afle de ce un test pică, să crească code coverage,
  sau să configureze un pipeline CI/CD cu teste. Skill-ul produce teste reale, rulabile,
  nu doar exemple — întotdeauna adaptate la framework-ul și limbajul proiectului detectat.
---

# Testing Skill

Generează teste automate profesionale, rulabile, adaptate la stack-ul proiectului.

---

## 1. Detectează contextul proiectului

Înainte de orice, identifică:

```bash
# Detectează package manager și framework
ls package.json requirements.txt Cargo.toml go.mod 2>/dev/null
cat package.json 2>/dev/null | grep -E '"(jest|vitest|playwright|cypress|mocha|jasmine|testing-library)"'
cat package.json 2>/dev/null | grep -E '"(react|vue|svelte|next|nuxt|express|fastify)"'
```

| Limbaj / Framework | Test runner preferat        | Bibliotecă de assertions |
|--------------------|-----------------------------|--------------------------|
| JavaScript/TS      | Vitest (dacă Vite) / Jest   | @testing-library, msw    |
| React              | Vitest + React Testing Lib  | @testing-library/react   |
| Next.js            | Jest / Vitest               | @testing-library/react   |
| Python             | pytest                      | pytest-mock, httpx       |
| Node/Express       | Jest / Supertest            | supertest                |
| E2E (orice)        | Playwright                  | expect built-in          |

---

## 2. Tipuri de teste — când și cum

### Unit Tests
- Testează o singură funcție / componentă în izolare
- Mockează dependințele externe (DB, API, fs)
- Regula: un test = un comportament

```typescript
// Exemplu Vitest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('afișează eroare când email-ul este invalid', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' }
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/email invalid/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
```

### Integration Tests
- Testează mai multe module împreună (ex: route → controller → service → DB mock)
- Folosește baze de date în memorie (SQLite, mongomemory) sau testcontainers

```typescript
// Exemplu Jest + Supertest (Express)
import request from 'supertest'
import { app } from '../app'
import { db } from '../db'

beforeEach(async () => await db.migrate.latest())
afterEach(async () => await db.migrate.rollback())

describe('POST /api/users', () => {
  it('creează un user și returnează 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Ion Popescu', email: 'ion@example.com' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ email: 'ion@example.com' })
  })
})
```

### E2E Tests (Playwright)
- Testează fluxuri reale în browser
- Rulează împotriva unui server local sau staging

```typescript
// playwright.test.ts
import { test, expect } from '@playwright/test'

test('utilizatorul se poate loga și vede dashboard-ul', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'parola123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: /bun venit/i })).toBeVisible()
})
```

---

## 3. Structura fișierelor de test

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx        ← unit test lângă componentă
├── pages/
│   └── Login.test.tsx
tests/
├── integration/
│   └── api.test.ts            ← integration tests separate
└── e2e/
    └── auth.spec.ts           ← Playwright e2e
```

---

## 4. Code Coverage

```bash
# Vitest
npx vitest run --coverage

# Jest
npx jest --coverage

# pytest
pytest --cov=src --cov-report=html
```

**Ținte recomandate:**
- Funcții critice (auth, plăți): ≥ 90%
- Business logic: ≥ 80%
- UI components: ≥ 70%
- Overall: ≥ 75%

---

## 5. Mocking — reguli importante

```typescript
// ✅ Mockează module externe
vi.mock('../services/emailService', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}))

// ✅ Mockează fetch / axios
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [] })
}))

// ❌ Nu testa implementarea internă, testează comportamentul observabil
```

---

## 6. CI/CD — configurare GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 7. Workflow recomandat

1. **Citește codul sursă** — înțelege ce face fiecare funcție/componentă
2. **Identifică edge cases** — input invalid, erori de rețea, stări limită
3. **Scrie teste care pică mai întâi** (TDD) dacă e posibil
4. **Rulează testele** și verifică că trec
5. **Verifică coverage** și adaugă teste pentru liniile neacoperite
6. **Documentează** cu `describe` și `it` clare în română sau engleză

---

## 8. Comenzi rapide

```bash
# Rulează toate testele
npm test

# Watch mode (se rerulează la modificări)
npm test -- --watch

# Rulează doar un fișier
npx vitest run src/components/Button.test.tsx

# Debug un test care pică
npx vitest run --reporter=verbose
```

import { citesteToken, salveazaToken } from '@/lib/stocare/stocare-securizata';

const URL_BAZA = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3777/api';

interface OptiuniCerere {
  metoda?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corp?: unknown;
  token?: string | null;
  faraAuth?: boolean;
}

export async function cerereApi<T>(cale: string, optiuni: OptiuniCerere = {}): Promise<T> {
  const { metoda = 'GET', corp, token, faraAuth = false } = optiuni;

  const headere: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  /* Adaugă token-ul automat dacă nu e specificat altul */
  const tokenActiv = token ?? (faraAuth ? null : await citesteToken());
  if (tokenActiv) {
    headere['Authorization'] = `Bearer ${tokenActiv}`;
  }

  const raspuns = await fetch(`${URL_BAZA}${cale}`, {
    method: metoda,
    headers: headere,
    body: corp ? JSON.stringify(corp) : undefined,
  });

  /* Dacă token-ul a expirat, încearcă refresh */
  if (raspuns.status === 401 && !faraAuth) {
    const refreshReusit = await incercaRefreshToken();
    if (refreshReusit) {
      const noulToken = await citesteToken();
      headere['Authorization'] = `Bearer ${noulToken}`;
      const raspunsNou = await fetch(`${URL_BAZA}${cale}`, {
        method: metoda,
        headers: headere,
        body: corp ? JSON.stringify(corp) : undefined,
      });
      if (!raspunsNou.ok) {
        const eroare = await raspunsNou.json().catch(() => ({}));
        throw new Error(eroare.detail || 'Eroare la comunicarea cu serverul');
      }
      return raspunsNou.json();
    } else {
      throw new Error('Sesiune expirată');
    }
  }

  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.detail || 'Eroare la comunicarea cu serverul');
  }

  if (raspuns.status === 204) {
    return undefined as T;
  }

  return raspuns.json();
}

/* --- Upload cu FormData --- */
export async function uploadApi<T>(cale: string, formData: FormData): Promise<T> {
  const token = await citesteToken();
  const headere: Record<string, string> = {};
  if (token) {
    headere['Authorization'] = `Bearer ${token}`;
  }

  const raspuns = await fetch(`${URL_BAZA}${cale}`, {
    method: 'POST',
    headers: headere,
    body: formData,
  });

  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.detail || 'Eroare la upload');
  }

  return raspuns.json();
}

/* --- Refresh token --- */
async function incercaRefreshToken(): Promise<boolean> {
  try {
    const { citesteRefreshToken, salveazaRefreshToken } = await import('@/lib/stocare/stocare-securizata');
    const refreshToken = await citesteRefreshToken();
    if (!refreshToken) return false;

    const raspuns = await fetch(`${URL_BAZA}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!raspuns.ok) return false;

    const date = await raspuns.json();
    await salveazaToken(date.access_token);
    await salveazaRefreshToken(date.refresh_token);
    return true;
  } catch {
    return false;
  }
}

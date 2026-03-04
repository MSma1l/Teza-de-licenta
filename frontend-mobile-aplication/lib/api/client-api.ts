const URL_BAZA = 'http://localhost:3000/api';

interface OptiuniCerere {
  metoda?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corp?: unknown;
  token?: string | null;
}

export async function cerereApi<T>(cale: string, optiuni: OptiuniCerere = {}): Promise<T> {
  const { metoda = 'GET', corp, token } = optiuni;

  const headere: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headere['Authorization'] = `Bearer ${token}`;
  }

  const raspuns = await fetch(`${URL_BAZA}${cale}`, {
    method: metoda,
    headers: headere,
    body: corp ? JSON.stringify(corp) : undefined,
  });

  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.message || 'Eroare la comunicarea cu serverul');
  }

  return raspuns.json();
}

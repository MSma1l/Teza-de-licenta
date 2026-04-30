/* ============================================
   AI SERVICE CLIENT — comunicare cu serviciul AI (port 3778)

   Backend principal e pe port 3777, serviciul AI (Djarvis, audit log,
   system health) e pe port 3778. apiRequest() din apiClient.ts merge
   doar la backend. Folosim acest client separat pentru AI service.

   Acelasi token JWT este acceptat de ambele servicii.
   ============================================ */

const AI_SERVICE_BASE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3778/api/v1';

export async function aiServiceRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = localStorage.getItem('access_token');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const url = `${AI_SERVICE_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail: string;
    try {
      const err = await res.json();
      detail = err.detail || res.statusText;
    } catch {
      detail = res.statusText;
    }
    throw new Error(`AI service ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

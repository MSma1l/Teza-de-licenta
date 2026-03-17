/* ============================================
   API CLIENT - Comunicare cu backend-ul

   Client generic pentru cereri HTTP către backend.
   Gestionează automat token-ul JWT în headerele
   cererilor autentificate.
   ============================================ */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3777/api';

/* --- Obține token-ul din localStorage --- */
function getToken(): string | null {
  return localStorage.getItem('access_token');
}

/* --- Salvează tokenurile --- */
export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

/* --- Șterge tokenurile --- */
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/* --- Obține refresh token --- */
function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/* --- Cerere generică către API --- */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    noAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, noAuth = false } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!noAuth) {
    const token = getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  /* Dacă token-ul a expirat, încearcă refresh */
  if (response.status === 401 && !noAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      /* Reîncearcă cererea cu noul token */
      requestHeaders['Authorization'] = `Bearer ${getToken()}`;
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new Error(error.detail || 'Eroare la comunicarea cu serverul');
      }
      return retryResponse.json();
    } else {
      clearTokens();
      window.location.href = '/signin';
      throw new Error('Sesiune expirată');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Eroare la comunicarea cu serverul');
  }

  /* 204 No Content - nu parsăm JSON */
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/* --- Cerere cu FormData (pentru upload) --- */
export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Eroare la upload');
  }

  return response.json();
}

/* --- Refresh token --- */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

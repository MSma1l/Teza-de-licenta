/**
 * Client API pt QR login pe Web (gen WhatsApp Web).
 * Fluxul:
 *   1) Web face POST /qr-login/initiate -> primeste qr_token si-l codifica intr-un PNG.
 *   2) Mobile (logat) scaneaza QR-ul care contine URI `aicontabil://login/<qr_token>`.
 *   3) Mobile cheama `aprobaLoginWeb(qr_token)` cu JWT-ul propriu.
 *   4) Web-ul (care face polling pe /qr-login/status) primeste tokenii si e logat.
 */
import { cerereApi } from './client-api';

export interface RaspunsQrAproba {
  success: boolean;
  message: string;
}

/** Aproba sesiunea QR citita de camera. Trimite token-ul propriu (cerereApi adauga Authorization). */
export async function aprobaLoginWeb(qrToken: string): Promise<RaspunsQrAproba> {
  return cerereApi<RaspunsQrAproba>('/qr-login/approve', {
    metoda: 'POST',
    corp: { qr_token: qrToken },
  });
}

/** Respinge sesiunea (daca utilizatorul a scanat din greseala / e suspect). */
export async function respingeLoginWeb(qrToken: string): Promise<RaspunsQrAproba> {
  return cerereApi<RaspunsQrAproba>('/qr-login/reject', {
    metoda: 'POST',
    corp: { qr_token: qrToken },
  });
}

/**
 * Extrage qr_token din payload-ul scanat.
 * Backend-ul codifica: `aicontabil://login/<qr_token>` (vezi qr_login.py).
 * Acceptam si fallback: token raw (fara schema) — util daca schimbam formatul.
 */
export function extrageTokenDinQr(continut: string): string | null {
  const potrivire = continut.match(/aicontabil:\/\/login\/([A-Za-z0-9_\-]{10,80})/);
  if (potrivire) return potrivire[1];
  // fallback pt debug: daca tot continutul e un token valid
  if (/^[A-Za-z0-9_\-]{10,80}$/.test(continut.trim())) return continut.trim();
  return null;
}

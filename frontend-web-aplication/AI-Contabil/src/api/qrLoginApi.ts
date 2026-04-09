/**
 * QR Login API - login pe Web prin scanare QR de pe Mobile (similar WhatsApp Web).
 *
 * Aceste endpoint-uri sunt PUBLICE (nu necesita auth) - browser-ul nu e logat inca.
 */
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3777/api/v1/ac';

export interface QrInitiateResponse {
  session_token: string;
  qr_token: string;
  expires_at: string;
}

export interface QrStatusResponse {
  status: 'pending' | 'approved' | 'expired' | 'rejected';
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
}

export const initiateQrLogin = async (): Promise<QrInitiateResponse> => {
  const response = await fetch(`${API_BASE}/qr-login/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Nu s-a putut initia sesiunea QR');
  return response.json();
};

export const getQrLoginStatus = async (sessionToken: string): Promise<QrStatusResponse> => {
  const response = await fetch(`${API_BASE}/qr-login/status/${sessionToken}`);
  if (!response.ok) throw new Error('Nu s-a putut verifica statusul');
  return response.json();
};

export const fetchQrLoginImage = async (qrToken: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/qr-login/qr/${qrToken}`);
  if (!response.ok) throw new Error('Nu s-a putut incarca QR-ul');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

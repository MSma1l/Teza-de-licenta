import { apiRequest } from './apiClient';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3777/api/v1/ac';

export interface TwoFactorChallenge {
  challenge_id: string;
  code: number;
  qr_token: string;
  expires_at: string;
  action_type: string;
  action_description: string | null;
}

export interface TwoFactorStatus {
  verified: boolean;
  expired: boolean;
  attempts: number;
}

export const requestTwoFactor = (
  actionType: string,
  actionDescription?: string,
): Promise<TwoFactorChallenge> => {
  return apiRequest<TwoFactorChallenge>('/2fa/request', {
    method: 'POST',
    body: { action_type: actionType, action_description: actionDescription || null },
  });
};

export const getTwoFactorStatus = (challengeId: string): Promise<TwoFactorStatus> => {
  return apiRequest<TwoFactorStatus>(`/2fa/status/${challengeId}`);
};

/** URL-ul absolut catre PNG-ul QR (necesita header Authorization). */
export const getQrImageUrl = (qrToken: string): string => {
  return `${API_BASE}/2fa/qr/${qrToken}`;
};

/** Fetch QR ca blob URL pentru a-l afisa intr-un <img>. */
export const fetchQrBlobUrl = async (qrToken: string): Promise<string> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(getQrImageUrl(qrToken), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Nu s-a putut incarca QR-ul');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

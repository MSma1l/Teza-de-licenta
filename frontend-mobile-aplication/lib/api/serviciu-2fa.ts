/**
 * API client pentru Two-Factor Authentication
 *
 * Mobile vede provocarile in asteptare si trimite codul introdus de user.
 */
import { cerereApi } from './client-api';

export interface ProvocarePending {
  id: string;
  action_type: string;
  action_description: string | null;
  created_at: string;
  expires_at: string;
}

export interface RaspunsVerificare {
  success: boolean;
  message: string;
}

/** Lista provocarilor in asteptare pentru utilizatorul curent */
export async function obtineProvocariPending(): Promise<ProvocarePending[]> {
  return cerereApi<ProvocarePending[]>('/2fa/pending');
}

/** Trimite codul introdus de user pentru a confirma provocarea */
export async function verificaCod2FA(challengeId: string, cod: number): Promise<RaspunsVerificare> {
  return cerereApi<RaspunsVerificare>('/2fa/verify', {
    metoda: 'POST',
    corp: { challenge_id: challengeId, code: cod },
  });
}

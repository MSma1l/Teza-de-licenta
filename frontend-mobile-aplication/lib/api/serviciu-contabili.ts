/**
 * API pentru listare si alegere contabil.
 */
import { cerereApi } from './client-api';

export interface ContabilInfo {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface ListaContabiliRaspuns {
  users: ContabilInfo[];
  total: number;
}

export async function obtineContabiliDisponibili(): Promise<ContabilInfo[]> {
  const data = await cerereApi<ListaContabiliRaspuns>('/users/accountants');
  return data.users;
}

export async function alegeContabil(accountantId: string): Promise<{ success: boolean; message: string }> {
  return cerereApi('/users/choose-accountant?accountant_id=' + encodeURIComponent(accountantId), {
    metoda: 'POST',
  });
}

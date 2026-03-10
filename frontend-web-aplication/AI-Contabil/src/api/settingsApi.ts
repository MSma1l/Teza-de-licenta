/* ============================================
   API - SETTINGS

   Funcțiile placeholder pentru comunicarea
   cu backend-ul pentru setările utilizatorului.

   NOTĂ: Momentan returnează date mock.
   În viitor se vor conecta la backend real.
   ============================================ */

import type { UserProfile, PasswordChangeData, SecurityDocument } from '../models/settingsTypes';

/* --- Date mock pentru profil --- */
const mockProfile: UserProfile = {
  name: '',
  email: '',
  contactNumber: '',
  avatarUrl: '',
};

/* --- Date mock pentru documente securitate --- */
const mockDocuments: SecurityDocument[] = [];

/* --- Obține datele profilului --- */
export const fetchUserProfile = async (): Promise<UserProfile> => {
  // TODO: Înlocuiește cu apel real la API
  // return await fetch('/api/user/profile').then(res => res.json());
  return mockProfile;
};

/* --- Actualizează datele profilului --- */
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  // TODO: Înlocuiește cu apel real la API
  // return await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json());
  return { ...mockProfile, ...data };
};

/* --- Încarcă avatar nou --- */
export const uploadAvatar = async (_file: File): Promise<string> => {
  // TODO: Înlocuiește cu apel real la API
  // const formData = new FormData(); formData.append('avatar', file);
  // return await fetch('/api/user/avatar', { method: 'POST', body: formData }).then(res => res.json());
  return '';
};

/* --- Schimbă parola --- */
export const changePassword = async (_data: PasswordChangeData): Promise<boolean> => {
  // TODO: Înlocuiește cu apel real la API
  // return await fetch('/api/user/password', { method: 'PUT', body: JSON.stringify(data) }).then(res => res.ok);
  return true;
};

/* --- Obține documentele de securitate --- */
export const fetchSecurityDocuments = async (): Promise<SecurityDocument[]> => {
  // TODO: Înlocuiește cu apel real la API
  return mockDocuments;
};

/* --- Încarcă un document nou --- */
export const uploadSecurityDocument = async (_file: File, _type: string): Promise<SecurityDocument> => {
  // TODO: Înlocuiește cu apel real la API
  return { id: '', name: '', type: '', uploadedDate: '', status: 'pending' };
};

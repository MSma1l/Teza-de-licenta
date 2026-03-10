/* ============================================
   API - NOTIFICĂRI

   Funcțiile placeholder pentru comunicarea
   cu backend-ul pentru notificări.

   NOTĂ: Momentan returnează date mock.
   În viitor se vor conecta la backend real.
   ============================================ */

import type { Notification } from '../models/settingsTypes';

/* --- Date mock pentru notificări --- */
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Document procesat',
    message: 'Documentul dumneavoastră a fost procesat cu succes și este gata pentru descărcare.',
    date: 'oct.17, 01:55 PM',
    type: 'info',
    isRead: false,
  },
  {
    id: '2',
    title: 'Cerere aprobată',
    message: 'Cererea pentru actul de proprietate a fost aprobată. Verificați detaliile.',
    date: 'oct.17, 01:00 PM',
    type: 'urgent',
    isRead: false,
  },
  {
    id: '3',
    title: 'Actualizare sistem',
    message: 'Sistemul va fi actualizat în data de 20 octombrie. Salvați documentele.',
    date: 'oct.16, 02:05 PM',
    type: 'warning',
    isRead: true,
  },
  {
    id: '4',
    title: 'Document expirat',
    message: 'Documentul de identitate expiră în 30 de zile. Vă rugăm să îl reînnoiți.',
    date: 'oct.16, 01:45 PM',
    type: 'urgent',
    isRead: true,
  },
  {
    id: '5',
    title: 'Confirmare întâlnire',
    message: 'Întâlnirea pentru semnarea documentelor a fost confirmată pentru 25 octombrie.',
    date: 'oct.15, 10:30 AM',
    type: 'info',
    isRead: true,
  },
];

/* --- Obține lista de notificări --- */
export const fetchNotifications = async (): Promise<Notification[]> => {
  // TODO: Înlocuiește cu apel real la API
  // return await fetch('/api/notifications').then(res => res.json());
  return mockNotifications;
};

/* --- Marchează o notificare ca citită --- */
export const markNotificationRead = async (_id: string): Promise<boolean> => {
  // TODO: Înlocuiește cu apel real la API
  return true;
};

/* --- Marchează toate notificările ca citite --- */
export const markAllNotificationsRead = async (): Promise<boolean> => {
  // TODO: Înlocuiește cu apel real la API
  return true;
};

/* --- Șterge o notificare --- */
export const deleteNotification = async (_id: string): Promise<boolean> => {
  // TODO: Înlocuiește cu apel real la API
  return true;
};

/* ============================================
   API - NOTIFICĂRI

   Funcțiile pentru comunicarea cu backend-ul
   pentru notificări. Conectat la backend real.
   ============================================ */

import type { Notification } from '../models/settingsTypes';
import { apiRequest } from './apiClient';

/* --- Tipul din backend --- */
interface BackendNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

/* --- Convertește din format backend în format frontend --- */
function toNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    date: new Date(n.created_at).toLocaleDateString('ro-RO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: n.notification_type as 'urgent' | 'info' | 'warning',
    isRead: n.is_read,
  };
}

/* --- Obține lista de notificări --- */
export const fetchNotifications = async (): Promise<Notification[]> => {
  const data = await apiRequest<{ notifications: BackendNotification[]; total: number }>('/notifications/');
  return data.notifications.map(toNotification);
};

/* --- Marchează o notificare ca citită --- */
export const markNotificationRead = async (id: string): Promise<boolean> => {
  await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
  return true;
};

/* --- Marchează toate notificările ca citite --- */
export const markAllNotificationsRead = async (): Promise<boolean> => {
  await apiRequest('/notifications/read-all', { method: 'PUT' });
  return true;
};

/* --- Șterge o notificare --- */
export const deleteNotification = async (id: string): Promise<boolean> => {
  await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  return true;
};

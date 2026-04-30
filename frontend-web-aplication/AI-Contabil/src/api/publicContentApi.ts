/* ============================================
   PUBLIC CONTENT API — legi si stiri publicate de admin pe landing
   ============================================ */
import { apiRequest } from './apiClient';

export type PublicContentType = 'lege' | 'stire';

export interface PublicContent {
  id: string;
  type: PublicContentType;
  title: string;
  body: string;
  url: string | null;
  tag: string | null;
  color: string | null;
  published_date: string;
  is_active: boolean;
  created_at: string;
}

export interface PublicContentCreate {
  type: PublicContentType;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  color?: string;
  published_date?: string;
}

/** Public — fara auth. Folosit de landing page. */
export const fetchPublicContent = (type?: PublicContentType, limit = 50): Promise<PublicContent[]> => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  params.set('limit', String(limit));
  return apiRequest<PublicContent[]>(`/content?${params.toString()}`);
};

/** Admin only — adauga lege sau stire. */
export const createPublicContent = (data: PublicContentCreate): Promise<PublicContent> =>
  apiRequest<PublicContent>('/admin/content', { method: 'POST', body: data });

/** Admin only — sterge un articol. */
export const deletePublicContent = (id: string): Promise<void> =>
  apiRequest<void>(`/admin/content/${id}`, { method: 'DELETE' });

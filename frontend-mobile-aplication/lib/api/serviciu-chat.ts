/**
 * API client pentru chat AI si conversatii cu contabili
 */
import { cerereApi } from './client-api';

export interface MesajChat {
  id: string;
  conversation_id: string;
  sender_type: 'client' | 'ai' | 'contabil';
  content: string;
  confidence: number | null;
  created_at: string;
}

export interface ConversatieChat {
  id: string;
  user_id: string;
  is_escalated: boolean;
  is_resolved: boolean;
  created_at: string;
  messages: MesajChat[];
}

export async function trimiteMesajChat(mesaj: string, conversationId?: string): Promise<MesajChat> {
  return cerereApi<MesajChat>('/chat/send', {
    metoda: 'POST',
    corp: { message: mesaj, conversation_id: conversationId || null },
  });
}

export async function obtineConversatii(): Promise<ConversatieChat[]> {
  return cerereApi<ConversatieChat[]>('/chat/conversations');
}

export async function obtineConversatie(id: string): Promise<ConversatieChat> {
  return cerereApi<ConversatieChat>(`/chat/conversations/${id}`);
}

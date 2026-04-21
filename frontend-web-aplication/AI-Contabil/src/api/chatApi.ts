import { apiRequest } from './apiClient';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'client' | 'ai' | 'contabil';
  content: string;
  confidence: number | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  is_escalated: boolean;
  is_resolved: boolean;
  created_at: string;
  messages: ChatMessage[];
}

export const sendChatMessage = async (message: string, conversationId?: string): Promise<ChatMessage> => {
  return apiRequest<ChatMessage>('/chat/send', {
    method: 'POST',
    body: { message, conversation_id: conversationId || null },
  });
};

export const getConversations = async (): Promise<Conversation[]> => {
  return apiRequest<Conversation[]>('/chat/conversations');
};

export const getConversation = async (id: string): Promise<Conversation> => {
  return apiRequest<Conversation>(`/chat/conversations/${id}`);
};

export interface Suggestion {
  q: string;
  cat: string;
}

/**
 * Intrebari sugerate pentru Djarvis.
 * - fara argument → starter (6 intrebari populare)
 * - cu after=ultimul mesaj → intrebari legate de contextul curent
 */
export const fetchSuggestions = async (after?: string, limit = 5): Promise<Suggestion[]> => {
  const params = new URLSearchParams();
  if (after) params.set('after', after);
  params.set('limit', String(limit));
  const r = await apiRequest<{ suggestions: Suggestion[] }>(`/chat/suggestions?${params.toString()}`);
  return r.suggestions || [];
};

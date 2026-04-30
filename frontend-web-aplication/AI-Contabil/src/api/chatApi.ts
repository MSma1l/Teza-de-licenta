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

// === Contabil-side chat handoff ===

export const getEscalatedConversations = async (
  includeResolved = false,
): Promise<Conversation[]> => {
  return apiRequest<Conversation[]>(`/chat/escalated${includeResolved ? '?include_resolved=true' : ''}`);
};

export const getEscalatedDetail = async (conversationId: string): Promise<Conversation> => {
  return apiRequest<Conversation>(`/chat/escalated/${conversationId}`);
};

export const respondToEscalation = async (conversationId: string, message: string): Promise<ChatMessage> => {
  return apiRequest<ChatMessage>(`/chat/respond/${conversationId}`, {
    method: 'POST',
    body: { message, conversation_id: conversationId },
  });
};

export const resolveConversation = async (
  conversationId: string,
): Promise<{ status: string; conversation_id: string }> => {
  return apiRequest(`/chat/conversations/${conversationId}/resolve`, { method: 'POST' });
};

/** Receptionist forward conversatie catre un contabil specific. */
export const forwardToContabil = async (
  conversationId: string,
  contabilId: string,
  note?: string,
): Promise<{ status: string; contabil_id: string }> => {
  return apiRequest(`/chat/forward/${conversationId}`, {
    method: 'POST',
    body: { contabil_id: contabilId, note: note || '' },
  });
};

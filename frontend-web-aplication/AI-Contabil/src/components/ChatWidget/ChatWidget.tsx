import { useState, useRef, useEffect } from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { sendChatMessage, type ChatMessage } from '../../api/chatApi';
import { useLanguage } from '../../context/LanguageContext';
import type { Lang } from '../../context/LanguageContext';

const t: Record<Lang, {
  title: string;
  subtitle: string;
  placeholder: string;
  greeting: string;
  sending: string;
  error: string;
}> = {
  ro: {
    title: 'Consultant AI',
    subtitle: 'Raspundem la intrebarile tale contabile',
    placeholder: 'Scrie intrebarea ta...',
    greeting: 'Buna! Sunt asistentul AI-Contabil. Cu ce te pot ajuta astazi?',
    sending: 'Se trimite...',
    error: 'Eroare la trimitere. Incearca din nou.',
  },
  en: {
    title: 'AI Consultant',
    subtitle: 'We answer your accounting questions',
    placeholder: 'Type your question...',
    greeting: 'Hello! I am the AI-Contabil assistant. How can I help you today?',
    sending: 'Sending...',
    error: 'Send error. Try again.',
  },
  ru: {
    title: 'ИИ-Консультант',
    subtitle: 'Отвечаем на ваши бухгалтерские вопросы',
    placeholder: 'Напишите ваш вопрос...',
    greeting: 'Здравствуйте! Я ассистент AI-Contabil. Чем могу помочь сегодня?',
    sending: 'Отправка...',
    error: 'Ошибка отправки. Попробуйте снова.',
  },
};

interface LocalMessage {
  id: string;
  sender: 'client' | 'ai' | 'contabil';
  text: string;
  confidence?: number | null;
  time: string;
}

const ChatWidget = () => {
  const { lang } = useLanguage();
  const tr = t[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Greeting message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        sender: 'ai',
        text: tr.greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add client message
    setMessages((prev) => [...prev, {
      id: `client-${Date.now()}`,
      sender: 'client',
      text,
      time: now,
    }]);
    setInput('');
    setSending(true);

    try {
      const response: ChatMessage = await sendChatMessage(text, conversationId || undefined);
      if (!conversationId) setConversationId(response.conversation_id);

      setMessages((prev) => [...prev, {
        id: response.id,
        sender: response.sender_type,
        text: response.content,
        confidence: response.confidence,
        time: new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: tr.error,
        time: now,
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}
        >
          <ChatBubbleOutlineIcon style={{ color: '#fff', fontSize: 24 }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[999] w-[380px] max-md:w-[calc(100vw-32px)] max-md:right-4 h-[520px] max-md:h-[70vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <SmartToyOutlinedIcon style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-sm font-bold">{tr.title}</h3>
                <p className="text-[11px] opacity-80">{tr.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors"
            >
              <CloseIcon style={{ fontSize: 18 }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8fafc]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex gap-2 ${msg.sender === 'client' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'client'
                      ? 'bg-[#4f46e5] text-white'
                      : msg.sender === 'contabil'
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {msg.sender === 'client'
                      ? <PersonOutlineIcon style={{ fontSize: 16 }} />
                      : <SmartToyOutlinedIcon style={{ fontSize: 16 }} />
                    }
                  </div>
                  {/* Bubble */}
                  <div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'client'
                        ? 'bg-[#4f46e5] text-white rounded-br-md'
                        : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-neutral-400 mt-1 block ${msg.sender === 'client' ? 'text-right' : ''}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-neutral-200 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={tr.placeholder}
              maxLength={2000}
              className="flex-1 text-sm bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2.5 focus:outline-none focus:border-[#4f46e5] transition-colors"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-default"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}
            >
              <SendIcon style={{ color: '#fff', fontSize: 18 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

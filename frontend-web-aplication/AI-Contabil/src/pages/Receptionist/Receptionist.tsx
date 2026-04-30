/* ============================================
   PAGINA RECEPTIONIST — Dashboard + panou de lucru

   Tab-uri:
   - „Overview"      — stats + activitate recenta
   - „Consultatii"   — formular cereri din landing (preluare, status, note)
   - „Chat clienti"  — intrebari escaladate de Djarvis (raspuns sau forward)
   ============================================ */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';

import {
  listConsultations,
  updateConsultation,
  type Consultation,
  type ConsultationStatus,
} from '../../api/consultationsApi';
import {
  getEscalatedConversations,
  getEscalatedDetail,
  respondToEscalation,
  resolveConversation,
  forwardToContabil,
  type Conversation,
  type ChatMessage,
} from '../../api/chatApi';
import { listUsers } from '../../api/usersApi';
import type { UserData } from '../../api/authApi';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

type Tab = 'overview' | 'consultatii' | 'chat';

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  noua: 'Noua',
  in_lucru: 'In lucru',
  contactat: 'Contactat',
  programat: 'Programat',
  inchis_ok: 'Inchis OK',
  inchis_respins: 'Inchis (respins)',
};

const STATUS_COLOR: Record<ConsultationStatus, string> = {
  noua: 'bg-amber-100 text-amber-800',
  in_lucru: 'bg-sky-100 text-sky-800',
  contactat: 'bg-violet-100 text-violet-800',
  programat: 'bg-indigo-100 text-indigo-800',
  inchis_ok: 'bg-emerald-100 text-emerald-800',
  inchis_respins: 'bg-neutral-200 text-neutral-700',
};

const Receptionist = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'overview';
  const [tab, setTab] = useState<Tab>(initialTab);

  const schimbaTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-neutral-900">Panou Receptionist</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Cereri de consultatie de pe pagina publica + intrebari escaladate de Djarvis.
          </p>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
          {([
            { id: 'overview', label: 'Overview', icon: <DashboardOutlinedIcon style={{ fontSize: 18 }} /> },
            { id: 'consultatii', label: 'Consultatii', icon: <EmailOutlinedIcon style={{ fontSize: 18 }} /> },
            { id: 'chat', label: 'Chat clienti', icon: <ChatBubbleOutlineIcon style={{ fontSize: 18 }} /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => schimbaTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition inline-flex items-center gap-1.5 ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <TabOverview onJump={schimbaTab} />}
        {tab === 'consultatii' && <TabConsultatii />}
        {tab === 'chat' && <TabChat />}
      </div>
    </div>
  );
};

/* ============================================
   TAB — Overview
   ============================================ */
function TabOverview({ onJump }: { onJump: (t: Tab) => void }) {
  const [cereri, setCereri] = useState<Consultation[]>([]);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listConsultations(), getEscalatedConversations(false)])
      .then(([c, k]) => { setCereri(c); setConvos(k); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cereriNoi = cereri.filter((c) => c.status === 'noua').length;
  const cereriInLucru = cereri.filter((c) => c.status === 'in_lucru' || c.status === 'contactat' || c.status === 'programat').length;
  const cereriInchise = cereri.filter((c) => c.status === 'inchis_ok' || c.status === 'inchis_respins').length;

  if (loading) return <p className="text-sm text-neutral-500">Se incarca...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Cereri noi" value={cereriNoi} sub="aşteaptă preluare" tone="amber" onClick={() => onJump('consultatii')} highlight={cereriNoi > 0} />
        <StatCard label="In lucru" value={cereriInLucru} sub="contactat / programat" tone="sky" />
        <StatCard label="Cereri inchise" value={cereriInchise} sub="OK sau respinse" tone="emerald" />
        <StatCard label="Chat escaladat" value={convos.length} sub="aşteaptă răspuns" tone="violet" onClick={() => onJump('chat')} highlight={convos.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-bold text-neutral-900 mb-3">Cele mai recente cereri</h3>
          {cereri.slice(0, 5).map((c) => (
            <div key={c.id} className="flex justify-between items-start gap-3 py-2 border-b border-neutral-100 last:border-0">
              <div>
                <div className="font-semibold text-sm text-neutral-900">{c.full_name}</div>
                <div className="text-xs text-neutral-500">{c.company_name || c.email}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          ))}
          {cereri.length === 0 && <p className="text-sm text-neutral-500 italic py-2">Nicio cerere inca.</p>}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-bold text-neutral-900 mb-3">Chat escalat — ultimele</h3>
          {convos.slice(0, 5).map((c) => {
            const primul = c.messages?.find((m) => m.sender_type === 'client');
            return (
              <div key={c.id} className="py-2 border-b border-neutral-100 last:border-0">
                <div className="text-xs text-neutral-500 mb-0.5">Client {c.user_id.slice(0, 8)}…</div>
                <div className="text-sm text-neutral-800 line-clamp-2">{primul?.content || '—'}</div>
              </div>
            );
          })}
          {convos.length === 0 && <p className="text-sm text-neutral-500 italic py-2">Niciun chat escalat acum.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  onClick,
  highlight,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone: 'indigo' | 'emerald' | 'violet' | 'amber' | 'sky';
  onClick?: () => void;
  highlight?: boolean;
}) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
  };
  const Component: any = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm text-left ${
        onClick ? 'hover:shadow-md hover:border-indigo-300 transition cursor-pointer' : ''
      } ${highlight ? 'ring-2 ring-violet-300 border-violet-300' : 'border-neutral-200'}`}
    >
      <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-3 ${tones[tone]}`}>
        {label}
      </div>
      <div className="text-3xl font-bold text-neutral-900">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </Component>
  );
}

/* ============================================
   TAB — Consultatii
   ============================================ */
function TabConsultatii() {
  const [cereri, setCereri] = useState<Consultation[]>([]);
  const [filter, setFilter] = useState<ConsultationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listConsultations(filter || undefined);
      setCereri(data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { reload(); }, [reload]);

  const selected = useMemo(() => cereri.find((c) => c.id === selectedId), [cereri, selectedId]);
  useEffect(() => { setNotes(selected?.internal_notes || ''); setFeedback(null); }, [selectedId, selected?.internal_notes]);

  async function changeStatus(s: ConsultationStatus) {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateConsultation(selectedId, { status: s });
      setFeedback(`Status actualizat: ${STATUS_LABEL[s]}`);
      await reload();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateConsultation(selectedId, { internal_notes: notes });
      setFeedback('Note salvate.');
      await reload();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
      <div className="bg-white rounded-xl border border-neutral-200 p-4 max-h-[78vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-bold text-neutral-900">Cereri ({cereri.length})</h2>
          <select
            value={filter}
            onChange={(e) => setFilter((e.target.value as ConsultationStatus) || '')}
            className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-white"
          >
            <option value="">Toate</option>
            {(Object.keys(STATUS_LABEL) as ConsultationStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca...</p>
        ) : cereri.length === 0 ? (
          <p className="text-sm text-neutral-500 italic py-8 text-center">Nicio cerere.</p>
        ) : (
          <div className="space-y-2">
            {cereri.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedId === c.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-semibold text-sm text-neutral-900">{c.full_name}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {c.email} {c.phone && `· ${c.phone}`}
                </div>
                {c.company_name && (
                  <div className="text-xs text-neutral-700 inline-flex items-center gap-1 mt-0.5">
                    <BusinessOutlinedIcon style={{ fontSize: 12 }} /> {c.company_name}
                  </div>
                )}
                <div className="text-[10px] text-neutral-400 mt-1">
                  {new Date(c.created_at).toLocaleString('ro')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 max-h-[78vh] overflow-y-auto">
        {!selected ? (
          <div className="text-center py-12 text-neutral-500">
            <div className="text-5xl mb-3">📋</div>
            <p>Selecteaza o cerere din stanga ca sa vezi detalii.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-lg text-neutral-900">{selected.full_name}</h3>
              <p className="text-sm text-neutral-600 mt-0.5">{selected.email}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <Info label="Telefon" value={selected.phone || '—'} link={selected.phone ? `tel:${selected.phone}` : undefined} />
                <Info label="Companie" value={selected.company_name || '—'} />
                <Info label="IP source" value={selected.source_ip || '—'} />
                <Info label="Trimis" value={new Date(selected.created_at).toLocaleString('ro')} />
              </div>
            </div>

            {selected.message && (
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Mesaj de la client</div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 text-sm text-neutral-800 whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Status</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABEL) as ConsultationStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={saving || selected.status === s}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                      selected.status === s
                        ? `${STATUS_COLOR[s]} border-current`
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-indigo-300'
                    } disabled:opacity-100`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Note interne</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ce ai discutat cu clientul, urmatoarea actiune..."
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md disabled:opacity-50"
              >
                {saving ? 'Salvez...' : 'Salveaza note'}
              </button>
            </div>

            {feedback && (
              <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-2">
                {feedback}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="bg-neutral-50 rounded-md px-3 py-2 border border-neutral-100">
      <div className="text-[10px] uppercase font-bold text-neutral-500">{label}</div>
      <div className="text-sm font-semibold text-neutral-900 truncate">
        {link ? <a href={link} className="hover:underline text-indigo-700">{value}</a> : value}
      </div>
    </div>
  );
}

/* ============================================
   TAB — Chat clienti escaladat
   ============================================ */
function TabChat() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [contabili, setContabili] = useState<UserData[]>([]);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEscalatedConversations(false);
      setConvos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    listUsers('contabil').then((r) => setContabili(r.users)).catch(() => {});
  }, []);

  // Polling detail
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let mounted = true;
    const tick = async () => {
      try {
        const d = await getEscalatedDetail(selectedId);
        if (mounted) setDetail(d);
      } catch { /* ignore */ }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [selectedId]);

  async function trimite() {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      await respondToEscalation(selectedId, reply.trim());
      setReply('');
      const d = await getEscalatedDetail(selectedId);
      setDetail(d);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setSending(false);
    }
  }

  async function rezolva() {
    if (!selectedId) return;
    if (!confirm('Marchez conversatia ca rezolvata? Q&A va fi salvat in FAQ.')) return;
    try {
      await resolveConversation(selectedId);
      setFeedback('Conversatie rezolvata.');
      await reload();
      setSelectedId(null);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare');
    }
  }

  async function trimiteForward(contabilId: string) {
    if (!selectedId) return;
    try {
      await forwardToContabil(selectedId, contabilId);
      setFeedback('Conversatie transmisa contabilului.');
      setForwardOpen(false);
      const d = await getEscalatedDetail(selectedId);
      setDetail(d);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare forward');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
      <div className="bg-white rounded-xl border border-neutral-200 p-4 max-h-[78vh] overflow-y-auto">
        <h2 className="font-bold text-neutral-900 mb-3">Intrebari escaladate ({convos.length})</h2>
        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca...</p>
        ) : convos.length === 0 ? (
          <p className="text-sm text-neutral-500 italic py-8 text-center">Niciuna activa.</p>
        ) : (
          <div className="space-y-2">
            {convos.map((c) => {
              const primul = c.messages?.find((m) => m.sender_type === 'client');
              const ultim = c.messages?.[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedId === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs text-neutral-500">Client {c.user_id.slice(0, 8)}…</div>
                  <div className="text-sm font-medium text-neutral-900 line-clamp-2 mt-0.5">
                    {primul?.content || '—'}
                  </div>
                  {ultim && ultim.id !== primul?.id && (
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Ultim: {ultim.sender_type}: {ultim.content.slice(0, 50)}…
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 max-h-[78vh] flex flex-col">
        {!detail ? (
          <div className="text-center py-12 text-neutral-500">Selecteaza o conversatie.</div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Conversatie</h3>
                <p className="text-xs text-neutral-500">Client: {detail.user_id.slice(0, 8)}… · {detail.messages.length} mesaje</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForwardOpen(!forwardOpen)}
                  className="text-xs px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold rounded-md"
                >
                  ↗ Forward catre contabil
                </button>
                <button
                  onClick={rezolva}
                  className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md"
                >
                  ✓ Rezolvat
                </button>
              </div>
            </div>

            {forwardOpen && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-3">
                <div className="text-xs font-bold text-indigo-800 uppercase mb-2">Alege contabilul</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {contabili.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => trimiteForward(c.id)}
                      className="text-left p-2 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-md text-sm"
                    >
                      <div className="font-semibold">{c.full_name || c.username}</div>
                      <div className="text-xs text-neutral-500">{c.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {detail.messages.map((m: ChatMessage) => {
                const isStaff = m.sender_type === 'contabil';
                return (
                  <div key={m.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%]">
                      <div className="text-[10px] font-bold uppercase text-neutral-500 mb-0.5">
                        {m.sender_type === 'contabil' ? '✉ Tu' : m.sender_type === 'ai' ? '🤖 Djarvis' : '👤 Client'}
                      </div>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        m.sender_type === 'contabil' ? 'bg-emerald-600 text-white rounded-br-md' :
                        m.sender_type === 'ai' ? 'bg-neutral-200 text-neutral-800 rounded-bl-md' :
                        'bg-indigo-100 text-indigo-900 rounded-bl-md'
                      }`}>
                        {m.content}
                      </div>
                      <div className={`text-[10px] text-neutral-400 mt-0.5 ${isStaff ? 'text-right' : ''}`}>
                        {new Date(m.created_at).toLocaleString('ro')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {feedback && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-2 mt-2">
                {feedback}
              </div>
            )}

            <div className="border-t border-neutral-100 pt-3 mt-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Raspunde clientului..."
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={trimite}
                  disabled={!reply.trim() || sending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:opacity-50 text-sm"
                >
                  {sending ? 'Trimit...' : 'Trimite raspuns'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Receptionist;

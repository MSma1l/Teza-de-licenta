/* ============================================
   PAGINA CONTABIL — Panou de lucru pe tab-uri

   Acces: rol CONTABIL sau ADMIN.

   Tab-uri:
   - „Clientii mei"      — lista clientilor asignati (logica veche)
   - „Coada documente"   — toate documentele clientilor, sortate dupa urgenta
   - „Validare OCR"      — panou de revizie cu imagine + campuri extrase
   - „Solicitari"        — trimite cereri (notificari) catre client
   - „Rapoarte"          — link rapid catre rapoartele fiscale (SFS)
   ============================================ */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';

import { getMyClients, listUsers, assignClient } from '../../api/usersApi';
import type { UserData } from '../../api/authApi';

import { fetchDocuments, DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../api/documentsApi';
import type { DocumentData } from '../../api/documentsApi';

import {
  fetchDocumentOcr,
  triggerDocumentProcessing,
  submitCorrection,
  confirmDocument,
} from '../../api/trainingApi';
import type { DocumentOcrData } from '../../api/trainingApi';

import {
  getEscalatedConversations,
  getEscalatedDetail,
  respondToEscalation,
  resolveConversation,
  type Conversation,
  type ChatMessage as ChatMsg,
} from '../../api/chatApi';
import {
  bulkApproveDocuments,
  bulkReprocessDocuments,
  fetchClientNotes,
  setClientNotes,
} from '../../api/contabilDashboardApi';

type Tab = 'clienti' | 'coada' | 'chat' | 'solicitari' | 'rapoarte';

const Contabil = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'clienti';
  const [tab, setTab] = useState<Tab>(initialTab);

  const schimbaTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-neutral-900">Panou contabil</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Gestioneaza clientii, valideaza documentele procesate de AI si emite rapoartele fiscale.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
          {([
            { id: 'clienti', label: 'Clientii mei', icon: '👥' },
            { id: 'coada', label: 'Coada documente', icon: '📥' },
            { id: 'chat', label: 'Chat clienți', icon: '💬' },
            { id: 'solicitari', label: 'Solicitari', icon: '✉️' },
            { id: 'rapoarte', label: 'Rapoarte SFS', icon: '📊' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => schimbaTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Continut tab activ */}
        {tab === 'clienti' && <TabClienti />}
        {tab === 'coada' && <TabCoada />}
        {tab === 'chat' && <TabChatClienti />}
        {tab === 'solicitari' && <TabSolicitari />}
        {tab === 'rapoarte' && <TabRapoarte />}
      </div>
    </div>
  );
};

/* ============================================
   TAB 1 — Clientii mei (logica existenta)
   ============================================ */
function TabClienti() {
  const [clienti, setClienti] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const [dialogDeschis, setDialogDeschis] = useState(false);
  const [clientiDisponibili, setClientiDisponibili] = useState<UserData[]>([]);
  const [loadingDisponibili, setLoadingDisponibili] = useState(false);

  const incarcaClienti = useCallback(async () => {
    setLoading(true);
    setEroare(null);
    try {
      const r = await getMyClients();
      setClienti(r.users);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Eroare necunoscuta');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    incarcaClienti();
  }, [incarcaClienti]);

  async function deschideDialog() {
    setDialogDeschis(true);
    setLoadingDisponibili(true);
    try {
      const r = await listUsers('client', 0, 200);
      const idsAsignati = new Set(clienti.map((c) => c.id));
      setClientiDisponibili(r.users.filter((u) => !idsAsignati.has(u.id)));
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu am putut incarca clientii disponibili');
    } finally {
      setLoadingDisponibili(false);
    }
  }

  async function preiaClient(id: string) {
    try {
      await assignClient(id);
      setDialogDeschis(false);
      await incarcaClienti();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la preluare');
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Clientii asignati</h2>
          <p className="text-sm text-neutral-600">Total: {clienti.length} client{clienti.length === 1 ? '' : 'i'}</p>
        </div>
        <button
          onClick={deschideDialog}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition"
        >
          + Preia un client
        </button>
      </div>

      {eroare && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">{eroare}</div>
      )}

      {loading ? (
        <CardStareGoala text="Se incarca clientii..." />
      ) : clienti.length === 0 ? (
        <CardStareGoala
          text='Inca nu ai clienti asignati. Apasa "Preia un client" ca sa incepi.'
          icon="👋"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clienti.map((c) => <CardClient key={c.id} client={c} />)}
        </div>
      )}

      {dialogDeschis && (
        <DialogPreluareClient
          clienti={clientiDisponibili}
          loading={loadingDisponibili}
          onClose={() => setDialogDeschis(false)}
          onPreia={preiaClient}
        />
      )}
    </>
  );
}

/* ============================================
   TAB 2 — Coada documente cu validare OCR
   ============================================ */
function TabCoada() {
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);
  const [filtruStatus, setFiltruStatus] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<'approve' | 'reprocess' | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Document selectat pentru validare (panou dreapta)
  const [docSelectat, setDocSelectat] = useState<DocumentData | null>(null);
  const [ocrData, setOcrData] = useState<DocumentOcrData | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [proceseaza, setProceseaza] = useState(false);
  const [feedbackProcesare, setFeedbackProcesare] = useState<string | null>(null);

  const incarcaCoada = useCallback(async () => {
    setLoading(true);
    setEroare(null);
    try {
      const r = await fetchDocuments({
        doc_status: filtruStatus || undefined,
        limit: 100,
      });
      // Sortare descrescatoare dupa urgency_score
      const sortat = [...r.documents].sort(
        (a, b) => (b.urgency_score ?? 0) - (a.urgency_score ?? 0),
      );
      setDocs(sortat);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Eroare incarcare coada');
    } finally {
      setLoading(false);
    }
  }, [filtruStatus]);

  useEffect(() => {
    incarcaCoada();
  }, [incarcaCoada]);

  async function selecteazaDoc(doc: DocumentData) {
    setDocSelectat(doc);
    setOcrData(null);
    setFeedbackProcesare(null);
    setLoadingOcr(true);
    try {
      const data = await fetchDocumentOcr(doc.id);
      setOcrData(data);
    } catch (e) {
      // Doc poate sa nu aiba inca campuri extrase — ok
      console.warn('OCR data lipsa:', e);
    } finally {
      setLoadingOcr(false);
    }
  }

  async function lanseazaProcesare() {
    if (!docSelectat) return;
    setProceseaza(true);
    setFeedbackProcesare(null);
    try {
      const r = await triggerDocumentProcessing(docSelectat.id);
      setFeedbackProcesare(r.message);
      // Reincarca datele OCR pentru a vedea campurile noi extrase
      const data = await fetchDocumentOcr(docSelectat.id);
      setOcrData(data);
      // Reincarca si lista (status-ul s-a schimbat in coada)
      await incarcaCoada();
    } catch (e) {
      setFeedbackProcesare(e instanceof Error ? e.message : 'Eroare la procesare');
    } finally {
      setProceseaza(false);
    }
  }

  async function aprobaDocument() {
    if (!docSelectat) return;
    try {
      await confirmDocument(docSelectat.id);
      setFeedbackProcesare('✓ Document aprobat. Statusul a fost actualizat.');
      // Reincarca atat OCR cat si lista
      const data = await fetchDocumentOcr(docSelectat.id);
      setOcrData(data);
      await incarcaCoada();
    } catch (e) {
      setFeedbackProcesare(e instanceof Error ? e.message : 'Eroare la aprobare');
    }
  }

  async function salveazaCorectii(corectii: Record<string, string>) {
    if (!docSelectat) return;
    try {
      await submitCorrection(docSelectat.id, { fields: corectii });
      setFeedbackProcesare(`✓ Corectii salvate (${Object.keys(corectii).length} campuri).`);
      const data = await fetchDocumentOcr(docSelectat.id);
      setOcrData(data);
      await incarcaCoada();
    } catch (e) {
      setFeedbackProcesare(e instanceof Error ? e.message : 'Eroare la salvare');
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (prev.size === docs.length) return new Set();
      return new Set(docs.map((d) => d.id));
    });
  }

  async function bulkAproba() {
    if (selected.size === 0) return;
    if (!confirm(`Aprob ${selected.size} documente?`)) return;
    setBulkBusy('approve');
    setBulkFeedback(null);
    try {
      const ids = Array.from(selected);
      const r = await bulkApproveDocuments(ids);
      setBulkFeedback(`✓ ${r.approved}/${r.total} aprobate${r.errors.length ? ` (${r.errors.length} erori)` : ''}.`);
      setSelected(new Set());
      await incarcaCoada();
    } catch (e) {
      setBulkFeedback(e instanceof Error ? e.message : 'Eroare bulk approve');
    } finally {
      setBulkBusy(null);
    }
  }

  async function bulkReproceseaza() {
    if (selected.size === 0) return;
    if (!confirm(`Reprocesez AI ${selected.size} documente?`)) return;
    setBulkBusy('reprocess');
    setBulkFeedback(null);
    try {
      const r = await bulkReprocessDocuments(Array.from(selected));
      setBulkFeedback(`✓ ${r.processed}/${r.total} reprocesate.`);
      setSelected(new Set());
      await incarcaCoada();
    } catch (e) {
      setBulkFeedback(e instanceof Error ? e.message : 'Eroare bulk reprocess');
    } finally {
      setBulkBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
      {/* Stanga — coada */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 max-h-[78vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-bold text-neutral-900">Coada documente</h2>
          <select
            value={filtruStatus}
            onChange={(e) => setFiltruStatus(e.target.value)}
            className="text-xs border border-neutral-200 rounded-md px-2 py-1.5 bg-white"
          >
            <option value="">Toate statusurile</option>
            {Object.entries(DOCUMENT_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Bulk action bar */}
        {docs.length > 0 && (
          <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-neutral-50 rounded-md border border-neutral-200">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === docs.length && docs.length > 0}
                onChange={toggleSelectAll}
              />
              <span className="font-semibold">{selected.size > 0 ? `${selected.size} selectate` : 'Selecteaza tot'}</span>
            </label>
            {selected.size > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={bulkAproba}
                  disabled={bulkBusy !== null}
                  className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded disabled:opacity-50"
                >
                  {bulkBusy === 'approve' ? '...' : '✓ Aproba'}
                </button>
                <button
                  onClick={bulkReproceseaza}
                  disabled={bulkBusy !== null}
                  className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded disabled:opacity-50"
                >
                  {bulkBusy === 'reprocess' ? '...' : '🔄 Reproc'}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        {bulkFeedback && (
          <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-2 mb-2">
            {bulkFeedback}
          </div>
        )}

        {eroare && <div className="text-sm text-red-700 bg-red-50 rounded p-2 mb-3">{eroare}</div>}

        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Niciun document in coada.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggleSelect(d.id)}
                  className="mt-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <CardCoada
                    doc={d}
                    selectat={docSelectat?.id === d.id}
                    onClick={() => selecteazaDoc(d)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dreapta — panou validare */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 max-h-[78vh] overflow-y-auto">
        {!docSelectat ? (
          <CardStareGoala text="Selecteaza un document din coada pentru a-l valida." icon="👈" />
        ) : (
          <PanouValidare
            doc={docSelectat}
            ocr={ocrData}
            loading={loadingOcr}
            onProceseaza={lanseazaProcesare}
            onAproba={aprobaDocument}
            onSalveazaCorectii={salveazaCorectii}
            proceseaza={proceseaza}
            feedbackProcesare={feedbackProcesare}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================
   TAB 3 — Solicitari catre clienti
   ============================================ */
// Template-uri rapide pentru solicitari frecvente
const SOLICITARI_TEMPLATES: Array<{
  id: string;
  emoji: string;
  label: string;
  titlu: string;
  tip: 'INFO' | 'WARNING' | 'URGENT';
  mesaj: string;
}> = [
  {
    id: 'extras_bancar',
    emoji: '🏦',
    label: 'Extras bancar lunar',
    titlu: 'Solicitare extras bancar',
    tip: 'INFO',
    mesaj: 'Va rog sa transmiteti extrasul bancar pentru luna [LUNA] [ANUL], in format PDF. Termen recomandat: 5 zile lucratoare.',
  },
  {
    id: 'factura_furnizor',
    emoji: '🧾',
    label: 'Factura furnizor lipsa',
    titlu: 'Lipsa factura furnizor',
    tip: 'WARNING',
    mesaj: 'Am observat o plata in extrasul bancar pentru care nu am primit factura. Va rog sa transmiteti factura aferenta sumei [SUMA] catre [FURNIZOR] din data de [DATA].',
  },
  {
    id: 'contract_munca',
    emoji: '📋',
    label: 'Contract de munca angajat',
    titlu: 'Solicitare contract de munca',
    tip: 'INFO',
    mesaj: 'Va rog sa transmiteti copia contractului de munca pentru noul angajat [NUME PRENUME], precum si o copie a buletinului de identitate.',
  },
  {
    id: 'stat_plata_lunar',
    emoji: '💼',
    label: 'Stat de plata + pontaj',
    titlu: 'Solicitare pontaj luna curenta',
    tip: 'INFO',
    mesaj: 'Va rog sa transmiteti pontajul angajatilor pentru luna [LUNA] pentru a putea genera statele de plata si declaratia IPC21.',
  },
  {
    id: 'documente_lipsa',
    emoji: '⚠',
    label: 'Documente lipsa pentru raport',
    titlu: 'Documente lipsa',
    tip: 'URGENT',
    mesaj: 'Pentru a depune declaratia D300 / IPC21 in termen, am nevoie urgent de urmatoarele documente: [LIST]. Va rog sa le transmiteti pana pe data de [DATA].',
  },
  {
    id: 'aviz_termen',
    emoji: '⏰',
    label: 'Aviz termen fiscal apropiat',
    titlu: 'Termen fiscal apropiat',
    tip: 'URGENT',
    mesaj: 'Va aducem la cunostinta ca pe data de [DATA] expira termenul de depunere pentru [DECLARATIE]. Va rog sa pregatiti documentele aferente.',
  },
];


function TabSolicitari() {
  const [clienti, setClienti] = useState<UserData[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [titlu, setTitlu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [tip, setTip] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [trimitere, setTrimitere] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    getMyClients().then((r) => setClienti(r.users)).catch(() => {});
  }, []);

  function aplicaTemplate(t: typeof SOLICITARI_TEMPLATES[number]) {
    setTitlu(t.titlu);
    setMesaj(t.mesaj);
    setTip(t.tip);
  }

  async function trimite() {
    if (!clientId || !titlu.trim() || !mesaj.trim()) {
      setFeedback('Completeaza toate campurile inainte sa trimiti.');
      return;
    }
    setTrimitere(true);
    setFeedback(null);
    try {
      // Endpoint backend pentru trimitere notificare directa nu exista public,
      // asa ca apelam un endpoint generic POST notification (placeholder).
      // Daca backend-ul nu accepta inca, mesajul ramane local.
      // (Pentru implementare completa: adauga POST /notifications/ in backend.)
      const res = await fetch('/api/v1/ac/notifications/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          user_id: clientId,
          title: titlu,
          message: mesaj,
          notification_type: tip,
        }),
      });
      if (res.ok) {
        setFeedback('Solicitarea a fost trimisa clientului.');
        setTitlu('');
        setMesaj('');
      } else {
        setFeedback('Backend-ul inca nu accepta crearea de notificari prin API. Ele sunt generate doar de sistem la evenimente.');
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare trimitere');
    } finally {
      setTrimitere(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Solicita acte de la client</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Trimite o cerere catre clientul tau pentru documentele de care ai nevoie. Clientul va vedea
        solicitarea in centrul de notificari si pe mobil.
      </p>

      {/* Template-uri rapide */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <div className="text-xs font-bold uppercase text-indigo-800 mb-2">⚡ Template-uri rapide</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SOLICITARI_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => aplicaTemplate(t)}
              className="text-left p-2.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-md transition"
              title={t.mesaj}
            >
              <div className="text-lg">{t.emoji}</div>
              <div className="text-xs font-semibold text-neutral-900">{t.label}</div>
              <div className={`text-[10px] uppercase font-bold mt-0.5 ${
                t.tip === 'URGENT' ? 'text-red-700' : t.tip === 'WARNING' ? 'text-amber-700' : 'text-sky-700'
              }`}>{t.tip.toLowerCase()}</div>
            </button>
          ))}
        </div>
        <div className="text-[10px] text-neutral-500 mt-2 italic">
          Click pentru a pre-completa formularul. Inlocuieste [LUNA], [DATA], [SUMA] etc. cu valorile reale.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-neutral-200 rounded-md px-3 py-2 bg-white"
          >
            <option value="">— alege client —</option>
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name || c.username}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Tip solicitare</label>
          <div className="flex gap-2">
            {(['INFO', 'WARNING', 'URGENT'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md border ${
                  tip === t
                    ? t === 'URGENT'
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : t === 'WARNING'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'bg-white border-neutral-200 text-neutral-500'
                }`}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Titlu</label>
          <input
            type="text"
            value={titlu}
            onChange={(e) => setTitlu(e.target.value)}
            placeholder="Ex: Solicitare extras bancar luna octombrie"
            className="w-full border border-neutral-200 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Mesaj</label>
          <textarea
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            rows={5}
            placeholder="Va rog sa ne transmiteti extrasul bancar pentru luna octombrie pana pe data de 5 noiembrie..."
            className="w-full border border-neutral-200 rounded-md px-3 py-2"
          />
        </div>

        {feedback && (
          <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3">
            {feedback}
          </div>
        )}

        <button
          onClick={trimite}
          disabled={trimitere}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
        >
          {trimitere ? 'Se trimite...' : 'Trimite solicitarea'}
        </button>
      </div>
    </div>
  );
}

/* ============================================
   TAB 4 — Rapoarte SFS (link rapid)
   ============================================ */
function TabRapoarte() {
  const rapoarte = [
    { cod: 'IPC21', nume: 'Impozit pe venit + contributii (lunar)', termen: 'pana la 25 a lunii urmatoare' },
    { cod: 'IRM19', nume: 'Retineri pe venit nerezidenti', termen: 'pana la 25 a lunii urmatoare' },
    { cod: '2-INV', nume: 'Investitii efectuate (anual)', termen: 'pana la 25 ianuarie' },
    { cod: 'TL13', nume: 'Taxe locale (semestrial)', termen: 'pana la 25 iulie / 25 ianuarie' },
    { cod: 'SIMM24', nume: 'Cifra de afaceri estimata IMM', termen: 'la cerere' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Rapoarte fiscale (SFS)</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Genereaza automat rapoartele cerute de Serviciul Fiscal de Stat. Datele se preiau din documentele
        validate ale clientilor.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rapoarte.map((r) => (
          <Link
            key={r.cod}
            to={`/reports?tip=${r.cod.toLowerCase()}`}
            className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition block"
          >
            <div className="text-xs font-bold text-indigo-700 mb-1">{r.cod}</div>
            <div className="font-semibold text-neutral-900 mb-2 leading-snug">{r.nume}</div>
            <div className="text-xs text-neutral-500">{r.termen}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link to="/reports" className="text-sm font-semibold text-indigo-700 hover:underline">
          → Vezi toate rapoartele generate
        </Link>
      </div>
    </div>
  );
}

/* ============================================
   COMPONENTE COMUNE
   ============================================ */

function CardStareGoala({ text, icon = '📂' }: { text: string; icon?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-neutral-600">{text}</p>
    </div>
  );
}

function CardClient({ client }: { client: UserData }) {
  const [openNotes, setOpenNotes] = useState(false);
  const [notes, setNotesState] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  async function deschideNote() {
    setOpenNotes(true);
    setLoadingNotes(true);
    try {
      const r = await fetchClientNotes(client.id);
      setNotesState(r.notes);
      setSavedAt(r.updated_at);
    } catch (e) {
      console.warn('fetch notes failed', e);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function salveazaNotes() {
    setSavingNotes(true);
    try {
      await setClientNotes(client.id, notes);
      setSavedAt(new Date().toISOString());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare salvare');
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
            {(client.full_name || client.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-neutral-900 truncate">{client.full_name || client.username}</div>
            <div className="text-xs text-neutral-500 truncate">{client.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-neutral-100">
          <Link
            to={`/documents?client=${client.id}`}
            className="text-center text-xs px-2 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold"
          >
            Documente
          </Link>
          <Link
            to={`/reports?client=${client.id}`}
            className="text-center text-xs px-2 py-1.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold"
          >
            Rapoarte
          </Link>
          <button
            onClick={deschideNote}
            className="text-center text-xs px-2 py-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold"
          >
            📝 Note
          </button>
        </div>
      </div>

      {openNotes && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setOpenNotes(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Note interne · {client.full_name || client.username}</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Particularitati fiscale, contact preferat, deductibilitate, etc. Vizibile doar pentru tine.
            </p>
            {loadingNotes ? (
              <p className="text-sm text-neutral-500 py-6 text-center">Se incarca...</p>
            ) : (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotesState(e.target.value)}
                  rows={8}
                  placeholder="Ex: clientul prefera contact telefonic dimineata. Lucreaza in industria IT cu cota TVA 12%..."
                  className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
                {savedAt && (
                  <div className="text-xs text-neutral-500 mt-1">
                    Ultima actualizare: {new Date(savedAt).toLocaleString('ro')}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setOpenNotes(false)}
                    className="px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold text-sm"
                  >
                    Inchide
                  </button>
                  <button
                    onClick={salveazaNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {savingNotes ? 'Salvez...' : 'Salveaza note'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DialogPreluareClient({
  clienti,
  loading,
  onClose,
  onPreia,
}: {
  clienti: UserData[];
  loading: boolean;
  onClose: () => void;
  onPreia: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Preia un client</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Alege un client neasignat. Dupa preluare il vei vedea in panoul tau si ii vei putea accesa documentele.
        </p>

        <div className="overflow-y-auto flex-1 -mx-2">
          {loading ? (
            <p className="text-sm text-neutral-500 py-8 text-center">Se incarca lista...</p>
          ) : clienti.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">Niciun client neasignat in sistem.</p>
          ) : (
            clienti.map((c) => (
              <button
                key={c.id}
                onClick={() => onPreia(c.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-left transition"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                  {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">{c.full_name || c.username}</div>
                  <div className="text-xs text-neutral-500 truncate">{c.email}</div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-3 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold">
            Inchide
          </button>
        </div>
      </div>
    </div>
  );
}

function CardCoada({
  doc,
  selectat,
  onClick,
}: {
  doc: DocumentData;
  selectat: boolean;
  onClick: () => void;
}) {
  const urg = doc.urgency_score ?? 0;
  const culoareUrg =
    urg >= 0.75
      ? 'bg-red-100 text-red-700 border-red-300'
      : urg >= 0.5
      ? 'bg-amber-100 text-amber-700 border-amber-300'
      : 'bg-emerald-100 text-emerald-700 border-emerald-300';

  const etichetaUrg = urg >= 0.75 ? 'URGENT' : urg >= 0.5 ? 'MEDIU' : 'NORMAL';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition ${
        selectat
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-neutral-200 bg-white hover:border-indigo-200 hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="font-semibold text-sm text-neutral-900 line-clamp-1 flex-1">{doc.title}</div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${culoareUrg}`}>
          {etichetaUrg}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>{DOCUMENT_TYPES[doc.document_type] || doc.document_type}</span>
        <span>•</span>
        <span>{DOCUMENT_STATUSES[doc.status] || doc.status}</span>
        {doc.has_flagged_fields && (
          <span className="ml-auto text-amber-600 font-semibold">⚠ Necesita atentie</span>
        )}
      </div>
    </button>
  );
}

function PanouValidare({
  doc,
  ocr,
  loading,
  onProceseaza,
  onAproba,
  onSalveazaCorectii,
  proceseaza,
  feedbackProcesare,
}: {
  doc: DocumentData;
  ocr: DocumentOcrData | null;
  loading: boolean;
  onProceseaza: () => void;
  onAproba: () => void | Promise<void>;
  onSalveazaCorectii: (corectii: Record<string, string>) => void | Promise<void>;
  proceseaza: boolean;
  feedbackProcesare: string | null;
}) {
  const campuri = ocr?.extracted_fields || [];

  // Sortam campurile cu confidence sub 80% sus pentru atentia contabilului
  const sortate = useMemo(() => {
    return [...campuri].sort((a, b) => {
      if (a.is_flagged && !b.is_flagged) return -1;
      if (!a.is_flagged && b.is_flagged) return 1;
      return a.confidence - b.confidence;
    });
  }, [campuri]);

  // State pentru valorile editate — keyed pe field_name. Resetam cand se schimba documentul.
  const [valoriEditate, setValoriEditate] = useState<Record<string, string>>({});
  const [actiune, setActiune] = useState<'aproba' | 'salveaza' | null>(null);

  useEffect(() => {
    // Initializam valorile cand se incarca campuri noi
    const init: Record<string, string> = {};
    campuri.forEach((f) => { init[f.field_name] = f.value; });
    setValoriEditate(init);
  }, [ocr?.document.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Detectam ce s-a schimbat fata de valorile originale (din OCR)
  const corectii = useMemo(() => {
    const delta: Record<string, string> = {};
    campuri.forEach((f) => {
      const noua = valoriEditate[f.field_name];
      if (noua !== undefined && noua !== f.value) {
        delta[f.field_name] = noua;
      }
    });
    return delta;
  }, [campuri, valoriEditate]);

  const areCorectii = Object.keys(corectii).length > 0;

  async function handleAproba() {
    setActiune('aproba');
    try {
      await onAproba();
    } finally {
      setActiune(null);
    }
  }

  async function handleSalveaza() {
    setActiune('salveaza');
    try {
      await onSalveazaCorectii(corectii);
    } finally {
      setActiune(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-neutral-900">{doc.title}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
              {DOCUMENT_TYPES[doc.document_type] || doc.document_type}
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              {DOCUMENT_STATUSES[doc.status] || doc.status}
            </span>
            {doc.avg_ocr_confidence !== null && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                OCR conf: {Math.round((doc.avg_ocr_confidence || 0) * 100)}%
              </span>
            )}
          </div>
        </div>
        {campuri.length > 0 && (
          <button
            onClick={onProceseaza}
            disabled={proceseaza}
            className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md font-semibold text-neutral-700 whitespace-nowrap disabled:opacity-50"
            title="Refa procesarea AI (OCR + clasificare + extractie)"
          >
            {proceseaza ? '⏳ Procesez...' : '🔄 Reproceseaza'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500 py-8 text-center">Se incarca datele OCR...</p>
      ) : campuri.length === 0 ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
            Acest document nu are inca campuri extrase de AI. Apasa butonul de mai jos pentru a
            lansa procesarea (OCR + clasificare + extractie entitati).
          </div>
          <button
            onClick={onProceseaza}
            disabled={proceseaza}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {proceseaza ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Se proceseaza...
              </>
            ) : (
              <>🤖 Lanseaza procesare AI</>
            )}
          </button>
          {feedbackProcesare && (
            <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-2">
              {feedbackProcesare}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs font-bold text-neutral-500 uppercase mb-2">
            Campuri extrase ({campuri.length})
          </div>
          {sortate.map((f) => {
            const conf = Math.round(f.confidence * 100);
            const galben = f.confidence < 0.8;
            return (
              <div
                key={f.id}
                className={`rounded-lg border p-3 ${
                  galben ? 'border-amber-300 bg-amber-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold uppercase text-neutral-500">{f.field_name}</div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      galben ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {conf}%
                  </span>
                </div>
                <input
                  type="text"
                  value={valoriEditate[f.field_name] ?? f.value}
                  onChange={(e) => setValoriEditate((prev) => ({ ...prev, [f.field_name]: e.target.value }))}
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-neutral-900 focus:outline-none"
                />
                {galben && (
                  <div className="text-[11px] text-amber-700 mt-1">
                    Confidence sub 80% — verifica si corecteaza valoarea daca e gresita.
                  </div>
                )}
              </div>
            );
          })}

          {feedbackProcesare && (
            <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-2 mt-3">
              {feedbackProcesare}
            </div>
          )}

          <div className="flex gap-2 pt-3 mt-3 border-t border-neutral-100">
            <button
              onClick={handleAproba}
              disabled={actiune !== null}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
              title="Marcheaza documentul ca aprobat (status: APROBAT) si genereaza un exemplu pozitiv pentru reantrenare AI"
            >
              {actiune === 'aproba' ? '⏳ Aprob...' : '✓ Aproba document'}
            </button>
            <button
              onClick={handleSalveaza}
              disabled={!areCorectii || actiune !== null}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
              title={
                areCorectii
                  ? `Salveaza ${Object.keys(corectii).length} corectii si genereaza un exemplu de antrenare`
                  : 'Modifica un camp inainte ca sa salvezi corectii'
              }
            >
              {actiune === 'salveaza'
                ? '⏳ Salvez...'
                : areCorectii
                  ? `Salveaza corectii (${Object.keys(corectii).length})`
                  : 'Salveaza corectii'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   TAB — Chat clienti (conversatii escalate de Djarvis)
   ============================================ */
function TabChatClienti() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reloadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEscalatedConversations(showResolved);
      setConvos(data);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare incarcare conversatii');
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  useEffect(() => { reloadList(); }, [reloadList]);

  // Polling — refresh detail la fiecare 5s daca o conversatie e selectata si deschisa
  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    const tick = async () => {
      try {
        const d = await getEscalatedDetail(selectedId);
        if (mounted) setDetail(d);
      } catch { /* ignore */ }
    };
    const interval = setInterval(tick, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [selectedId]);

  async function selecteazaConvo(id: string) {
    setSelectedId(id);
    setDetail(null);
    setReply('');
    setFeedback(null);
    setLoadingDetail(true);
    try {
      const d = await getEscalatedDetail(id);
      setDetail(d);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare detaliu');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function trimiteRaspuns() {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      await respondToEscalation(selectedId, reply.trim());
      setReply('');
      // Reincarca conversatia ca sa apara mesajul nou
      const d = await getEscalatedDetail(selectedId);
      setDetail(d);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare la trimitere');
    } finally {
      setSending(false);
    }
  }

  async function rezolva() {
    if (!selectedId) return;
    if (!confirm('Marchez conversatia ca rezolvata? Va salva intrebarea+raspunsul in FAQ ca AI sa raspunda data viitoare.')) return;
    setResolving(true);
    try {
      await resolveConversation(selectedId);
      setFeedback('✓ Conversatie rezolvata. Q&A salvat in FAQ.');
      await reloadList();
      setSelectedId(null);
      setDetail(null);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare la rezolvare');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
      {/* Stanga — lista conversatii */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 max-h-[78vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="font-bold text-neutral-900">
            Întrebări escaladate
            <span className="ml-2 text-xs font-normal text-neutral-500">({convos.length})</span>
          </h2>
          <label className="text-xs text-neutral-600 inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            include rezolvate
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca...</p>
        ) : convos.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center italic">
            Niciuna conversatie escaladata. Cand Djarvis nu poate raspunde, intrebarea apare aici.
          </p>
        ) : (
          <div className="space-y-2">
            {convos.map((c) => {
              const ultimMesaj = c.messages?.[c.messages.length - 1];
              const primulMesaj = c.messages?.find((m) => m.sender_type === 'client');
              return (
                <button
                  key={c.id}
                  onClick={() => selecteazaConvo(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedId === c.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-neutral-200 bg-white hover:border-indigo-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-xs font-semibold text-neutral-500">
                      Client: {c.user_id.slice(0, 8)}...
                    </span>
                    {c.is_resolved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        REZOLVAT
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        DESCHIS
                      </span>
                    )}
                  </div>
                  {primulMesaj && (
                    <div className="text-sm font-medium text-neutral-900 line-clamp-2">
                      {primulMesaj.content}
                    </div>
                  )}
                  {ultimMesaj && ultimMesaj.id !== primulMesaj?.id && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Ultim: {ultimMesaj.sender_type === 'contabil' ? '✉ tu' : ultimMesaj.sender_type === 'client' ? '👤 client' : '🤖 ai'}: {ultimMesaj.content.slice(0, 60)}...
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {new Date(c.created_at).toLocaleString('ro')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dreapta — conversatie + reply */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 max-h-[78vh] flex flex-col">
        {!selectedId ? (
          <CardStareGoala
            text="Selecteaza o conversatie din stanga pentru a o citi si raspunde."
            icon="👈"
          />
        ) : loadingDetail || !detail ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca conversatia...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Conversatie cu clientul</h3>
                <p className="text-xs text-neutral-500">
                  Client ID: {detail.user_id.slice(0, 8)}... · {detail.messages.length} mesaje
                </p>
              </div>
              {!detail.is_resolved && (
                <button
                  onClick={rezolva}
                  disabled={resolving}
                  className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md disabled:opacity-50"
                >
                  {resolving ? 'Rezolv...' : '✓ Marcheaza rezolvat'}
                </button>
              )}
            </div>

            {/* Mesaje */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {detail.messages.map((m: ChatMsg) => {
                const aliniat =
                  m.sender_type === 'contabil' ? 'justify-end' : 'justify-start';
                const bula =
                  m.sender_type === 'contabil'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : m.sender_type === 'ai'
                      ? 'bg-neutral-200 text-neutral-800 rounded-bl-md'
                      : 'bg-indigo-100 text-indigo-900 rounded-bl-md';
                const eticheta =
                  m.sender_type === 'contabil' ? '✉ Tu (contabil)' :
                  m.sender_type === 'ai' ? '🤖 Djarvis' :
                  '👤 Client';
                return (
                  <div key={m.id} className={`flex ${aliniat}`}>
                    <div className="max-w-[80%]">
                      <div className="text-[10px] font-bold uppercase text-neutral-500 mb-0.5">
                        {eticheta}
                      </div>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${bula}`}>
                        {m.content}
                      </div>
                      <div className={`text-[10px] text-neutral-400 mt-0.5 ${m.sender_type === 'contabil' ? 'text-right' : ''}`}>
                        {new Date(m.created_at).toLocaleString('ro')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {feedback && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-2 my-2">
                {feedback}
              </div>
            )}

            {/* Reply */}
            {!detail.is_resolved ? (
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
                    onClick={trimiteRaspuns}
                    disabled={!reply.trim() || sending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:opacity-50 text-sm"
                  >
                    {sending ? 'Trimit...' : 'Trimite raspuns'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-neutral-100 pt-3 mt-3 text-xs text-neutral-500 italic text-center">
                Conversatie rezolvata. Q&A salvat in baza FAQ.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contabil;

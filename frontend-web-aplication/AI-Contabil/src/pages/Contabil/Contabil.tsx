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

import { fetchDocumentOcr } from '../../api/trainingApi';
import type { DocumentOcrData } from '../../api/trainingApi';

type Tab = 'clienti' | 'coada' | 'solicitari' | 'rapoarte';

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

  // Document selectat pentru validare (panou dreapta)
  const [docSelectat, setDocSelectat] = useState<DocumentData | null>(null);
  const [ocrData, setOcrData] = useState<DocumentOcrData | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
      {/* Stanga — coada */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 max-h-[78vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
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

        {eroare && <div className="text-sm text-red-700 bg-red-50 rounded p-2 mb-3">{eroare}</div>}

        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Se incarca...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Niciun document in coada.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <CardCoada
                key={d.id}
                doc={d}
                selectat={docSelectat?.id === d.id}
                onClick={() => selecteazaDoc(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dreapta — panou validare */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 max-h-[78vh] overflow-y-auto">
        {!docSelectat ? (
          <CardStareGoala text="Selecteaza un document din coada pentru a-l valida." icon="👈" />
        ) : (
          <PanouValidare doc={docSelectat} ocr={ocrData} loading={loadingOcr} />
        )}
      </div>
    </div>
  );
}

/* ============================================
   TAB 3 — Solicitari catre clienti
   ============================================ */
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
  return (
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
      <div className="flex gap-2 pt-3 border-t border-neutral-100">
        <Link
          to={`/documents?client=${client.id}`}
          className="flex-1 text-center text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold"
        >
          Documente
        </Link>
        <Link
          to={`/reports?client=${client.id}`}
          className="flex-1 text-center text-xs px-3 py-1.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold"
        >
          Rapoarte
        </Link>
      </div>
    </div>
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
}: {
  doc: DocumentData;
  ocr: DocumentOcrData | null;
  loading: boolean;
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

  return (
    <div>
      <div className="mb-4">
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

      {loading ? (
        <p className="text-sm text-neutral-500 py-8 text-center">Se incarca datele OCR...</p>
      ) : campuri.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
          Acest document nu are inca campuri extrase de AI. Lanseaza pipeline-ul de procesare sau
          asteapta finalizarea OCR-ului in fundal.
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
                  defaultValue={f.value}
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

          <div className="flex gap-2 pt-3 mt-3 border-t border-neutral-100">
            <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md">
              Aproba document
            </button>
            <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-md">
              Salveaza corectii
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contabil;

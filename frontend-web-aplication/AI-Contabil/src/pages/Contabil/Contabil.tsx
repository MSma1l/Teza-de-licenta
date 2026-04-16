/* ============================================
   PAGINA CONTABIL - Dashboard

   Vizualizare pentru utilizatorii cu rol CONTABIL:
   - Lista clientilor asignati lui
   - Buton "Asigneaza client" (alege din lista de CLIENT-i si il preia)
   - Acces rapid la documentele fiecarui client

   Acces: role === 'contabil' sau 'admin'.
   ============================================ */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { getMyClients, listUsers, assignClient } from '../../api/usersApi';
import type { UserData } from '../../api/authApi';

const Contabil = () => {
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900">Clientii mei</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Panou de lucru contabil. Vezi clientii asignati si acceseaza documentele lor.
            </p>
          </div>
          <button
            onClick={deschideDialog}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Preia un client
          </button>
        </div>

        {eroare && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
            {eroare}
          </div>
        )}

        {loading ? (
          <CardStareGoala text="Se incarca clientii..." />
        ) : clienti.length === 0 ? (
          <CardStareGoala
            text="Inca nu ai clienti asignati. Apasa „Preia un client” ca sa incepi."
            icon="👋"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clienti.map((c) => <CardClient key={c.id} client={c} />)}
          </div>
        )}

        {/* Link-uri rapide jos */}
        <div className="mt-8 flex gap-3 flex-wrap text-sm">
          <Link to="/documents" className="text-indigo-700 hover:underline font-semibold">
            Toate documentele
          </Link>
          <Link to="/reports" className="text-indigo-700 hover:underline font-semibold">
            Rapoarte
          </Link>
          <Link to="/training" className="text-indigo-700 hover:underline font-semibold">
            Antrenare AI (corectari OCR)
          </Link>
        </div>
      </div>

      {/* Dialog preluare client */}
      {dialogDeschis && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setDialogDeschis(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Preia un client</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Alege un client neasignat. Dupa preluare il vei vedea in panoul tau si ii vei putea accesa documentele.
            </p>

            <div className="overflow-y-auto flex-1 -mx-2">
              {loadingDisponibili ? (
                <p className="text-sm text-neutral-500 py-8 text-center">Se incarca lista...</p>
              ) : clientiDisponibili.length === 0 ? (
                <p className="text-sm text-neutral-500 py-8 text-center">
                  Niciun client neasignat in sistem.
                </p>
              ) : (
                clientiDisponibili.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => preiaClient(c.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-left transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{c.full_name || c.username}</div>
                      <div className="text-xs text-neutral-500 truncate">{c.email}</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-3 border-t border-neutral-100">
              <button onClick={() => setDialogDeschis(false)} className="px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold">
                Inchide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

export default Contabil;

/* ============================================
   GENERATOR DE DOCUMENTE + SERVICII 1C

   Disponibil pentru contabil si client. Generare PDF pe loc pentru:
     - Factura fiscala
     - Chitanta
     - Contract prestari servicii
     - Stat de plata (cu calcul automat fiscal RM)
     - Aviz de insotire marfa
     - Ordin de plata
   Plus mini-servicii 1C: calc salariu, calc TVA, plan de conturi.
   ============================================ */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import {
  downloadPdfTemplate,
  calcSalariu,
  calcTva,
  fetchPlanConturi,
  type FacturaItem,
  type CalcSalariu,
  type CalcTva,
  type PlanConturiItem,
} from '../../api/templatesApi';

type Tab =
  | 'factura'
  | 'chitanta'
  | 'contract'
  | 'stat_plata'
  | 'aviz'
  | 'ordin_plata'
  | 'calc_salariu'
  | 'calc_tva'
  | 'plan_conturi';

const Generator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'factura');

  const change = (t: Tab) => { setTab(t); setSearchParams({ tab: t }); };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn showNavLinks={false} />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">Generator documente</h1>
          <p className="text-sm text-neutral-600">
            Sabloane de documente si servicii contabile 1C-like, cu calcul automat conform legislatiei RM.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar tabs */}
          <aside className="bg-white rounded-xl border border-neutral-200 p-3 self-start">
            <div className="text-[10px] font-bold text-neutral-500 uppercase mb-2 px-2">Documente</div>
            {[
              { id: 'factura', icon: '🧾', label: 'Factura fiscala' },
              { id: 'chitanta', icon: '💵', label: 'Chitanta' },
              { id: 'contract', icon: '📜', label: 'Contract' },
              { id: 'stat_plata', icon: '💼', label: 'Stat de plata' },
              { id: 'aviz', icon: '📦', label: 'Aviz marfa' },
              { id: 'ordin_plata', icon: '💳', label: 'Ordin de plata' },
            ].map((b) => (
              <SideBtn key={b.id} active={tab === b.id} onClick={() => change(b.id as Tab)} icon={b.icon} label={b.label} />
            ))}
            <div className="text-[10px] font-bold text-neutral-500 uppercase mb-2 px-2 mt-4">Servicii 1C</div>
            {[
              { id: 'calc_salariu', icon: '🧮', label: 'Calculator salariu' },
              { id: 'calc_tva', icon: '%', label: 'Calculator TVA' },
              { id: 'plan_conturi', icon: '📊', label: 'Plan de conturi RM' },
            ].map((b) => (
              <SideBtn key={b.id} active={tab === b.id} onClick={() => change(b.id as Tab)} icon={b.icon} label={b.label} />
            ))}
          </aside>

          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            {tab === 'factura' && <FormFactura />}
            {tab === 'chitanta' && <FormChitanta />}
            {tab === 'contract' && <FormContract />}
            {tab === 'stat_plata' && <FormStatPlata />}
            {tab === 'aviz' && <FormAviz />}
            {tab === 'ordin_plata' && <FormOrdinPlata />}
            {tab === 'calc_salariu' && <ServiceCalcSalariu />}
            {tab === 'calc_tva' && <ServiceCalcTva />}
            {tab === 'plan_conturi' && <ServicePlanConturi />}
          </section>
        </div>
      </main>
    </div>
  );
};

const SideBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
      active ? 'bg-indigo-100 text-indigo-800' : 'text-neutral-700 hover:bg-neutral-100'
    }`}
  >
    <span className="text-base">{icon}</span>{label}
  </button>
);

// ==================================
// === Form: FACTURA FISCALA ========
// ==================================
function FormFactura() {
  const today = new Date().toISOString().split('T')[0];
  const [serie, setSerie] = useState('FA');
  const [numar, setNumar] = useState('001');
  const [data, setData] = useState(today);
  const [vendorNume, setVendorNume] = useState('Compania Mea SRL');
  const [vendorCui, setVendorCui] = useState('1010600000000');
  const [vendorAdresa, setVendorAdresa] = useState('mun. Chisinau, str. Stefan cel Mare 1');
  const [clientNume, setClientNume] = useState('');
  const [clientCui, setClientCui] = useState('');
  const [clientAdresa, setClientAdresa] = useState('');
  const [items, setItems] = useState<FacturaItem[]>([{ denumire: '', cantitate: 1, pret_unitar: 0, cota_tva: 20 }]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subtotal = items.reduce((s, it) => s + it.cantitate * it.pret_unitar, 0);
  const tva = items.reduce((s, it) => s + it.cantitate * it.pret_unitar * (it.cota_tva / 100), 0);

  async function genereaza() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('factura', {
        serie, numar, data, vendor_nume: vendorNume, vendor_cui: vendorCui, vendor_adresa: vendorAdresa,
        client_nume: clientNume, client_cui: clientCui || undefined, client_adresa: clientAdresa || undefined,
        items, moneda: 'MDL', note: note || undefined,
      }, `Factura_${serie}${numar}.pdf`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900 mb-4">🧾 Factura fiscala</h2>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="Seria" value={serie} onChange={setSerie} />
        <Field label="Numar" value={numar} onChange={setNumar} />
        <Field label="Data" value={data} onChange={setData} type="date" />
      </div>
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-2">Furnizor</h3>
      <Field label="Denumire furnizor *" value={vendorNume} onChange={setVendorNume} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="CUI furnizor *" value={vendorCui} onChange={setVendorCui} />
        <Field label="Adresa" value={vendorAdresa} onChange={setVendorAdresa} />
      </div>
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Cumparator</h3>
      <Field label="Denumire cumparator *" value={clientNume} onChange={setClientNume} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="CUI cumparator" value={clientCui} onChange={setClientCui} />
        <Field label="Adresa" value={clientAdresa} onChange={setClientAdresa} />
      </div>

      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-4">Articole</h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_120px_80px_30px] gap-2 items-end">
            <Field label={i === 0 ? 'Denumire' : ''} value={it.denumire} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, denumire: v } : x))} />
            <Field label={i === 0 ? 'Cant.' : ''} value={String(it.cantitate)} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, cantitate: parseFloat(v) || 0 } : x))} type="number" />
            <Field label={i === 0 ? 'Pret unit.' : ''} value={String(it.pret_unitar)} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, pret_unitar: parseFloat(v) || 0 } : x))} type="number" />
            <Field label={i === 0 ? 'TVA %' : ''} value={String(it.cota_tva)} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, cota_tva: parseFloat(v) || 0 } : x))} type="number" />
            <button onClick={() => setItems((p) => p.length > 1 ? p.filter((_, j) => j !== i) : p)} className="h-10 text-red-600 hover:text-red-800 font-bold">×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setItems((p) => [...p, { denumire: '', cantitate: 1, pret_unitar: 0, cota_tva: 20 }])} className="mt-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">+ Adauga articol</button>

      <div className="bg-neutral-50 rounded-md p-3 mt-4 text-sm">
        <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">{subtotal.toFixed(2)} MDL</span></div>
        <div className="flex justify-between"><span>TVA:</span><span className="font-bold">{tva.toFixed(2)} MDL</span></div>
        <div className="flex justify-between text-base"><span className="font-bold">TOTAL:</span><span className="font-bold text-indigo-700">{(subtotal + tva).toFixed(2)} MDL</span></div>
      </div>

      <Field label="Note (optional)" value={note} onChange={setNote} type="textarea" />

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={genereaza} disabled={busy || !clientNume || !items[0].denumire} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez PDF...' : '📄 Genereaza PDF'}
      </button>
    </div>
  );
}

// ==================================
// === Form: CHITANTA ===============
// ==================================
function FormChitanta() {
  const today = new Date().toISOString().split('T')[0];
  const [numar, setNumar] = useState('001');
  const [data, setData] = useState(today);
  const [suma, setSuma] = useState('0');
  const [deLa, setDeLa] = useState('');
  const [pentru, setPentru] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('chitanta', {
        numar, data, suma: parseFloat(suma) || 0, moneda: 'MDL', de_la: deLa, pentru,
      }, `Chitanta_${numar}.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare'); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">💵 Chitanta</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numar *" value={numar} onChange={setNumar} />
        <Field label="Data *" value={data} onChange={setData} type="date" />
      </div>
      <Field label="Suma (MDL) *" value={suma} onChange={setSuma} type="number" />
      <Field label="Primita de la *" value={deLa} onChange={setDeLa} placeholder="Numele platitorului" />
      <Field label="Pentru *" value={pentru} onChange={setPentru} placeholder="Servicii prestate / produs" />
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={gen} disabled={busy || !deLa || !pentru} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez...' : '📄 Genereaza PDF'}
      </button>
    </div>
  );
}

// ==================================
// === Form: CONTRACT ===============
// ==================================
function FormContract() {
  const today = new Date().toISOString().split('T')[0];
  const [d, setD] = useState({ numar: '001', data: today, parte_a_nume: '', parte_a_cui: '', parte_b_nume: '', parte_b_cui: '', obiect: '', valoare: '0', durata: '12 luni', clauze_extra: '' });
  const set = (k: keyof typeof d) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('contract', {
        ...d, valoare: parseFloat(d.valoare) || 0, moneda: 'MDL',
        parte_b_cui: d.parte_b_cui || undefined,
        clauze_extra: d.clauze_extra || undefined,
      }, `Contract_${d.numar}.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare'); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📜 Contract prestari servicii</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numar *" value={d.numar} onChange={set('numar')} />
        <Field label="Data *" value={d.data} onChange={set('data')} type="date" />
      </div>
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Prestator</h3>
      <Field label="Denumire *" value={d.parte_a_nume} onChange={set('parte_a_nume')} />
      <Field label="CUI *" value={d.parte_a_cui} onChange={set('parte_a_cui')} />
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Beneficiar</h3>
      <Field label="Denumire *" value={d.parte_b_nume} onChange={set('parte_b_nume')} />
      <Field label="CUI" value={d.parte_b_cui} onChange={set('parte_b_cui')} />
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Detalii contract</h3>
      <Field label="Obiectul contractului *" value={d.obiect} onChange={set('obiect')} type="textarea" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valoare (MDL) *" value={d.valoare} onChange={set('valoare')} type="number" />
        <Field label="Durata" value={d.durata} onChange={set('durata')} placeholder="12 luni" />
      </div>
      <Field label="Clauze suplimentare (optional)" value={d.clauze_extra} onChange={set('clauze_extra')} type="textarea" />
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={gen} disabled={busy || !d.parte_a_nume || !d.parte_b_nume || !d.obiect} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez...' : '📄 Genereaza PDF'}
      </button>
    </div>
  );
}

// ==================================
// === Form: STAT DE PLATA ==========
// ==================================
function FormStatPlata() {
  const [d, setD] = useState({ luna: 'Aprilie 2026', angajat_nume: '', angajat_idnp: '', functie: '', salariu_brut: '10000', zile_lucrate: '22', angajator: '' });
  const set = (k: keyof typeof d) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('stat-plata', {
        ...d,
        salariu_brut: parseFloat(d.salariu_brut) || 0,
        zile_lucrate: parseInt(d.zile_lucrate) || 22,
        angajat_idnp: d.angajat_idnp || undefined,
      }, `StatPlata_${d.angajat_nume.replace(/\s+/g, '_')}_${d.luna.replace(/\s+/g, '_')}.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare'); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">💼 Stat de plata <span className="text-xs font-normal text-neutral-500">(calcul automat IVS 12% + CAS 6% + CAM 9%)</span></h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Luna *" value={d.luna} onChange={set('luna')} placeholder="Aprilie 2026" />
        <Field label="Angajator *" value={d.angajator} onChange={set('angajator')} placeholder="Compania mea SRL" />
      </div>
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Date angajat</h3>
      <Field label="Nume angajat *" value={d.angajat_nume} onChange={set('angajat_nume')} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="IDNP" value={d.angajat_idnp} onChange={set('angajat_idnp')} placeholder="13 cifre" />
        <Field label="Functie *" value={d.functie} onChange={set('functie')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Salariu brut (MDL) *" value={d.salariu_brut} onChange={set('salariu_brut')} type="number" />
        <Field label="Zile lucrate" value={d.zile_lucrate} onChange={set('zile_lucrate')} type="number" />
      </div>
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={gen} disabled={busy || !d.angajat_nume || !d.angajator} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez...' : '📄 Genereaza PDF cu calcul automat'}
      </button>
    </div>
  );
}

// ==================================
// === Form: AVIZ ===================
// ==================================
function FormAviz() {
  const today = new Date().toISOString().split('T')[0];
  const [d, setD] = useState({ numar: '001', data: today, expeditor: '', destinatar: '', transport: '' });
  const [items, setItems] = useState<FacturaItem[]>([{ denumire: '', cantitate: 1, pret_unitar: 0, cota_tva: 0 }]);
  const set = (k: keyof typeof d) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('aviz', { ...d, transport: d.transport || undefined, items }, `Aviz_${d.numar}.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare'); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📦 Aviz de insotire a marfii</h2>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Numar *" value={d.numar} onChange={set('numar')} />
        <Field label="Data *" value={d.data} onChange={set('data')} type="date" />
        <Field label="Transport" value={d.transport} onChange={set('transport')} placeholder="Nr auto" />
      </div>
      <Field label="Expeditor *" value={d.expeditor} onChange={set('expeditor')} />
      <Field label="Destinatar *" value={d.destinatar} onChange={set('destinatar')} />
      <h3 className="font-bold text-sm text-neutral-700 mb-2 mt-3">Articole</h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_30px] gap-2 items-end">
            <Field label={i === 0 ? 'Denumire' : ''} value={it.denumire} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, denumire: v } : x))} />
            <Field label={i === 0 ? 'Cantitate' : ''} value={String(it.cantitate)} onChange={(v) => setItems((p) => p.map((x, j) => j === i ? { ...x, cantitate: parseFloat(v) || 0 } : x))} type="number" />
            <button onClick={() => setItems((p) => p.length > 1 ? p.filter((_, j) => j !== i) : p)} className="h-10 text-red-600 hover:text-red-800 font-bold">×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setItems((p) => [...p, { denumire: '', cantitate: 1, pret_unitar: 0, cota_tva: 0 }])} className="mt-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">+ Adauga</button>
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={gen} disabled={busy || !d.expeditor || !d.destinatar} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez...' : '📄 Genereaza PDF'}
      </button>
    </div>
  );
}

// ==================================
// === Form: ORDIN PLATA ============
// ==================================
function FormOrdinPlata() {
  const today = new Date().toISOString().split('T')[0];
  const [d, setD] = useState({ numar: '001', data: today, platitor: '', platitor_cont: '', beneficiar: '', beneficiar_cont: '', suma: '0', detalii_plata: '' });
  const set = (k: keyof typeof d) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setBusy(true); setErr(null);
    try {
      await downloadPdfTemplate('ordin-plata', { ...d, suma: parseFloat(d.suma) || 0, moneda: 'MDL' }, `OrdinPlata_${d.numar}.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare'); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">💳 Ordin de plata bancara</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numar *" value={d.numar} onChange={set('numar')} />
        <Field label="Data *" value={d.data} onChange={set('data')} type="date" />
      </div>
      <Field label="Platitor *" value={d.platitor} onChange={set('platitor')} />
      <Field label="Cont platitor (IBAN) *" value={d.platitor_cont} onChange={set('platitor_cont')} placeholder="MD24EX..." />
      <Field label="Beneficiar *" value={d.beneficiar} onChange={set('beneficiar')} />
      <Field label="Cont beneficiar (IBAN) *" value={d.beneficiar_cont} onChange={set('beneficiar_cont')} placeholder="MD..." />
      <Field label="Suma (MDL) *" value={d.suma} onChange={set('suma')} type="number" />
      <Field label="Detalii plata *" value={d.detalii_plata} onChange={set('detalii_plata')} type="textarea" />
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">{err}</div>}
      <button onClick={gen} disabled={busy || !d.platitor || !d.beneficiar} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50">
        {busy ? 'Generez...' : '📄 Genereaza PDF'}
      </button>
    </div>
  );
}

// ==================================
// === Service: CALC SALARIU ========
// ==================================
function ServiceCalcSalariu() {
  const [brut, setBrut] = useState('10000');
  const [intretinere, setIntretinere] = useState('0');
  const [r, setR] = useState<CalcSalariu | null>(null);
  const [busy, setBusy] = useState(false);

  async function calc() {
    setBusy(true);
    try { setR(await calcSalariu(parseFloat(brut) || 0, parseInt(intretinere) || 0)); }
    catch { setR(null); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🧮 Calculator salariu RM</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Calculeaza salariul net dintr-un brut, conform legislatiei RM 2026 (IVS 12%, CAS 6% angajat, CAM 9%, scutire personala 27.000 MDL/an).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Salariu brut (MDL)" value={brut} onChange={setBrut} type="number" />
        <Field label="Persoane intretinere" value={intretinere} onChange={setIntretinere} type="number" />
      </div>
      <button onClick={calc} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md disabled:opacity-50">
        {busy ? '...' : 'Calculeaza'}
      </button>

      {r && (
        <div className="bg-neutral-50 rounded-md p-4 mt-4 text-sm space-y-1">
          <Row k="Brut" v={r.brut} />
          <Row k="CAS angajat (6%)" v={r.cas_angajat} negative />
          <Row k="CAM angajat (9%)" v={r.cam_angajat} negative />
          <Row k="Scutire personala" v={r.scutire_personala} muted />
          <Row k="Baza impozabila" v={r.baza_impozabila} muted />
          <Row k="IVS (12%)" v={r.ivs} negative />
          <hr className="my-2" />
          <Row k="NET DE PLATA" v={r.net} bold large />
          <hr className="my-2" />
          <div className="text-xs text-neutral-600 mt-2">Cost angajator (informativ):</div>
          <Row k="CAS angajator (24%)" v={r.cas_angajator} muted />
          <Row k="Cost total" v={r.cost_total_angajator} bold />
        </div>
      )}
    </div>
  );
}

const Row = ({ k, v, negative, muted, bold, large }: { k: string; v: number; negative?: boolean; muted?: boolean; bold?: boolean; large?: boolean }) => (
  <div className={`flex justify-between ${large ? 'text-base' : ''} ${muted ? 'text-neutral-500' : ''}`}>
    <span className={bold ? 'font-bold' : ''}>{k}</span>
    <span className={`${bold ? 'font-bold' : ''} ${negative ? 'text-red-600' : ''}`}>
      {negative && '-'}{v.toLocaleString('ro')} MDL
    </span>
  </div>
);

// ==================================
// === Service: CALC TVA ============
// ==================================
function ServiceCalcTva() {
  const [suma, setSuma] = useState('1000');
  const [cota, setCota] = useState('20');
  const [incl, setIncl] = useState(false);
  const [r, setR] = useState<CalcTva | null>(null);
  const [busy, setBusy] = useState(false);

  async function calc() {
    setBusy(true);
    try { setR(await calcTva(parseFloat(suma) || 0, parseFloat(cota) || 0, incl)); } catch { setR(null); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">% Calculator TVA</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Suma (MDL)" value={suma} onChange={setSuma} type="number" />
        <Field label="Cota TVA (%)" value={cota} onChange={setCota} type="number" />
      </div>
      <label className="flex items-center gap-2 mb-3 text-sm">
        <input type="checkbox" checked={incl} onChange={(e) => setIncl(e.target.checked)} />
        Suma include deja TVA-ul (extragere)
      </label>
      <button onClick={calc} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md disabled:opacity-50">
        {busy ? '...' : 'Calculeaza'}
      </button>
      {r && (
        <div className="bg-neutral-50 rounded-md p-4 mt-4 text-sm space-y-1">
          <Row k="Baza" v={r.baza} />
          <Row k={`TVA (${r.cota}%)`} v={r.tva} />
          <hr className="my-2" />
          <Row k="TOTAL" v={r.total} bold large />
        </div>
      )}
    </div>
  );
}

// ==================================
// === Service: PLAN CONTURI ========
// ==================================
function ServicePlanConturi() {
  const [items, setItems] = useState<PlanConturiItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPlanConturi().then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);

  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (it.cod && it.cod.includes(q)) || (it.den && it.den.toLowerCase().includes(q)) || (it.title && it.title.toLowerCase().includes(q));
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📊 Plan de conturi RM</h2>
      <p className="text-sm text-neutral-600 mb-3">
        Plan de conturi simplificat al Republicii Moldova (referinta pentru note contabile si rapoarte financiare).
      </p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cauta dupa cod sau denumire..."
        className="w-full border border-neutral-200 rounded-md px-3 py-2 mb-3 text-sm focus:outline-none focus:border-indigo-400"
      />
      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
        {filtered.map((it, i) => it.title ? (
          <div key={`t-${i}`} className="bg-indigo-50 text-indigo-800 font-bold text-sm px-3 py-1.5 rounded-md mt-3">
            Clasa {it.cls} — {it.title}
          </div>
        ) : (
          <div key={`r-${i}`} className="flex gap-3 px-3 py-1.5 hover:bg-neutral-50 rounded text-sm">
            <code className="font-mono font-bold text-indigo-700 w-12">{it.cod}</code>
            <span className="text-neutral-700">{it.den}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-neutral-500 italic py-4 text-center">Nu s-au gasit conturi.</div>}
      </div>
    </div>
  );
}

// ==================================
// === Field reusable ===============
// ==================================
function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'date' | 'textarea';
  placeholder?: string;
}) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-xs font-semibold text-neutral-600 uppercase mb-1">{label}</span>}
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
      )}
    </label>
  );
}

export default Generator;

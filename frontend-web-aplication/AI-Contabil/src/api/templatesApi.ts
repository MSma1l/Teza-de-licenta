/* ============================================
   TEMPLATES API — generare PDF + calculatoare contabile
   ============================================ */
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3777/api/v1/ac';

export interface TemplateMeta {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export interface FacturaItem {
  denumire: string;
  cantitate: number;
  pret_unitar: number;
  cota_tva: number;
}

const auth = (): Record<string, string> => {
  const tok = localStorage.getItem('access_token');
  return tok ? { Authorization: `Bearer ${tok}` } : {};
};

export async function listTemplates(): Promise<{ templates: TemplateMeta[] }> {
  const r = await fetch(`${API_BASE}/templates/list`, { headers: auth() });
  if (!r.ok) throw new Error('Eroare incarcare sabloane');
  return r.json();
}

/** Trimite payload-ul, primeste un blob PDF si declanseaza download. */
export async function downloadPdfTemplate(
  templateId: string,
  payload: unknown,
  filename: string,
): Promise<void> {
  const r = await fetch(`${API_BASE}/templates/${templateId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const detail = err.detail
      ? Array.isArray(err.detail)
        ? err.detail.map((d: { msg: string }) => d.msg).join(', ')
        : err.detail
      : `HTTP ${r.status}`;
    throw new Error(detail);
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

export interface CalcSalariu {
  brut: number;
  cas_angajat: number;
  cam_angajat: number;
  scutire_personala: number;
  baza_impozabila: number;
  ivs: number;
  net: number;
  cas_angajator: number;
  cost_total_angajator: number;
}

export async function calcSalariu(salariu_brut: number, are_persoane_intretinere = 0): Promise<CalcSalariu> {
  const r = await fetch(`${API_BASE}/templates/servicii/calc-salariu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ salariu_brut, are_persoane_intretinere }),
  });
  if (!r.ok) throw new Error('Eroare calc salariu');
  return r.json();
}

export interface CalcTva {
  baza: number;
  tva: number;
  total: number;
  cota: number;
  include_tva: boolean;
}

export async function calcTva(suma: number, cota = 20, incl = false): Promise<CalcTva> {
  const r = await fetch(`${API_BASE}/templates/servicii/calc-tva`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ suma, cota, incl }),
  });
  if (!r.ok) throw new Error('Eroare calc TVA');
  return r.json();
}

export interface PlanConturiItem {
  cod?: string;
  den?: string;
  cls?: string;
  title?: string;
}

export async function fetchPlanConturi(): Promise<{ items: PlanConturiItem[] }> {
  const r = await fetch(`${API_BASE}/templates/servicii/plan-conturi`, { headers: auth() });
  if (!r.ok) throw new Error('Eroare plan conturi');
  return r.json();
}

// ============================================
// === AI auto-completare formulare ===========
// ============================================

export type GeneratorFormType =
  | 'factura' | 'chitanta' | 'contract'
  | 'stat_plata' | 'aviz' | 'ordin_plata';

export interface AiGenerateResponse {
  form_type: GeneratorFormType;
  fields: Record<string, unknown>;
  used_prompt: string;
  model: string;
}

export async function aiGenerateForm(
  form_type: GeneratorFormType,
  prompt: string,
): Promise<AiGenerateResponse> {
  const r = await fetch(`${API_BASE}/templates/ai-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ form_type, prompt }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const detail = err.detail
      ? Array.isArray(err.detail) ? err.detail.map((d: { msg: string }) => d.msg).join(', ') : err.detail
      : `HTTP ${r.status}`;
    throw new Error(detail);
  }
  return r.json();
}

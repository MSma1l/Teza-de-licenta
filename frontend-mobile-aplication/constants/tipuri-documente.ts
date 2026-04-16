/**
 * Tipuri de documente si modul recomandat de capturare.
 * Valorile (factura, chitanta, ...) trebuie sa corespunda cu DocumentType din
 * backend-project/app/models/document.py.
 */

export type CodTipDocument =
  | 'factura'
  | 'chitanta'
  | 'contract'
  | 'extras_bancar'
  | 'bon_fiscal'
  | 'declaratie'
  | 'act_constitutiv'
  | 'certificat'
  | 'proces_verbal'
  | 'stat_plata'
  | 'altele';

export type ModCapturare = 'simplu' | 'complex';

export interface InfoTipDocument {
  cod: CodTipDocument;
  eticheta: string;
  descriere: string;
  modRecomandat: ModCapturare;
  iconita: string; // nume Ionicons
}

/**
 * simplu  -> poza normala e suficienta (bonuri mici, chitante clare)
 * complex -> e nevoie de scanner cu ghidaj + filtre pt OCR bun
 *             (facturi detaliate, contracte, extrase bancare)
 */
export const TIPURI_DOCUMENTE: InfoTipDocument[] = [
  { cod: 'factura',         eticheta: 'Factura',          descriere: 'Factura fiscala detaliata',       modRecomandat: 'complex', iconita: 'receipt' },
  { cod: 'extras_bancar',   eticheta: 'Extras bancar',    descriere: 'Extras de cont de la banca',      modRecomandat: 'complex', iconita: 'card' },
  { cod: 'contract',        eticheta: 'Contract',         descriere: 'Contract sau anexa',              modRecomandat: 'complex', iconita: 'document-text' },
  { cod: 'declaratie',      eticheta: 'Declaratie',       descriere: 'Declaratie fiscala',              modRecomandat: 'complex', iconita: 'clipboard' },
  { cod: 'act_constitutiv', eticheta: 'Act constitutiv',  descriere: 'Act de infiintare firma',         modRecomandat: 'complex', iconita: 'business' },
  { cod: 'stat_plata',      eticheta: 'Stat de plata',    descriere: 'Borderou salarii',                modRecomandat: 'complex', iconita: 'people' },
  { cod: 'proces_verbal',   eticheta: 'Proces verbal',    descriere: 'Proces verbal de receptie',       modRecomandat: 'complex', iconita: 'reader' },
  { cod: 'bon_fiscal',      eticheta: 'Bon fiscal',       descriere: 'Bon de la casa de marcat',        modRecomandat: 'simplu',  iconita: 'pricetag' },
  { cod: 'chitanta',        eticheta: 'Chitanta',         descriere: 'Chitanta de mana sau tiparita',   modRecomandat: 'simplu',  iconita: 'cash' },
  { cod: 'certificat',      eticheta: 'Certificat',       descriere: 'Certificat / adeverinta',         modRecomandat: 'simplu',  iconita: 'ribbon' },
  { cod: 'altele',          eticheta: 'Altele',           descriere: 'Orice alt document',              modRecomandat: 'simplu',  iconita: 'folder-open' },
];

export function infoDupaCod(cod: string | null | undefined): InfoTipDocument {
  return TIPURI_DOCUMENTE.find((t) => t.cod === cod) ?? TIPURI_DOCUMENTE[TIPURI_DOCUMENTE.length - 1];
}

/**
 * Pragurile calitatii OCR — sub ele propunem reluarea scanarii.
 * Tinut aici pentru ca serverul sa poata fi actualizat independent
 * fara a schimba clientul (valorile sunt doar sugestie UI).
 */
export const PRAG_CONFIDENCE_OCR = 0.65;

import { citesteToken } from '@/lib/stocare/stocare-securizata';
import { cerereApi } from './client-api';
import type { FisierLocalDocument, RaspunsDocument } from '@/types/documente';

const URL_BAZA = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3777/api/v1/ac';

export interface DateUploadDocument {
  fisier: FisierLocalDocument;
  titlu: string;
  descriere?: string;
  tipDocument: string;
}

/**
 * Upload document prin multipart/form-data.
 * Nu folosim `uploadApi` din client-api deoarece pe React Native
 * FormData accepta `{ uri, name, type }` ca fisier si fetch-ul seteaza boundary automat
 * doar cand nu suprascriem Content-Type.
 */
export async function uploadDocumentApi(date: DateUploadDocument): Promise<RaspunsDocument> {
  const token = await citesteToken();
  const formData = new FormData();

  // React Native primeste fisier sub aceasta forma — TypeScript nu stie de ea.
  formData.append('file', {
    uri: date.fisier.uri,
    name: date.fisier.nume,
    type: date.fisier.mimeType,
  } as unknown as Blob);
  formData.append('title', date.titlu);
  if (date.descriere) formData.append('description', date.descriere);
  formData.append('document_type', date.tipDocument);

  const raspuns = await fetch(`${URL_BAZA}/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.detail || 'Upload esuat');
  }
  return raspuns.json();
}

/** Reia scanarea pentru un document existent (inlocuieste fisierul + reporneste OCR). */
export async function rescanDocumentApi(
  id: string,
  fisier: FisierLocalDocument
): Promise<RaspunsDocument> {
  const token = await citesteToken();
  const formData = new FormData();
  formData.append('file', {
    uri: fisier.uri,
    name: fisier.nume,
    type: fisier.mimeType,
  } as unknown as Blob);

  const raspuns = await fetch(`${URL_BAZA}/documents/${id}/rescan`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.detail || 'Rescanare esuata');
  }
  return raspuns.json();
}

export async function documentById(id: string): Promise<RaspunsDocument> {
  return cerereApi<RaspunsDocument>(`/documents/${id}`);
}

/**
 * Asteapta pana cand procesarea OCR se termina (sau expira timpul).
 * Returneaza ultimul document primit.
 */
export async function asteaptaProcesareOCR(
  id: string,
  opt: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<RaspunsDocument> {
  const timeoutMs = opt.timeoutMs ?? 45_000;
  const intervalMs = opt.intervalMs ?? 2_000;
  const sfarsit = Date.now() + timeoutMs;

  let ultim: RaspunsDocument | null = null;
  while (Date.now() < sfarsit) {
    ultim = await documentById(id);
    if (STARI_FINALIZATE.includes(ultim.status)) return ultim;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  // timeout — returneaza ce avem (UI va decide ce sa faca)
  return ultim ?? (await documentById(id));
}

const STARI_FINALIZATE = [
  'ocr_complet',
  'clasificat',
  'extras',
  'pending_approval',
  'requires_manual',
  'duplicate_detected',
  'verificat',
  'aprobat',
  'respins',
  'ocr_failed',
];

/**
 * Paleta de culori AI-Contabil — sincronizata cu frontend-ul web
 * Brand colors: gradient #4f46e5 (indigo) -> #0ea5e9 (sky)
 */
export const CuloriApp = {
  // Background
  fundal: '#FFFFFF',
  fundalSecundar: '#F8FAFC',
  fundalCard: '#FFFFFF',
  fundalGradient1: '#4f46e5',  // indigo - culoare principala
  fundalGradient2: '#0ea5e9',  // sky - culoare secundara

  // Text
  textPrimar: '#1e1b4b',       // dark indigo
  textSecundar: '#475569',     // slate
  textEstompat: '#94a3b8',
  textPeGradient: '#FFFFFF',

  // Brand
  primar: '#4f46e5',           // indigo principal (butoane, link-uri)
  primarHover: '#4338ca',      // indigo mai inchis
  secundar: '#0ea5e9',         // sky pentru accente
  accent: '#8b5cf6',           // violet pentru highlights

  // UI
  bordura: '#e2e8f0',
  borduraInputFocus: '#4f46e5',
  separator: '#f1f5f9',
  fundalInput: '#f8fafc',
  fundalButon: '#f1f5f9',

  // Status
  succes: '#10b981',           // green
  succesFundal: '#d1fae5',
  eroare: '#ef4444',           // red
  eroareFundal: '#fee2e2',
  avertizare: '#f59e0b',       // amber
  avertizareFundal: '#fef3c7',
  info: '#0ea5e9',
  infoFundal: '#e0f2fe',

  // Navigation
  fundalBaraNav: '#FFFFFF',
  baraNavActiv: '#4f46e5',
  baraNavInactiv: '#94a3b8',

  // Legacy aliases pentru compatibilitate
  bannerPrincipal: '#eef2ff',
  placeholderImagine: '#f1f5f9',
  borduraInput: '#e2e8f0',
};

/** Gradiente predefinite pentru folosire cu LinearGradient */
export const Gradiente = {
  principal: ['#4f46e5', '#0ea5e9'] as const,
  secundar: ['#8b5cf6', '#4f46e5'] as const,
  succes: ['#10b981', '#059669'] as const,
  fundal: ['#eef2ff', '#e0f2fe'] as const,
};

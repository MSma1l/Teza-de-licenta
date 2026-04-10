/**
 * Paleta de culori AI-Contabil — sincronizata cu frontend-ul web
 * Brand colors: gradient #4f46e5 (indigo) -> #0ea5e9 (sky)
 * CONTRAST RIDICAT - toate culorile text respecta WCAG AA
 */
export const CuloriApp = {
  // Background
  fundal: '#FFFFFF',
  fundalSecundar: '#F0F4FF',      // mai vizibil, tenta indigo
  fundalCard: '#FFFFFF',
  fundalGradient1: '#4f46e5',
  fundalGradient2: '#0ea5e9',

  // Text — contrast ridicat
  textPrimar: '#0f172a',          // aproape negru (era #1e1b4b)
  textSecundar: '#334155',        // mai inchis (era #475569)
  textEstompat: '#64748b',        // mai inchis (era #94a3b8)
  textPeGradient: '#FFFFFF',

  // Brand
  primar: '#4338ca',              // indigo mai inchis (era #4f46e5) — contrast AA pe alb
  primarDeschis: '#4f46e5',       // indigo original pt fundal
  primarHover: '#3730a3',
  secundar: '#0284c7',            // sky mai inchis (era #0ea5e9) — contrast AA
  accent: '#7c3aed',              // violet mai saturat (era #8b5cf6)

  // UI
  bordura: '#cbd5e1',             // mai vizibila (era #e2e8f0)
  borduraInputFocus: '#4338ca',
  separator: '#e2e8f0',
  fundalInput: '#f1f5f9',
  fundalButon: '#eef2ff',

  // Status
  succes: '#059669',              // green mai inchis (era #10b981)
  succesFundal: '#d1fae5',
  eroare: '#dc2626',              // red mai inchis (era #ef4444)
  eroareFundal: '#fee2e2',
  avertizare: '#d97706',          // amber mai inchis (era #f59e0b)
  avertizareFundal: '#fef3c7',
  info: '#0284c7',
  infoFundal: '#e0f2fe',

  // Navigation
  fundalBaraNav: '#FFFFFF',
  baraNavActiv: '#4338ca',
  baraNavInactiv: '#64748b',      // mai vizibil (era #94a3b8)

  // Legacy aliases
  bannerPrincipal: '#eef2ff',
  placeholderImagine: '#f1f5f9',
  borduraInput: '#cbd5e1',
};

/** Gradiente predefinite pentru folosire cu LinearGradient */
export const Gradiente = {
  principal: ['#4338ca', '#0284c7'] as const,
  secundar: ['#7c3aed', '#4338ca'] as const,
  succes: ['#059669', '#047857'] as const,
  fundal: ['#eef2ff', '#dbeafe'] as const,
};

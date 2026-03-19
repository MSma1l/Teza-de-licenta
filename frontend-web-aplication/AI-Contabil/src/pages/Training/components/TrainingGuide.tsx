/**
 * Training Guide - Ghid vizual pas cu pas pentru antrenarea modelului AI.
 * Explică fiecare pas: OCR, clasificare, extracție, corecții, antrenare.
 * Tailwind CSS only.
 */
import { useState } from 'react';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  details: string[];
  whatAiSees: string;
  whatYouDo: string;
  tip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Încărcarea Documentului',
    description: 'Încarcă un document scanat (PDF, PNG, TIFF). Scanarea trebuie să fie la minim 300 DPI.',
    details: [
      'Documentul trebuie să fie o scanare, nu o fotografie',
      'Format acceptat: PDF scanat, PNG, TIFF',
      'DPI minim: 300 (rezoluție înaltă)',
      'Documentul poate fi în română, engleză sau rusă',
    ],
    whatAiSees: 'AI-ul primește fișierul brut și verifică DPI-ul. Dacă DPI < 150, documentul e respins automat.',
    whatYouDo: 'Încarcă documentul din tab-ul "Revizie Documente" sau din zona de upload a contabilului.',
    tip: 'Scanează documentele la 300 DPI cu scanner fizic. Fotografiile de pe telefon au calitate slabă pentru OCR.',
  },
  {
    id: 2,
    title: 'Preprocessing (Pregătirea Imaginii)',
    description: 'Înainte de OCR, imaginea trece prin 5 pași de pregătire automată.',
    details: [
      'Deskew - corectarea rotației (dacă scanarea e ușor înclinată)',
      'Denoise - eliminarea zgomotului din imagine (pete, umbre)',
      'Binarizare - convertire în alb-negru pur (Otsu thresholding)',
      'Contrast - îmbunătățirea contrastului (CLAHE)',
      'DPI check - verificare rezoluție minimă',
    ],
    whatAiSees: 'AI-ul vede imaginea preprocessing-ată: alb-negru, dreaptă, fără zgomot. Textul e mult mai clar.',
    whatYouDo: 'Nu trebuie să faci nimic - acest pas e automat. Poți vedea rezultatul în overlay-ul OCR.',
    tip: 'Dacă overlay-ul arată multe zone roșii (confidence scăzut), documentul original poate fi de calitate slabă.',
  },
  {
    id: 3,
    title: 'OCR - Recunoașterea Textului',
    description: 'PaddleOCR citește fiecare cuvânt din imagine și returnează textul + poziția + confidence.',
    details: [
      'Fiecare cuvânt primește un "bounding box" (dreptunghi pe imagine)',
      'Fiecare cuvânt primește un scor de confidence (0-100%)',
      'Cuvinte cu confidence < 85% sunt marcate cu roșu pentru revizie',
      'Textul e grupat automat în secțiuni: header, body, footer',
    ],
    whatAiSees: 'AI-ul vede o listă de cuvinte cu poziții și confidence. Exemplu: "FACTURA" la (100, 50) cu 98.5%.',
    whatYouDo: 'În overlay, vezi dreptunghiurile colorate: verde (sigur), galben (atenție), roșu (nesigur). Click pe orice dreptunghi pentru detalii.',
    tip: 'Cuvintele roșii sunt cele mai importante de verificat. Dacă AI-ul a citit greșit, corectează în panoul din dreapta.',
  },
  {
    id: 4,
    title: 'Clasificarea Documentului',
    description: 'AI-ul determină tipul documentului: factură, chitanță, contract, declarație, etc.',
    details: [
      'Fără model antrenat: clasificare pe cuvinte cheie (ex: "factură" → tip factură)',
      'Cu model antrenat: clasificare BERT cu acuratețe >90%',
      'Confidence < 85% = documentul e marcat pentru revizie manuală',
      'Clasificarea corectă e esențială pentru extracția corectă a câmpurilor',
    ],
    whatAiSees: 'AI-ul citește tot textul și decide tipul. Exemplu: a văzut "FACTURA FISCALA", "TVA", "Furnizor" → clasifica ca "factură" cu 95%.',
    whatYouDo: 'Verifică tipul detectat în dropdown-ul "Clasificare Document". Dacă e greșit, selectează tipul corect.',
    tip: 'Fiecare corecție de tip document ajută AI-ul să învețe. După 50 de corecții, poți relansa antrenarea.',
  },
  {
    id: 5,
    title: 'Extracția Entităților (NER)',
    description: 'AI-ul identifică câmpurile importante: nr. factură, dată, furnizor, CUI, sume, IBAN.',
    details: [
      'Fără model antrenat: extracție cu regex (expresii regulate)',
      'Cu model antrenat: NER (Named Entity Recognition) pe baza BERT',
      'Fiecare câmp extras are un scor de confidence individual',
      'Câmpuri cu confidence < 85% sunt marcate cu "Nesigur"',
      'Câmpuri lipsă pot fi adăugate manual',
    ],
    whatAiSees: 'AI-ul scanează textul și caută pattern-uri. Exemplu: "RO12345678" → CUI, "25.03.2026" → Data, "1.500,00 LEI" → Total.',
    whatYouDo: 'Verifică fiecare câmp în "Câmpuri Extrase". Editează valorile greșite. Adaugă câmpuri pe care AI-ul le-a ratat.',
    tip: 'Nu sări peste câmpurile marcate "Nesigur" - sunt cele mai valoroase corecții pentru antrenare.',
  },
  {
    id: 6,
    title: 'Corecția și Confirmarea',
    description: 'Confirmă dacă totul e corect SAU corectează erorile. Fiecare acțiune generează un exemplu de antrenare.',
    details: [
      '"Totul e corect ✓" = confirmi că AI-ul a făcut totul bine (exemplu pozitiv)',
      '"Salvează Corecțiile" = trimiți corecțiile tale (exemplu de învățare)',
      'Poți corecta: tipul document, câmpurile extrase, feedback urgență',
      'Fiecare corecție e salvată automat ca training example',
    ],
    whatAiSees: 'AI-ul primește: "Am prezis factură dar era contract" sau "Am extras CUI RO123 dar corect era RO456".',
    whatYouDo: 'Apasă "Totul e corect" dacă AI-ul a nimerit. Altfel, corectează ce e greșit și apasă "Salvează Corecțiile".',
    tip: 'Confirmările (exemplele pozitive) sunt la fel de importante ca corecțiile! Nu doar erorile contează.',
  },
  {
    id: 7,
    title: 'Antrenarea Modelului',
    description: 'După 50+ corecții, poți lansa re-antrenarea. AI-ul învață din corecțiile tale.',
    details: [
      'Minim 50 de corecții necesare înainte de prima antrenare',
      'Antrenarea durează câteva minute (depinde de volumul de date)',
      'Modelul nou e evaluat automat pe un set de test',
      'Dacă modelul nou e mai bun → e promovat automat',
      'Dacă nu e mai bun → se păstrează modelul vechi',
      'Ultimele 5 versiuni sunt păstrate pentru rollback',
    ],
    whatAiSees: 'AI-ul primește toate corecțiile tale ca manual de învățare. Ajustează parametrii interni pentru a face mai puține greșeli.',
    whatYouDo: 'Du-te în tab-ul "Dashboard", verifică progresul (bară verde = gata), și apasă "Lansează Antrenare".',
    tip: 'Calitatea > cantitatea. 50 de corecții atente valorează mai mult decât 200 de corecții superficiale.',
  },
];

export default function TrainingGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <div className="animate-fade-in max-w-[900px]">
      <div className="mb-6">
        <h3 className="font-heading text-xl font-semibold text-neutral-black">
          Cum funcționează antrenarea AI
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          Parcurge fiecare pas pentru a înțelege cum să antrenezi modelul corect și eficient.
        </p>
      </div>

      {/* Overview Pipeline */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {GUIDE_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              onClick={() => setExpandedStep(step.id === expandedStep ? null : step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                expandedStep === step.id
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {step.id}
              </span>
              {step.title.split(' ')[0]}
            </button>
            {i < GUIDE_STEPS.length - 1 && (
              <span className="text-neutral-300 mx-1">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Steps */}
      <div className="space-y-3">
        {GUIDE_STEPS.map((step) => {
          const isExpanded = expandedStep === step.id;

          return (
            <div
              key={step.id}
              className={`border rounded-lg transition-all ${
                isExpanded ? 'border-primary bg-white shadow-sm' : 'border-neutral-200'
              }`}
            >
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isExpanded ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {step.id}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-black">{step.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                </div>
                <span className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-fade-in">
                  <div className="ml-12 space-y-4">
                    {/* Detail Points */}
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Detalii</p>
                      <ul className="space-y-1">
                        {step.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                            <span className="text-primary mt-0.5">•</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Two Column: AI sees / You do */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">
                          🤖 Ce vede AI-ul
                        </p>
                        <p className="text-xs text-blue-600">{step.whatAiSees}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          👤 Ce faci tu
                        </p>
                        <p className="text-xs text-green-600">{step.whatYouDo}</p>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-700">
                        <strong>💡 Sfat:</strong> {step.tip}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

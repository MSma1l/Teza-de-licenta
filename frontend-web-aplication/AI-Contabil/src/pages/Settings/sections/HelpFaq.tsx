/* ============================================
   SECȚIUNEA HELP / FAQ

   Pagina de ajutor cu întrebări frecvente:
   - Categorii de întrebări
   - Fiecare întrebare se poate deschide/închide
     (accordion/expandable)
   - Câmp de căutare

   NOTĂ: Datele vor veni din API în viitor.
   ============================================ */

import { useState } from 'react';

/* Importăm iconițe Material UI */
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/* Importăm tipurile */
import type { FaqItem } from '../../../models/settingsTypes';

/* Importăm stilurile */
import './HelpFaq.css';

/* --- Date mock pentru FAQ --- */
const faqData: FaqItem[] = [
  {
    id: '1',
    question: 'Cum pot crea un document nou?',
    answer: 'Pentru a crea un document nou, accesați pagina principală și apăsați butonul "Creare document". Urmați pașii indicați: selectați tipul documentului, completați datele necesare și scanați documentele cerute prin aplicația mobilă.',
    category: 'Documente',
  },
  {
    id: '2',
    question: 'Ce documente am nevoie pentru înregistrare?',
    answer: 'Pentru înregistrare aveți nevoie de: buletin/carte de identitate, un extras de cont bancar recent (nu mai vechi de 3 luni) și o adresă de email validă. Documentele se vor verifica automat prin sistem.',
    category: 'Cont',
  },
  {
    id: '3',
    question: 'Cum îmi schimb parola?',
    answer: 'Accesați Settings > Security > Change Password. Introduceți parola actuală, apoi parola nouă de două ori pentru confirmare. Parola trebuie să aibă minimum 8 caractere, o literă mare, o cifră și un caracter special.',
    category: 'Securitate',
  },
  {
    id: '4',
    question: 'Cât durează procesarea unui document?',
    answer: 'Procesarea unui document durează între 1-3 zile lucrătoare. Veți primi o notificare prin email și în aplicație când documentul este gata. Pentru documente urgente, contactați suportul tehnic.',
    category: 'Documente',
  },
  {
    id: '5',
    question: 'Cum pot contacta suportul tehnic?',
    answer: 'Puteți contacta suportul tehnic prin: 1) Chat-ul din aplicație (butonul din colțul din dreapta jos), 2) Email la support@aicontabil.md, 3) Telefon la +373 22 XXX XXX în zilele lucrătoare 09:00-18:00.',
    category: 'Suport',
  },
  {
    id: '6',
    question: 'Ce se întâmplă dacă documentul meu este respins?',
    answer: 'Dacă un document este respins, veți primi o notificare cu motivul respingerii. Puteți corecta informațiile și retrimite documentul. Cele mai frecvente motive sunt: calitate slabă a scanării, date incomplete sau documente expirate.',
    category: 'Documente',
  },
  {
    id: '7',
    question: 'Cum activez autentificarea în doi pași (2FA)?',
    answer: 'Accesați Settings > Security > Two-Factor Authentication și activați opțiunea. Veți primi un cod pe telefon sau email la fiecare autentificare. Acest pas suplimentar protejează contul împotriva accesului neautorizat.',
    category: 'Securitate',
  },
  {
    id: '8',
    question: 'Pot să anulez o cerere deja trimisă?',
    answer: 'Da, puteți anula o cerere atâta timp cât nu a fost deja procesată. Accesați secțiunea "Documentele mele", găsiți cererea și apăsați "Anulează". Dacă cererea este deja în procesare, contactați suportul tehnic.',
    category: 'Documente',
  },
];

/* --- Componenta HelpFaq --- */
const HelpFaq = () => {
  /* State pentru căutare */
  const [searchTerm, setSearchTerm] = useState('');

  /* State pentru întrebarea deschisă */
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  /* State pentru categoria activă */
  const [activeCategory, setActiveCategory] = useState<string>('Toate');

  /* Extragem categoriile unice */
  const categories = ['Toate', ...new Set(faqData.map((faq) => faq.category))];

  /* Filtrăm FAQ-urile */
  const filteredFaqs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Toate' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  /* Toggle deschidere/închidere întrebare */
  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="help-faq">
      {/* === Header === */}
      <div className="help-faq__header">
        <HelpOutlineOutlinedIcon className="help-faq__header-icon" />
        <h1 className="help-faq__title">Help & FAQ</h1>
      </div>

      {/* === Descriere === */}
      <p className="help-faq__desc">
        Găsiți răspunsuri la cele mai frecvente întrebări despre utilizarea platformei.
      </p>

      {/* === Câmpul de căutare === */}
      <div className="help-faq__search">
        <SearchIcon className="help-faq__search-icon" />
        <input
          type="text"
          className="help-faq__search-input"
          placeholder="Căutați o întrebare..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* === Categorii === */}
      <div className="help-faq__categories">
        {categories.map((category) => (
          <button
            key={category}
            className={`help-faq__category ${
              activeCategory === category ? 'help-faq__category--active' : ''
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* === Lista de întrebări === */}
      <div className="help-faq__list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`help-faq__item ${
                openFaqId === faq.id ? 'help-faq__item--open' : ''
              }`}
            >
              {/* Header-ul întrebării */}
              <div className="help-faq__item-header" onClick={() => toggleFaq(faq.id)}>
                <div className="help-faq__item-left">
                  <span className="help-faq__item-category">{faq.category}</span>
                  <h3 className="help-faq__item-question">{faq.question}</h3>
                </div>
                {openFaqId === faq.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </div>

              {/* Răspunsul (vizibil doar când e deschis) */}
              {openFaqId === faq.id && (
                <div className="help-faq__item-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="help-faq__empty">
            <p>Nu s-au găsit rezultate pentru căutarea dumneavoastră.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpFaq;

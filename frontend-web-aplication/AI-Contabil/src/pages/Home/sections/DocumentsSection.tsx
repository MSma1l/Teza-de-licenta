/* ============================================
   SECȚIUNEA DOCUMENTS

   Afișează cele mai generate documente într-un
   tabel cu 3 coloane. Fiecare coloană reprezintă
   un tip de document cu lista de informații
   necesare (marcate cu ✓).
   ============================================ */

import './DocumentsSection.css';

/* --- Datele tabelului - 3 documente cu câte 6 informații --- */
const documentsData = [
  {
    name: 'DocumentName',
    items: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
  {
    name: 'DocumentName',
    items: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
  {
    name: 'DocumentName',
    items: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
];

const DocumentsSection = () => {
  return (
    <section className="documents">
      {/* --- Label-ul mic verde "Document" --- */}
      <p className="documents__label">Document</p>

      {/* --- Titlul principal --- */}
      <h2 className="documents__title">
        The most often generated documents
      </h2>

      {/* --- Subtitlul descriptiv --- */}
      <p className="documents__subtitle">
        The following are the most often generated documents and the necessary information.
      </p>

      {/* --- Butonul de creare document --- */}
      <button className="documents__button">Create document</button>

      {/* --- Tabelul cu 3 coloane de documente --- */}
      <div className="documents__table">
        {documentsData.map((doc, index) => (
          <div key={index} className="documents__column">
            {/* Header-ul coloanei - numele documentului */}
            <div className="documents__column-header">{doc.name}</div>

            {/* Rândurile cu informații necesare */}
            {doc.items.map((item, itemIndex) => (
              <div key={itemIndex} className="documents__row">
                {/* Iconița check (✓) */}
                <span className="documents__check">✓</span>
                {/* Textul informației */}
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentsSection;

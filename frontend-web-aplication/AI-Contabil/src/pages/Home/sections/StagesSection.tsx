/* ============================================
   SECȚIUNEA STAGES OF CREATING A DOCUMENT

   Afișează cei 5 pași pentru crearea unui document
   cu INTERACTIVITATE:

   - La CLICK pe un pas (01, 02, etc.), imaginea
     din dreapta se schimbă cu animație (fade).
   - Pasul activ este evidențiat vizual (fundal,
     culoare diferită).
   - Implicit este selectat pasul 01.

   CUM FUNCȚIONEAZĂ:
   1. useState ține pasul activ curent (activeStep)
   2. La click pe un pas, setăm activeStep = index
   3. Imaginea din dreapta se schimbă pe baza
      activeStep (fiecare pas are propria imagine)
   4. Animația se face prin key pe container -
      React re-rendează cu fade la schimbarea key-ului

   NOTĂ: Imaginile sunt placeholder-uri.
   Înlocuiește src-ul cu imagini reale din assets.
   ============================================ */

import { useState } from 'react';
import './StagesSection.css';

/* --- Datele celor 5 pași ---
     Fiecare pas are: număr, text, placeholder imagine */
const stagesData = [
  {
    number: '01',
    text: 'Selecti the type of document',
    imageLabel: 'Selectare tip document',
    imageColor: '#d4e6f1',    /* Culoare fundal imagine - albastru deschis */
  },
  {
    number: '02',
    text: 'Entering the necessary data and scan the document with the mobile application',
    imageLabel: 'Introducere date & scanare',
    imageColor: '#d5f5e3',    /* Verde deschis */
  },
  {
    number: '03',
    text: 'Confirmation and validation of data with the Moobile application',
    imageLabel: 'Confirmare & validare date',
    imageColor: '#fdebd0',    /* Portocaliu deschis */
  },
  {
    number: '04',
    text: 'The generation of the act and the programming at the office for signature',
    imageLabel: 'Generare act & programare',
    imageColor: '#e8daef',    /* Mov deschis */
  },
  {
    number: '05',
    text: 'The request sent successfully',
    imageLabel: 'Cerere trimisă cu succes',
    imageColor: '#d4efdf',    /* Verde mentă */
  },
];

const StagesSection = () => {
  /* === STATE: Pasul activ curent (implicit primul - index 0) ===
     Când utilizatorul apasă pe un pas, activeStep se schimbă
     și imaginea din dreapta se actualizează automat */
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="stages">
      {/* === COLOANA STÂNGĂ: Titlu + Lista interactivă de pași === */}
      <div className="stages__content">
        {/* Titlul secțiunii */}
        <h2 className="stages__title">
          Stages of creating a document
        </h2>

        {/* Lista cu pași - fiecare pas este clickable */}
        <div className="stages__list">
          {stagesData.map((stage, index) => (
            <div
              key={stage.number}
              /* Adăugăm clasa "--active" pe pasul selectat */
              className={`stages__step ${activeStep === index ? 'stages__step--active' : ''}`}
              /* La click, setăm acest pas ca activ */
              onClick={() => setActiveStep(index)}
            >
              {/* Numărul pasului */}
              <span className="stages__step-number">{stage.number}</span>
              {/* Textul pasului */}
              <span className="stages__step-text">{stage.text}</span>
            </div>
          ))}
        </div>

        {/* Butonul de creare document */}
        <button className="stages__button">Create document</button>
      </div>

      {/* === COLOANA DREAPTĂ: Imaginea care se schimbă ===
          key={activeStep} forțează React să re-rendeze containerul
          la fiecare schimbare, declanșând animația CSS */}
      <div className="stages__image" key={activeStep}>
        <div
          className="stages__image-placeholder"
          style={{ backgroundColor: stagesData[activeStep].imageColor }}
        >
          {/* Textul placeholder - va fi înlocuit cu <img> real */}
          <span className="stages__image-label">
            {stagesData[activeStep].imageLabel}
          </span>
          {/* Indicator pas curent */}
          <span className="stages__image-step-number">
            {stagesData[activeStep].number}
          </span>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;

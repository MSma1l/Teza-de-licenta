/* ============================================
   SECȚIUNEA ABOUT PROJECT

   Prezintă informații despre proiect:
   - Descriere generală
   - Legile principale din domeniu (4 carduri)
   - Imagine ilustrativă

   Fiecare card de lege are: iconiță, titlu și
   text descriptiv.
   ============================================ */

/* Importăm iconițele pentru cardurile de legi */
import GavelIcon from '@mui/icons-material/Gavel';
import BalanceIcon from '@mui/icons-material/Balance';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import './AboutSection.css';

/* --- Datele pentru cardurile de legi --- */
const lawsData = [
  {
    icon: <GavelIcon />,
    title: 'Laws 12.1',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <BalanceIcon />,
    title: 'Laws 12.2',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <GroupsIcon />,
    title: 'Laws 12.3',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Laws 12/2',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
];

const AboutSection = () => {
  return (
    <section className="about">
      {/* --- Titlu și descriere --- */}
      <h2 className="about__title">About Project</h2>
      <p className="about__text">About Project Text</p>
      <p className="about__subtitle">The main laws in the field</p>

      {/* --- Linie separatoare --- */}
      <div className="about__divider" />

      {/* --- Grid cu 4 carduri de legi --- */}
      <div className="about__laws">
        {lawsData.map((law, index) => (
          <div key={index} className="about__law-card">
            {/* Iconița legii */}
            <div className="about__law-icon">{law.icon}</div>
            {/* Titlul legii */}
            <h3 className="about__law-title">{law.title}</h3>
            {/* Descrierea legii */}
            <p className="about__law-text">{law.text}</p>
          </div>
        ))}
      </div>

      {/* --- Imagine ilustrativă (placeholder) --- */}
      <div className="about__image">
        {/* Aici va fi imaginea cu ciocanul de judecător și steagul */}
        Imagine - Ciocan judecătoresc
      </div>
    </section>
  );
};

export default AboutSection;

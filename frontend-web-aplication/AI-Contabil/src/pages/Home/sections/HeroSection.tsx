/* ============================================
   SECȚIUNEA HERO

   Prima secțiune vizibilă pe pagina Home.

   Layout: Imagine pe FUNDAL (background CSS),
   cu titlul suprapus centrat deasupra.

   NOTĂ: Pentru imagine reală de fundal,
   înlocuiește background-ul din .hero din CSS cu:
   background: url('../../assets/images/hero-bg.jpg');
   ============================================ */

import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero">
      {/* --- Overlay semi-transparent ---
          Strat peste imaginea de fundal pentru lizibilitate */}
      <div className="hero__overlay" />

      {/* --- Conținutul principal (deasupra overlay-ului) --- */}
      <div className="hero__content">
        {/* Titlul principal - centrat, deasupra imaginii de fundal */}
        <h1 className="hero__title">
          Smart financial management solutions
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;

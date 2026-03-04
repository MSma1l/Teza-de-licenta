/* ============================================
   SECȚIUNEA NEWS

   Afișează o știre cu:
   - Imagine placeholder (stânga)
   - Text știre + autor + dată (dreapta)
   ============================================ */

import './NewsSection.css';

const NewsSection = () => {
  return (
    <section className="news">
      {/* --- Titlul secțiunii --- */}
      <h2 className="news__title">News</h2>

      {/* --- Card-ul știrii (2 coloane) --- */}
      <div className="news__card">
        {/* Imaginea știrii (placeholder) */}
        <div className="news__image">
          Imagine știre
        </div>

        {/* Conținutul text al știrii */}
        <div className="news__content">
          {/* Textul principal - placeholder cu "NewsNews..." */}
          <p className="news__text">
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNews
          </p>

          {/* Metadate: autor și dată */}
          <div className="news__meta">
            <p className="news__author">Author</p>
            <p className="news__date">Data</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;

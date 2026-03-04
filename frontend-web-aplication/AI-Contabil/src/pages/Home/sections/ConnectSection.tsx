/* ============================================
   SECȚIUNEA CONNECT WITH US

   Secțiune simplă cu invitație la contact:
   - Titlu
   - Text scurt descriptiv
   - Buton de acțiune
   ============================================ */

import './ConnectSection.css';

const ConnectSection = () => {
  return (
    <section className="connect">
      {/* --- Titlul secțiunii --- */}
      <h2 className="connect__title">Connect with us</h2>

      {/* --- Textul descriptiv --- */}
      <p className="connect__text">
        Connect with a quick call to find out how the details and answers to the questions
      </p>

      {/* --- Butonul de acțiune --- */}
      <button className="connect__button">
        Create Document &gt;
      </button>
    </section>
  );
};

export default ConnectSection;

/* ============================================
   COMPONENTA FOOTER

   Footer-ul paginii cu:
   - Linkuri de navigare: Benefits, Specifications, How-to
   - Buton de chat flotant (fixat dreapta jos)

   Butonul de chat este afișat opțional
   prin prop-ul showChat.
   ============================================ */

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import './Footer.css';

/* --- Tipul props-urilor --- */
interface FooterProps {
  showChat?: boolean;  /* Afișăm butonul de chat? */
}

const Footer = ({ showChat = false }: FooterProps) => {
  return (
    <footer className="footer">
      {/* --- Linkurile din footer --- */}
      <div className="footer__links">
        <span className="footer__link">Benefits</span>
        <span className="footer__link">Specifications</span>
        <span className="footer__link">How-to</span>
      </div>

      {/* --- Buton de chat flotant (vizibil doar când showChat=true) --- */}
      {showChat && (
        <div className="footer__chat">
          <ChatBubbleOutlineIcon />
        </div>
      )}
    </footer>
  );
};

export default Footer;

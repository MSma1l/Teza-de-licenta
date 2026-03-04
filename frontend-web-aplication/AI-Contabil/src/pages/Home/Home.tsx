/* ============================================
   PAGINA HOME - Pagina principală

   Această pagină asamblează toate secțiunile
   aplicației într-o singură pagină cu scroll:

   1. HeroSection - Titlu + imagine principală
   2. AboutSection - Despre proiect + legi
   3. StagesSection - Pașii creării unui document
   4. DocumentsSection - Tabel documente frecvente
   5. NewsSection - Știri
   6. ConnectSection - Contact
   7. Footer - Linkuri + chat

   Props:
   - isLoggedIn: determină varianta navbar-ului
     (butoane auth VS notificări + avatar)
   ============================================ */

/* Importăm componenta Navbar */
import Navbar from '../../components/Navbar/Navbar';
/* Importăm componenta Footer */
import Footer from '../../components/Footer/Footer';

/* Importăm toate secțiunile paginii */
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import StagesSection from './sections/StagesSection';
import DocumentsSection from './sections/DocumentsSection';
import NewsSection from './sections/NewsSection';
import ConnectSection from './sections/ConnectSection';

/* Importăm stilurile paginii */
import './Home.css';

/* --- Tipul props-urilor --- */
interface HomeProps {
  isLoggedIn?: boolean;  /* Utilizatorul este logat? */
}

/* --- Componenta paginii Home --- */
const Home = ({ isLoggedIn = false }: HomeProps) => {
  return (
    <div className="home-page">
      {/* === NAVBAR ===
          - showNavLinks=true: afișăm linkurile About, Documents, etc.
          - isLoggedIn: determină ce butoane apar în dreapta
      */}
      <Navbar isLoggedIn={isLoggedIn} showNavLinks={true} />

      {/* === CONȚINUTUL PRINCIPAL === */}
      <div className="home-page__content">
        {/* Secțiunea 1: Hero - titlu mare + imagine */}
        <HeroSection />

        {/* Secțiunea 2: About - despre proiect + legi */}
        <AboutSection />

        {/* Secțiunea 3: Stages - pașii creării unui document */}
        <StagesSection />

        {/* Secțiunea 4: Documents - tabel documente frecvente */}
        <DocumentsSection />

        {/* Secțiunea 5: News - știri */}
        <NewsSection />

        {/* Secțiunea 6: Connect - contact */}
        <ConnectSection />
      </div>

      {/* === FOOTER ===
          - showChat: butonul de chat flotant apare doar după logare
      */}
      <Footer showChat={isLoggedIn} />
    </div>
  );
};

export default Home;

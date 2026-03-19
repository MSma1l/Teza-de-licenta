import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import StagesSection from './sections/StagesSection';
import DocumentsSection from './sections/DocumentsSection';
import NewsSection from './sections/NewsSection';
import ConnectSection from './sections/ConnectSection';

interface HomeProps {
  isLoggedIn?: boolean;
}

const Home = ({ isLoggedIn = false }: HomeProps) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <Navbar isLoggedIn={isLoggedIn} showNavLinks={true} />

      <div className="max-w-[1200px] mx-auto">
        <HeroSection />
        <AboutSection />
        <StagesSection />
        <DocumentsSection />
        <NewsSection />
        <ConnectSection />
      </div>

      <Footer showChat={isLoggedIn} />
    </div>
  );
};

export default Home;

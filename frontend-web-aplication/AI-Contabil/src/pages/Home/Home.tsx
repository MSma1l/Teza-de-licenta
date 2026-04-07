import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import LawsSection from './sections/LawsSection';
import StagesSection from './sections/StagesSection';
import DocumentsSection from './sections/DocumentsSection';
import NewsSection from './sections/NewsSection';
import ConnectSection from './sections/ConnectSection';

interface HomeProps {
  isLoggedIn?: boolean;
}

const Home = ({ isLoggedIn = false }: HomeProps) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} showNavLinks={true} />

      <div className="w-[85%] max-md:w-full max-md:px-4 mx-auto flex-1">
        <HeroSection />
        <AboutSection />
        <LawsSection />
        <StagesSection />
        <DocumentsSection />
        <NewsSection />
        <ConnectSection />
      </div>

      <Footer isLoggedIn={isLoggedIn} />
    </div>
  );
};

export default Home;

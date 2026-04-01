import { useNavigate } from 'react-router-dom';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface FooterProps {
  showChat?: boolean;
}

const Footer = ({ showChat = false }: FooterProps) => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="px-12 max-md:px-4 py-8 border-t border-neutral-200 flex items-center justify-between">
      <div className="flex gap-8 max-md:gap-4">
        <span
          className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors"
          onClick={() => { navigate('/'); scrollToTop(); }}
        >
          Benefits
        </span>
        <span
          className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors"
          onClick={() => { navigate('/documents'); }}
        >
          Documents
        </span>
        <span
          className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors"
          onClick={() => { navigate('/settings'); }}
        >
          Settings
        </span>
      </div>

      {showChat && (
        <div
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer shadow-lg fixed bottom-6 right-6 z-[999] hover:scale-110 transition-all"
          onClick={() => navigate('/settings')}
          title="Ajutor & Suport"
        >
          <ChatBubbleOutlineIcon />
        </div>
      )}
    </footer>
  );
};

export default Footer;

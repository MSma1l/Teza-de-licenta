import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface FooterProps {
  showChat?: boolean;
}

const Footer = ({ showChat = false }: FooterProps) => {
  return (
    <footer className="px-12 py-8 border-t border-neutral-200 flex items-center justify-between">
      <div className="flex gap-8">
        <span className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors">Benefits</span>
        <span className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors">Specifications</span>
        <span className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-primary transition-colors">How-to</span>
      </div>

      {showChat && (
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer shadow-lg fixed bottom-6 right-6 z-[999] hover:scale-110 transition-all">
          <ChatBubbleOutlineIcon />
        </div>
      )}
    </footer>
  );
};

export default Footer;

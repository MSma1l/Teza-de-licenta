import { useEffect, useState } from 'react';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

import type { AlertType } from '../../models/settingsTypes';

interface AlertToastProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  duration?: number;
}

const iconMap: Record<AlertType, React.ReactNode> = {
  success: <CheckCircleOutlineIcon />,
  error: <ErrorOutlineIcon />,
  warning: <WarningAmberOutlinedIcon />,
  info: <InfoOutlinedIcon />,
};

const typeConfig: Record<AlertType, { bg: string; bar: string; icon: string; title: string }> = {
  success: { bg: 'bg-[#e8f5e9]', bar: 'bg-[#4caf50]', icon: 'bg-[#4caf50]', title: 'text-[#2e7d32]' },
  error: { bg: 'bg-[#ffebee]', bar: 'bg-[#ef5350]', icon: 'bg-[#ef5350]', title: 'text-[#c62828]' },
  warning: { bg: 'bg-[#fff8e1]', bar: 'bg-[#ffc107]', icon: 'bg-[#ffc107]', title: 'text-[#e65100]' },
  info: { bg: 'bg-[#e8eaf6]', bar: 'bg-[#7c4dff]', icon: 'bg-[#7c4dff]', title: 'text-[#283593]' },
};

const AlertToast = ({ type, title, message, onClose, duration = 5000 }: AlertToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div className={`flex items-start gap-4 py-4 px-6 rounded-lg relative overflow-hidden max-w-[500px] w-full shadow-md ${config.bg} ${isVisible ? 'animate-toast-in' : 'animate-toast-out'}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} />

      <div className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center shrink-0 ${config.icon} [&_svg]:text-white [&_svg]:text-[1.3rem]`}>
        {iconMap[type]}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <h4 className={`text-base font-bold italic ${config.title}`}>{title}</h4>
        <p className="text-sm text-neutral-600 leading-relaxed">{message}</p>
      </div>

      {onClose && (
        <button className="bg-transparent p-1 text-neutral-400 flex items-center justify-center shrink-0 transition-colors hover:text-neutral-black [&_svg]:text-[1.2rem]" onClick={handleClose}>
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default AlertToast;

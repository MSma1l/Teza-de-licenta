/* ============================================
   COMPONENTA ALERT TOAST

   Afișează alerte/notificări de tip toast:
   - Success (verde) - operație reușită
   - Error (roșu) - eroare
   - Warning (galben) - avertisment
   - Info (albastru) - informare

   Fiecare alertă are:
   - Bară colorată pe stânga
   - Iconița corespunzătoare tipului
   - Titlu + mesaj
   - Buton de închidere (opțional)
   - Dispare automat după durata setată

   Props:
   - type: tipul alertei
   - title: titlul alertei
   - message: mesajul alertei
   - onClose: callback pentru închidere
   - duration: durata în ms (default 5000)
   ============================================ */

import { useEffect, useState } from 'react';

/* Importăm iconițe Material UI */
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

/* Importăm tipurile */
import type { AlertType } from '../../models/settingsTypes';

/* Importăm stilurile */
import './AlertToast.css';

/* --- Tipul props-urilor componentei --- */
interface AlertToastProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  duration?: number;
}

/* --- Map-ul de iconițe pe tip --- */
const iconMap: Record<AlertType, React.ReactNode> = {
  success: <CheckCircleOutlineIcon />,
  error: <ErrorOutlineIcon />,
  warning: <WarningAmberOutlinedIcon />,
  info: <InfoOutlinedIcon />,
};

/* --- Componenta AlertToast --- */
const AlertToast = ({ type, title, message, onClose, duration = 5000 }: AlertToastProps) => {
  /* State pentru vizibilitate (animație de ieșire) */
  const [isVisible, setIsVisible] = useState(true);

  /* Auto-close după durata setată */
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  /* Handler pentru închidere manuală */
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div
      className={`alert-toast alert-toast--${type} ${
        isVisible ? 'alert-toast--enter' : 'alert-toast--exit'
      }`}
    >
      {/* Bara colorată din stânga */}
      <div className="alert-toast__bar" />

      {/* Iconița */}
      <div className="alert-toast__icon">{iconMap[type]}</div>

      {/* Conținutul */}
      <div className="alert-toast__content">
        <h4 className="alert-toast__title">{title}</h4>
        <p className="alert-toast__message">{message}</p>
      </div>

      {/* Butonul de închidere */}
      {onClose && (
        <button className="alert-toast__close" onClick={handleClose}>
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default AlertToast;

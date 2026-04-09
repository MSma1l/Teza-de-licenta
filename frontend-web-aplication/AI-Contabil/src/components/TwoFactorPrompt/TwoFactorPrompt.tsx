import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  requestTwoFactor,
  getTwoFactorStatus,
  fetchQrBlobUrl,
  type TwoFactorChallenge,
} from '../../api/twoFactorApi';
import { useLanguage } from '../../context/LanguageContext';
import type { Lang } from '../../context/LanguageContext';

const t: Record<Lang, {
  title: string;
  subtitle: string;
  tabCode: string;
  tabQr: string;
  codeInstruction: string;
  qrInstruction: string;
  expiresIn: string;
  approvedTitle: string;
  approvedText: string;
  expiredTitle: string;
  expiredText: string;
  loading: string;
  error: string;
  retry: string;
  cancel: string;
}> = {
  ro: {
    title: 'Confirmare actiune',
    subtitle: 'Pentru securitate, confirma actiunea din aplicatia mobila',
    tabCode: 'Cod numeric',
    tabQr: 'Cod QR',
    codeInstruction: 'Introdu acest cod in aplicatia mobila pentru a confirma actiunea',
    qrInstruction: 'Scaneaza acest cod QR cu aplicatia mobila',
    expiresIn: 'Expira in',
    approvedTitle: 'Confirmat!',
    approvedText: 'Actiunea a fost autorizata cu succes',
    expiredTitle: 'Codul a expirat',
    expiredText: 'Genereaza un nou cod si reincearca',
    loading: 'Se incarca...',
    error: 'Eroare la generare. Reincearca.',
    retry: 'Genereaza nou',
    cancel: 'Anuleaza',
  },
  en: {
    title: 'Action confirmation',
    subtitle: 'For security, confirm the action from the mobile app',
    tabCode: 'Numeric code',
    tabQr: 'QR code',
    codeInstruction: 'Enter this code in the mobile app to confirm the action',
    qrInstruction: 'Scan this QR code with the mobile app',
    expiresIn: 'Expires in',
    approvedTitle: 'Confirmed!',
    approvedText: 'The action has been successfully authorized',
    expiredTitle: 'Code expired',
    expiredText: 'Generate a new code and try again',
    loading: 'Loading...',
    error: 'Generation error. Try again.',
    retry: 'Generate new',
    cancel: 'Cancel',
  },
  ru: {
    title: 'Подтверждение действия',
    subtitle: 'Для безопасности подтвердите действие в мобильном приложении',
    tabCode: 'Числовой код',
    tabQr: 'QR-код',
    codeInstruction: 'Введите этот код в мобильное приложение для подтверждения',
    qrInstruction: 'Отсканируйте этот QR-код мобильным приложением',
    expiresIn: 'Истекает через',
    approvedTitle: 'Подтверждено!',
    approvedText: 'Действие успешно авторизовано',
    expiredTitle: 'Код истёк',
    expiredText: 'Создайте новый код и попробуйте снова',
    loading: 'Загрузка...',
    error: 'Ошибка генерации. Попробуйте снова.',
    retry: 'Создать новый',
    cancel: 'Отмена',
  },
};

interface TwoFactorPromptProps {
  open: boolean;
  actionType: string;
  actionDescription?: string;
  onClose: () => void;
  onApproved: () => void;
}

const TwoFactorPrompt = ({
  open,
  actionType,
  actionDescription,
  onClose,
  onApproved,
}: TwoFactorPromptProps) => {
  const { lang } = useLanguage();
  const tr = t[lang];
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<'code' | 'qr'>('code');
  const [statusState, setStatusState] = useState<'loading' | 'pending' | 'approved' | 'expired' | 'error'>('loading');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Generare provocare la deschidere
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatusState('loading');
    setChallenge(null);
    setQrUrl(null);

    requestTwoFactor(actionType, actionDescription)
      .then(async (ch) => {
        if (cancelled) return;
        setChallenge(ch);
        setStatusState('pending');
        const expiresMs = new Date(ch.expires_at).getTime();
        setSecondsLeft(Math.max(0, Math.floor((expiresMs - Date.now()) / 1000)));
        try {
          const url = await fetchQrBlobUrl(ch.qr_token);
          if (!cancelled) setQrUrl(url);
        } catch {
          // Ignora - tab-ul cod numeric inca functioneaza
        }
      })
      .catch(() => {
        if (!cancelled) setStatusState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [open, actionType, actionDescription]);

  // Polling status la fiecare 2 secunde
  useEffect(() => {
    if (!challenge || statusState !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const s = await getTwoFactorStatus(challenge.challenge_id);
        if (s.verified) {
          setStatusState('approved');
          setTimeout(() => onApproved(), 1500);
        } else if (s.expired) {
          setStatusState('expired');
        }
      } catch {
        // Ignora erori temporare
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [challenge, statusState, onApproved]);

  // Countdown
  useEffect(() => {
    if (statusState !== 'pending' || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setStatusState('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [statusState, secondsLeft]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    };
  }, [qrUrl]);

  const handleRetry = () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrUrl(null);
    setStatusState('loading');
    requestTwoFactor(actionType, actionDescription)
      .then(async (ch) => {
        setChallenge(ch);
        setStatusState('pending');
        const expiresMs = new Date(ch.expires_at).getTime();
        setSecondsLeft(Math.max(0, Math.floor((expiresMs - Date.now()) / 1000)));
        try {
          const url = await fetchQrBlobUrl(ch.qr_token);
          setQrUrl(url);
        } catch {
          // ignore
        }
      })
      .catch(() => setStatusState('error'));
  };

  if (!open) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <CloseIcon style={{ fontSize: 18 }} />
          </button>
          <h3 className="text-xl font-bold">{tr.title}</h3>
          <p className="text-sm text-white/85 mt-1">{tr.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {statusState === 'loading' && (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#4f46e5]/20 border-t-[#4f46e5] rounded-full animate-spin" />
              <p className="text-sm text-neutral-500">{tr.loading}</p>
            </div>
          )}

          {statusState === 'error' && (
            <div className="py-8 text-center">
              <p className="text-red-600 mb-4">{tr.error}</p>
              <button
                onClick={handleRetry}
                className="btn-gradient px-6 py-2 rounded-full text-sm font-bold"
              >
                {tr.retry}
              </button>
            </div>
          )}

          {statusState === 'approved' && (
            <div className="py-10 text-center animate-scale-in">
              <CheckCircleIcon style={{ fontSize: 72, color: '#10b981' }} />
              <h4 className="text-xl font-bold text-neutral-black mt-3">{tr.approvedTitle}</h4>
              <p className="text-sm text-neutral-500 mt-1">{tr.approvedText}</p>
            </div>
          )}

          {statusState === 'expired' && (
            <div className="py-8 text-center">
              <HourglassEmptyIcon style={{ fontSize: 56, color: '#ef4444' }} />
              <h4 className="text-lg font-bold text-neutral-black mt-3">{tr.expiredTitle}</h4>
              <p className="text-sm text-neutral-500 mt-1 mb-4">{tr.expiredText}</p>
              <button
                onClick={handleRetry}
                className="btn-gradient px-6 py-2 rounded-full text-sm font-bold"
              >
                {tr.retry}
              </button>
            </div>
          )}

          {statusState === 'pending' && challenge && (
            <>
              {/* Tab switcher */}
              <div className="flex bg-neutral-100 rounded-xl p-1 mb-5">
                <button
                  onClick={() => setTab('code')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    tab === 'code' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  <KeyboardIcon style={{ fontSize: 18 }} />
                  {tr.tabCode}
                </button>
                <button
                  onClick={() => setTab('qr')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    tab === 'qr' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  <QrCodeScannerIcon style={{ fontSize: 18 }} />
                  {tr.tabQr}
                </button>
              </div>

              {tab === 'code' ? (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-500 mb-5">{tr.codeInstruction}</p>
                  <div
                    className="inline-block px-10 py-6 rounded-2xl font-bold tracking-widest"
                    style={{
                      fontSize: '4rem',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {challenge.code}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-neutral-500 mb-4">{tr.qrInstruction}</p>
                  {qrUrl ? (
                    <div className="inline-block p-4 bg-white border-4 border-neutral-100 rounded-2xl">
                      <img src={qrUrl} alt="QR code" width={220} height={220} />
                    </div>
                  ) : (
                    <div className="w-[220px] h-[220px] mx-auto bg-neutral-100 rounded-2xl flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#4f46e5]/20 border-t-[#4f46e5] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-500">
                <HourglassEmptyIcon style={{ fontSize: 16 }} />
                <span>{tr.expiresIn}</span>
                <span className="font-bold text-[#4f46e5]">{formatTime(secondsLeft)}</span>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-5 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-semibold transition-colors cursor-pointer"
              >
                {tr.cancel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPrompt;

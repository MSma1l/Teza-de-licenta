/* ============================================
   SECȚIUNEA SECURITY SETTINGS

   Pagina de securitate cu:
   - Schimbare parolă (parola actuală + nouă + confirmare)
   - Gestionare documente de identitate
   - Autentificare în doi pași (2FA toggle)
   - Sesiuni active

   NOTĂ: Datele vor veni din API în viitor.
   ============================================ */

import { useState, useRef } from 'react';

/* Importăm iconițe Material UI */
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

/* Importăm tipurile și API-ul */
import type { PasswordChangeData } from '../../../models/settingsTypes';
import { changePassword, uploadSecurityDocument } from '../../../api/settingsApi';
import AlertToast from '../../../components/AlertToast/AlertToast';

/* --- Componenta SecuritySettings --- */
const SecuritySettings = () => {
  /* State pentru parola */
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /* State pentru vizibilitatea parolelor */
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /* State pentru 2FA */
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDocType, setCurrentDocType] = useState('');

  /* Handler schimbare parolă */
  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  /* Handler salvare parolă nouă - conectat la API */
  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: 'Parolele noi nu coincid', type: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setToast({ message: 'Parola nouă trebuie să aibă minim 6 caractere', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(passwordData);
      setToast({ message: 'Parola a fost schimbată cu succes!', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setToast({ message: e.message || 'Eroare la schimbarea parolei', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* Toggle vizibilitate parolă */
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /* Handler upload document - conectat la API */
  const handleUploadDocument = (docType: string) => {
    setCurrentDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(currentDocType);
    try {
      await uploadSecurityDocument(file, currentDocType);
      setToast({ message: 'Document încărcat cu succes!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Eroare la upload', type: 'error' });
    } finally {
      setUploadingDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 px-12 animate-fade-in">
      {/* === Titlu === */}
      <h1 className="font-heading text-2xl font-bold text-neutral-black mb-12">Security</h1>

      {/* === Secțiunea 1: Schimbare parolă === */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <LockOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">Change Password</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Schimbați parola contului pentru a menține securitatea datelor.
        </p>

        <div className="flex flex-col gap-3 max-w-[450px]">
          {/* Parola actuală */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">Current Password</label>
            <div className="relative flex items-center">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                className="w-full py-3 px-6 pr-12 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Parola actuală"
              />
              <span
                className="absolute right-3 text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          {/* Parola nouă */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">New Password</label>
            <div className="relative flex items-center">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                className="w-full py-3 px-6 pr-12 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Parola nouă"
              />
              <span
                className="absolute right-3 text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          {/* Confirmare parolă */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">Confirm New Password</label>
            <div className="relative flex items-center">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                className="w-full py-3 px-6 pr-12 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirmă parola nouă"
              />
              <span
                className="absolute right-3 text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          <button
            className="mt-2 py-3 px-12 bg-primary text-white rounded-full text-sm font-semibold self-start transition-all duration-200 hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            onClick={handleSavePassword}
            disabled={saving}
          >
            {saving ? 'Se actualizează...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* === Secțiunea 2: Documente de identitate === */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <DescriptionOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">Identity Documents</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Încărcați și gestionați documentele de identitate necesare pentru verificarea contului.
        </p>

        <div className="flex flex-col gap-3">
          {/* Card document - Buletin/Carte de identitate */}
          <div className="flex items-center justify-between py-3 px-6 border border-neutral-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 [&>svg]:text-neutral-400 [&>svg]:text-2xl">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="text-sm font-semibold text-neutral-black">Buletin / Carte de identitate</h4>
                <span className="text-xs font-medium text-neutral-400">
                  {uploadingDoc === 'buletin' ? 'Se încarcă...' : 'Neîncărcat'}
                </span>
              </div>
            </div>
            <button
              className="flex items-center gap-1 py-2 px-6 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-200 hover:text-primary [&_svg]:text-[1.2rem]"
              onClick={() => handleUploadDocument('buletin')}
            >
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>

          {/* Card document - Pașaport */}
          <div className="flex items-center justify-between py-3 px-6 border border-neutral-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 [&>svg]:text-neutral-400 [&>svg]:text-2xl">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="text-sm font-semibold text-neutral-black">Pașaport</h4>
                <span className="text-xs font-medium text-neutral-400">
                  {uploadingDoc === 'pasaport' ? 'Se încarcă...' : 'Neîncărcat'}
                </span>
              </div>
            </div>
            <button
              className="flex items-center gap-1 py-2 px-6 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-200 hover:text-primary [&_svg]:text-[1.2rem]"
              onClick={() => handleUploadDocument('pasaport')}
            >
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>

          {/* Card document - Extras de cont */}
          <div className="flex items-center justify-between py-3 px-6 border border-neutral-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 [&>svg]:text-neutral-400 [&>svg]:text-2xl">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="text-sm font-semibold text-neutral-black">Extras de cont bancar</h4>
                <span className="text-xs font-medium text-neutral-400">
                  {uploadingDoc === 'extras_bancar' ? 'Se încarcă...' : 'Neîncărcat'}
                </span>
              </div>
            </div>
            <button
              className="flex items-center gap-1 py-2 px-6 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-200 hover:text-primary [&_svg]:text-[1.2rem]"
              onClick={() => handleUploadDocument('extras_bancar')}
            >
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* === Secțiunea 3: Autentificare în doi pași === */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <SecurityOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Adăugați un nivel suplimentar de securitate contului dumneavoastră.
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-600">
            {is2FAEnabled ? 'Activat' : 'Dezactivat'}
          </span>
          <button
            className={`w-12 h-[26px] rounded-[13px] relative p-0 transition-colors duration-200 ${
              is2FAEnabled ? 'bg-[#4caf50]' : 'bg-neutral-300'
            }`}
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                is2FAEnabled ? 'translate-x-[22px]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* === Secțiunea 4: Sesiuni active === */}
      <div className="mb-12 pb-12">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <DevicesOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">Active Sessions</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Gestionați dispozitivele pe care sunteți autentificat.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 py-3 px-6 border border-neutral-200 rounded-lg [&>svg]:text-neutral-400 [&>svg]:text-2xl">
            <DevicesOutlinedIcon />
            <div className="flex-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-neutral-black [&_span]:text-xs [&_span]:text-neutral-400">
              <h4>{navigator.userAgent.includes('Chrome') ? 'Google Chrome' : navigator.userAgent.includes('Firefox') ? 'Mozilla Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} — {navigator.platform}</h4>
              <span>Ultima activitate: {new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span className="text-xs font-semibold text-[#4caf50] py-0.5 px-2.5 bg-[#e8f5e9] rounded-sm">Activ</span>
          </div>
        </div>
      </div>

      {/* Hidden file input pentru upload documente */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileSelected}
      />

      {toast && (
        <AlertToast
          title={toast.type === 'success' ? 'Succes' : 'Eroare'}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SecuritySettings;

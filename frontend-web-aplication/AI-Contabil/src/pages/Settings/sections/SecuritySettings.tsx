import { useState, useRef } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import type { PasswordChangeData } from '../../../models/settingsTypes';
import { changePassword, uploadSecurityDocument } from '../../../api/settingsApi';
import AlertToast from '../../../components/AlertToast/AlertToast';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

const t: Record<Lang, {
  title: string; changePassword: string; changePasswordDesc: string;
  currentPassword: string; newPassword: string; confirmPassword: string;
  currentPlaceholder: string; newPlaceholder: string; confirmPlaceholder: string;
  updating: string; updatePassword: string;
  identityDocs: string; identityDocsDesc: string;
  idCard: string; passport: string; bankStatement: string;
  notUploaded: string; uploading: string; upload: string;
  twoFactor: string; twoFactorDesc: string; enabled: string; disabled: string;
  activeSessions: string; activeSessionsDesc: string; active: string;
  success: string; error: string;
  passwordChanged: string; passwordMismatch: string; passwordMin: string;
  passwordError: string; docUploaded: string; docUploadError: string;
}> = {
  ro: {
    title: 'Securitate', changePassword: 'Schimba parola',
    changePasswordDesc: 'Schimbati parola contului pentru a mentine securitatea datelor.',
    currentPassword: 'Parola actuala', newPassword: 'Parola noua', confirmPassword: 'Confirma parola noua',
    currentPlaceholder: 'Parola actuala', newPlaceholder: 'Parola noua', confirmPlaceholder: 'Confirma parola noua',
    updating: 'Se actualizeaza...', updatePassword: 'Actualizeaza parola',
    identityDocs: 'Documente de identitate',
    identityDocsDesc: 'Incarcati si gestionati documentele de identitate necesare pentru verificarea contului.',
    idCard: 'Buletin / Carte de identitate', passport: 'Pasaport', bankStatement: 'Extras de cont bancar',
    notUploaded: 'Neincarcat', uploading: 'Se incarca...', upload: 'Upload',
    twoFactor: 'Autentificare in doi pasi', twoFactorDesc: 'Adaugati un nivel suplimentar de securitate contului.',
    enabled: 'Activat', disabled: 'Dezactivat',
    activeSessions: 'Sesiuni active', activeSessionsDesc: 'Gestionati dispozitivele pe care sunteti autentificat.',
    active: 'Activ', success: 'Succes', error: 'Eroare',
    passwordChanged: 'Parola a fost schimbata cu succes!', passwordMismatch: 'Parolele noi nu coincid',
    passwordMin: 'Parola noua trebuie sa aiba minim 6 caractere', passwordError: 'Eroare la schimbarea parolei',
    docUploaded: 'Document incarcat cu succes!', docUploadError: 'Eroare la upload',
  },
  en: {
    title: 'Security', changePassword: 'Change Password',
    changePasswordDesc: 'Change your account password to maintain data security.',
    currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password',
    currentPlaceholder: 'Current password', newPlaceholder: 'New password', confirmPlaceholder: 'Confirm new password',
    updating: 'Updating...', updatePassword: 'Update Password',
    identityDocs: 'Identity Documents',
    identityDocsDesc: 'Upload and manage identity documents required for account verification.',
    idCard: 'ID Card', passport: 'Passport', bankStatement: 'Bank Statement',
    notUploaded: 'Not uploaded', uploading: 'Uploading...', upload: 'Upload',
    twoFactor: 'Two-Factor Authentication', twoFactorDesc: 'Add an extra layer of security to your account.',
    enabled: 'Enabled', disabled: 'Disabled',
    activeSessions: 'Active Sessions', activeSessionsDesc: 'Manage devices where you are logged in.',
    active: 'Active', success: 'Success', error: 'Error',
    passwordChanged: 'Password changed successfully!', passwordMismatch: 'New passwords do not match',
    passwordMin: 'New password must be at least 6 characters', passwordError: 'Error changing password',
    docUploaded: 'Document uploaded successfully!', docUploadError: 'Upload error',
  },
  ru: {
    title: 'Безопасность', changePassword: 'Изменить пароль',
    changePasswordDesc: 'Измените пароль аккаунта для обеспечения безопасности данных.',
    currentPassword: 'Текущий пароль', newPassword: 'Новый пароль', confirmPassword: 'Подтвердите новый пароль',
    currentPlaceholder: 'Текущий пароль', newPlaceholder: 'Новый пароль', confirmPlaceholder: 'Подтвердите новый пароль',
    updating: 'Обновление...', updatePassword: 'Обновить пароль',
    identityDocs: 'Документы удостоверения',
    identityDocsDesc: 'Загружайте и управляйте документами, необходимыми для верификации аккаунта.',
    idCard: 'Удостоверение личности', passport: 'Паспорт', bankStatement: 'Банковская выписка',
    notUploaded: 'Не загружено', uploading: 'Загрузка...', upload: 'Загрузить',
    twoFactor: 'Двухфакторная аутентификация', twoFactorDesc: 'Добавьте дополнительный уровень безопасности.',
    enabled: 'Включено', disabled: 'Отключено',
    activeSessions: 'Активные сессии', activeSessionsDesc: 'Управляйте устройствами, на которых выполнен вход.',
    active: 'Активно', success: 'Успех', error: 'Ошибка',
    passwordChanged: 'Пароль успешно изменён!', passwordMismatch: 'Новые пароли не совпадают',
    passwordMin: 'Новый пароль должен быть не менее 6 символов', passwordError: 'Ошибка при смене пароля',
    docUploaded: 'Документ успешно загружен!', docUploadError: 'Ошибка загрузки',
  },
};

const locales: Record<Lang, string> = { ro: 'ro-RO', en: 'en-US', ru: 'ru-RU' };

const SecuritySettings = () => {
  const { lang } = useLanguage();
  const tr = t[lang];

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDocType, setCurrentDocType] = useState('');

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: tr.passwordMismatch, type: 'error' }); return;
    }
    if (passwordData.newPassword.length < 6) {
      setToast({ message: tr.passwordMin, type: 'error' }); return;
    }
    setSaving(true);
    try {
      await changePassword(passwordData);
      setToast({ message: tr.passwordChanged, type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setToast({ message: e.message || tr.passwordError, type: 'error' });
    } finally { setSaving(false); }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUploadDocument = (docType: string) => { setCurrentDocType(docType); fileInputRef.current?.click(); };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(currentDocType);
    try {
      await uploadSecurityDocument(file, currentDocType);
      setToast({ message: tr.docUploaded, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || tr.docUploadError, type: 'error' });
    } finally { setUploadingDoc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const inputClass = "w-full py-3 px-6 pr-12 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none";
  const docCards: { type: string; label: string }[] = [
    { type: 'buletin', label: tr.idCard },
    { type: 'pasaport', label: tr.passport },
    { type: 'extras_bancar', label: tr.bankStatement },
  ];

  return (
    <div className="p-8 px-12 max-md:px-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-neutral-black mb-12">{tr.title}</h1>

      {/* Change Password */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <LockOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">{tr.changePassword}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{tr.changePasswordDesc}</p>

        <div className="flex flex-col gap-3 max-w-[450px]">
          {([
            { field: 'currentPassword' as const, label: tr.currentPassword, placeholder: tr.currentPlaceholder, show: showPasswords.current, toggle: 'current' as const },
            { field: 'newPassword' as const, label: tr.newPassword, placeholder: tr.newPlaceholder, show: showPasswords.new, toggle: 'new' as const },
            { field: 'confirmPassword' as const, label: tr.confirmPassword, placeholder: tr.confirmPlaceholder, show: showPasswords.confirm, toggle: 'confirm' as const },
          ]).map((pw) => (
            <div key={pw.field} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral-black">{pw.label}</label>
              <div className="relative flex items-center">
                <input
                  type={pw.show ? 'text' : 'password'}
                  className={inputClass}
                  value={passwordData[pw.field]}
                  onChange={(e) => handlePasswordChange(pw.field, e.target.value)}
                  placeholder={pw.placeholder}
                />
                <span className="absolute right-3 text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary" onClick={() => togglePasswordVisibility(pw.toggle)}>
                  {pw.show ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                </span>
              </div>
            </div>
          ))}
          <button className="btn-gradient mt-2 py-3 px-12 rounded-full text-sm self-start" onClick={handleSavePassword} disabled={saving}>
            {saving ? tr.updating : tr.updatePassword}
          </button>
        </div>
      </div>

      {/* Identity Documents */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <DescriptionOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">{tr.identityDocs}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{tr.identityDocsDesc}</p>
        <div className="flex flex-col gap-3">
          {docCards.map((doc) => (
            <div key={doc.type} className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3 py-3 px-6 border border-neutral-200 rounded-lg bg-white">
              <div className="flex items-center gap-3 [&>svg]:text-neutral-400 [&>svg]:text-2xl">
                <DescriptionOutlinedIcon />
                <div>
                  <h4 className="text-sm font-semibold text-neutral-black">{doc.label}</h4>
                  <span className="text-xs font-medium text-neutral-400">
                    {uploadingDoc === doc.type ? tr.uploading : tr.notUploaded}
                  </span>
                </div>
              </div>
              <button
                className="flex items-center gap-1 py-2 px-6 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-200 hover:text-primary [&_svg]:text-[1.2rem]"
                onClick={() => handleUploadDocument(doc.type)}
              >
                <CloudUploadOutlinedIcon /> {tr.upload}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div className="mb-12 pb-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <SecurityOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">{tr.twoFactor}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{tr.twoFactorDesc}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-600">{is2FAEnabled ? tr.enabled : tr.disabled}</span>
          <button
            className={`w-12 h-[26px] rounded-[13px] relative p-0 transition-colors duration-200 ${is2FAEnabled ? 'bg-[#4caf50]' : 'bg-neutral-300'}`}
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          >
            <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${is2FAEnabled ? 'translate-x-[22px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mb-12 pb-12">
        <div className="flex items-center gap-2 mb-2 [&_svg]:text-[1.4rem] [&_svg]:text-primary">
          <DevicesOutlinedIcon />
          <h2 className="text-lg font-semibold text-neutral-black">{tr.activeSessions}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{tr.activeSessionsDesc}</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 max-md:flex-col max-md:items-start py-3 px-6 border border-neutral-200 rounded-lg [&>svg]:text-neutral-400 [&>svg]:text-2xl">
            <DevicesOutlinedIcon />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-neutral-black">
                {navigator.userAgent.includes('Chrome') ? 'Google Chrome' : navigator.userAgent.includes('Firefox') ? 'Mozilla Firefox' : 'Browser'} — {navigator.platform}
              </h4>
              <span className="text-xs text-neutral-400">
                {new Date().toLocaleDateString(locales[lang], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#4caf50] py-0.5 px-2.5 bg-[#e8f5e9] rounded-sm">{tr.active}</span>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileSelected} />

      {toast && (
        <AlertToast title={toast.type === 'success' ? tr.success : tr.error} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default SecuritySettings;

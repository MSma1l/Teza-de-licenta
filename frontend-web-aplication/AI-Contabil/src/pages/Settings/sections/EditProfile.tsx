import { useState, useEffect, useRef } from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { UserProfile } from '../../../models/settingsTypes';
import { fetchUserProfile, updateUserProfile, uploadAvatar } from '../../../api/settingsApi';
import AlertToast from '../../../components/AlertToast/AlertToast';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

const t: Record<Lang, {
  title: string;
  name: string;
  namePlaceholder: string;
  email: string;
  contactNumber: string;
  phonePlaceholder: string;
  saving: string;
  save: string;
  editPhoto: string;
  success: string;
  error: string;
  profileSaved: string;
  avatarUpdated: string;
  saveError: string;
  avatarError: string;
}> = {
  ro: {
    title: 'Editare profil',
    name: 'Nume',
    namePlaceholder: 'Numele dumneavoastra',
    email: 'Email',
    contactNumber: 'Numar de telefon',
    phonePlaceholder: '+373 XXXXX XXX',
    saving: 'Se salveaza...',
    save: 'Salveaza',
    editPhoto: 'Schimba fotografia',
    success: 'Succes',
    error: 'Eroare',
    profileSaved: 'Profilul a fost salvat cu succes!',
    avatarUpdated: 'Avatar actualizat!',
    saveError: 'Eroare la salvare',
    avatarError: 'Eroare la upload avatar',
  },
  en: {
    title: 'Edit Profile',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    contactNumber: 'Contact Number',
    phonePlaceholder: '+373 XXXXX XXX',
    saving: 'Saving...',
    save: 'Save Changes',
    editPhoto: 'Edit profile photo',
    success: 'Success',
    error: 'Error',
    profileSaved: 'Profile saved successfully!',
    avatarUpdated: 'Avatar updated!',
    saveError: 'Save error',
    avatarError: 'Avatar upload error',
  },
  ru: {
    title: 'Редактирование профиля',
    name: 'Имя',
    namePlaceholder: 'Ваше имя',
    email: 'Электронная почта',
    contactNumber: 'Номер телефона',
    phonePlaceholder: '+373 XXXXX XXX',
    saving: 'Сохранение...',
    save: 'Сохранить',
    editPhoto: 'Изменить фото',
    success: 'Успех',
    error: 'Ошибка',
    profileSaved: 'Профиль успешно сохранён!',
    avatarUpdated: 'Аватар обновлён!',
    saveError: 'Ошибка сохранения',
    avatarError: 'Ошибка загрузки аватара',
  },
};

const EditProfile = () => {
  const { lang } = useLanguage();
  const tr = t[lang];

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    contactNumber: '',
    avatarUrl: '',
  });

  const [isEmailVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUserProfile();
        setProfile(data);
      } catch { /* */ }
    };
    load();
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUserProfile(profile);
      setProfile(updated);
      setToast({ message: tr.profileSaved, type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message || tr.saveError, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const avatarUrl = await uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatarUrl }));
      setToast({ message: tr.avatarUpdated, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || tr.avatarError, type: 'error' });
    }
  };

  return (
    <div className="p-8 px-12 max-md:px-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-neutral-black mb-12">{tr.title}</h1>

      <div className="flex gap-16 max-md:flex-col max-md:items-center">
        <div className="flex-1 max-w-[500px] flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">{tr.name}</label>
            <input
              type="text"
              className="w-full py-3 px-6 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={tr.namePlaceholder}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">{tr.email}</label>
            <div className="relative flex items-center">
              <input
                type="email"
                className="w-full py-3 px-6 pr-12 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplu.com"
              />
              {isEmailVerified && (
                <span className="absolute right-3 text-[#4caf50] flex items-center [&_svg]:text-2xl">
                  <CheckBoxIcon />
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">{tr.contactNumber}</label>
            <input
              type="tel"
              className="w-full py-3 px-6 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              value={profile.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder={tr.phonePlaceholder}
            />
          </div>

          <button
            className="btn-gradient mt-3 py-3 px-12 rounded-full text-base self-start"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? tr.saving : tr.save}
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-30 h-30 rounded-full border-3 border-neutral-black flex items-center justify-center overflow-hidden bg-neutral-100 [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" />
            ) : (
              <PersonOutlineIcon className="!text-5xl text-neutral-black" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarFileSelected}
          />
          <span
            className="text-sm text-[#1a73e8] cursor-pointer transition-opacity duration-200 hover:opacity-70"
            onClick={handleAvatarChange}
          >
            {tr.editPhoto}
          </span>
        </div>
      </div>

      {toast && (
        <AlertToast
          title={toast.type === 'success' ? tr.success : tr.error}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EditProfile;

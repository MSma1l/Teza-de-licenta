/* ============================================
   SECȚIUNEA EDIT PROFILE

   Formularul de editare profil cu:
   - Avatar + buton "Edit profile photo"
   - Câmpuri: Name, Email (cu verificare), Contact Number
   - Buton salvare

   NOTĂ: Datele vor veni din API în viitor.
   ============================================ */

import { useState } from 'react';

/* Importăm iconițe Material UI */
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

/* Importăm tipurile */
import type { UserProfile } from '../../../models/settingsTypes';

/* --- Componenta EditProfile --- */
const EditProfile = () => {
  /* State pentru datele profilului */
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    contactNumber: '',
    avatarUrl: '',
  });

  /* State pentru email verificat */
  const [isEmailVerified] = useState(false);

  /* Handler pentru schimbarea câmpurilor */
  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  /* Handler pentru salvare (va fi conectat la API) */
  const handleSave = () => {
    // TODO: Apel API updateUserProfile(profile)
    console.log('Saving profile:', profile);
  };

  /* Handler pentru schimbarea avatarului */
  const handleAvatarChange = () => {
    // TODO: Deschide file picker + apel API uploadAvatar
    console.log('Change avatar');
  };

  return (
    <div className="p-8 px-12 animate-fade-in">
      {/* === Titlul secțiunii === */}
      <h1 className="font-heading text-2xl font-bold text-neutral-black mb-12">Edit Profile</h1>

      {/* === Container principal (formular + avatar) === */}
      <div className="flex gap-16">
        {/* --- Formularul din stânga --- */}
        <div className="flex-1 max-w-[500px] flex flex-col gap-6">
          {/* Câmpul Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">Name</label>
            <input
              type="text"
              className="w-full py-3 px-6 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Numele dumneavoastră"
            />
          </div>

          {/* Câmpul Email cu verificare */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">Email</label>
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

          {/* Câmpul Contact Number */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral-black">Contact Number</label>
            <input
              type="tel"
              className="w-full py-3 px-6 border border-neutral-300 rounded-lg text-base text-neutral-600 bg-white transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              value={profile.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="+373 XXXXX XXX"
            />
          </div>

          {/* Butonul de salvare */}
          <button
            className="mt-3 py-3 px-12 bg-primary text-white rounded-full text-base font-semibold self-start transition-all duration-200 hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>

        {/* --- Avatarul din dreapta --- */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-30 h-30 rounded-full border-3 border-neutral-black flex items-center justify-center overflow-hidden bg-neutral-100 [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" />
            ) : (
              <PersonOutlineIcon className="!text-5xl text-neutral-black" />
            )}
          </div>
          <span
            className="text-sm text-[#1a73e8] cursor-pointer transition-opacity duration-200 hover:opacity-70"
            onClick={handleAvatarChange}
          >
            Edit profile photo
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

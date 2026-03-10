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

/* Importăm stilurile */
import './EditProfile.css';

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
    <div className="edit-profile">
      {/* === Titlul secțiunii === */}
      <h1 className="edit-profile__title">Edit Profile</h1>

      {/* === Container principal (formular + avatar) === */}
      <div className="edit-profile__content">
        {/* --- Formularul din stânga --- */}
        <div className="edit-profile__form">
          {/* Câmpul Name */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Name</label>
            <input
              type="text"
              className="edit-profile__input"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Numele dumneavoastră"
            />
          </div>

          {/* Câmpul Email cu verificare */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Email</label>
            <div className="edit-profile__input-wrapper">
              <input
                type="email"
                className="edit-profile__input"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplu.com"
              />
              {isEmailVerified && (
                <span className="edit-profile__verified-icon">
                  <CheckBoxIcon />
                </span>
              )}
            </div>
          </div>

          {/* Câmpul Contact Number */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Contact Number</label>
            <input
              type="tel"
              className="edit-profile__input"
              value={profile.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="+373 XXXXX XXX"
            />
          </div>

          {/* Butonul de salvare */}
          <button className="edit-profile__save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>

        {/* --- Avatarul din dreapta --- */}
        <div className="edit-profile__avatar-section">
          <div className="edit-profile__avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" />
            ) : (
              <PersonOutlineIcon className="edit-profile__avatar-placeholder" />
            )}
          </div>
          <span
            className="edit-profile__avatar-link"
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

/* ============================================
   SECȚIUNEA SECURITY SETTINGS

   Pagina de securitate cu:
   - Schimbare parolă (parola actuală + nouă + confirmare)
   - Gestionare documente de identitate
   - Autentificare în doi pași (2FA toggle)
   - Sesiuni active

   NOTĂ: Datele vor veni din API în viitor.
   ============================================ */

import { useState } from 'react';

/* Importăm iconițe Material UI */
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

/* Importăm tipurile */
import type { PasswordChangeData } from '../../../models/settingsTypes';

/* Importăm stilurile */
import './SecuritySettings.css';

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

  /* Handler schimbare parolă */
  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  /* Handler salvare parolă nouă */
  const handleSavePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // TODO: Afișează alertă de eroare
      console.log('Parolele nu coincid');
      return;
    }
    // TODO: Apel API changePassword(passwordData)
    console.log('Changing password:', passwordData);
  };

  /* Toggle vizibilitate parolă */
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /* Handler upload document */
  const handleUploadDocument = () => {
    // TODO: Deschide file picker + apel API uploadSecurityDocument
    console.log('Upload document');
  };

  return (
    <div className="security-settings">
      {/* === Titlu === */}
      <h1 className="security-settings__title">Security</h1>

      {/* === Secțiunea 1: Schimbare parolă === */}
      <div className="security-settings__section">
        <div className="security-settings__section-header">
          <LockOutlinedIcon />
          <h2 className="security-settings__section-title">Change Password</h2>
        </div>
        <p className="security-settings__section-desc">
          Schimbați parola contului pentru a menține securitatea datelor.
        </p>

        <div className="security-settings__form">
          {/* Parola actuală */}
          <div className="security-settings__field">
            <label className="security-settings__label">Current Password</label>
            <div className="security-settings__input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                className="security-settings__input"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Parola actuală"
              />
              <span
                className="security-settings__toggle"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          {/* Parola nouă */}
          <div className="security-settings__field">
            <label className="security-settings__label">New Password</label>
            <div className="security-settings__input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                className="security-settings__input"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Parola nouă"
              />
              <span
                className="security-settings__toggle"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          {/* Confirmare parolă */}
          <div className="security-settings__field">
            <label className="security-settings__label">Confirm New Password</label>
            <div className="security-settings__input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                className="security-settings__input"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirmă parola nouă"
              />
              <span
                className="security-settings__toggle"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>
          </div>

          <button className="security-settings__save-btn" onClick={handleSavePassword}>
            Update Password
          </button>
        </div>
      </div>

      {/* === Secțiunea 2: Documente de identitate === */}
      <div className="security-settings__section">
        <div className="security-settings__section-header">
          <DescriptionOutlinedIcon />
          <h2 className="security-settings__section-title">Identity Documents</h2>
        </div>
        <p className="security-settings__section-desc">
          Încărcați și gestionați documentele de identitate necesare pentru verificarea contului.
        </p>

        <div className="security-settings__documents">
          {/* Card document - Buletin/Carte de identitate */}
          <div className="security-settings__doc-card">
            <div className="security-settings__doc-info">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="security-settings__doc-name">Buletin / Carte de identitate</h4>
                <span className="security-settings__doc-status security-settings__doc-status--pending">
                  Neîncărcat
                </span>
              </div>
            </div>
            <button className="security-settings__upload-btn" onClick={handleUploadDocument}>
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>

          {/* Card document - Pașaport */}
          <div className="security-settings__doc-card">
            <div className="security-settings__doc-info">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="security-settings__doc-name">Pașaport</h4>
                <span className="security-settings__doc-status security-settings__doc-status--pending">
                  Neîncărcat
                </span>
              </div>
            </div>
            <button className="security-settings__upload-btn" onClick={handleUploadDocument}>
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>

          {/* Card document - Extras de cont */}
          <div className="security-settings__doc-card">
            <div className="security-settings__doc-info">
              <DescriptionOutlinedIcon />
              <div>
                <h4 className="security-settings__doc-name">Extras de cont bancar</h4>
                <span className="security-settings__doc-status security-settings__doc-status--pending">
                  Neîncărcat
                </span>
              </div>
            </div>
            <button className="security-settings__upload-btn" onClick={handleUploadDocument}>
              <CloudUploadOutlinedIcon />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* === Secțiunea 3: Autentificare în doi pași === */}
      <div className="security-settings__section">
        <div className="security-settings__section-header">
          <SecurityOutlinedIcon />
          <h2 className="security-settings__section-title">Two-Factor Authentication</h2>
        </div>
        <p className="security-settings__section-desc">
          Adăugați un nivel suplimentar de securitate contului dumneavoastră.
        </p>

        <div className="security-settings__toggle-row">
          <span className="security-settings__toggle-label">
            {is2FAEnabled ? 'Activat' : 'Dezactivat'}
          </span>
          <button
            className={`security-settings__toggle-btn ${
              is2FAEnabled ? 'security-settings__toggle-btn--active' : ''
            }`}
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          >
            <span className="security-settings__toggle-knob" />
          </button>
        </div>
      </div>

      {/* === Secțiunea 4: Sesiuni active === */}
      <div className="security-settings__section">
        <div className="security-settings__section-header">
          <DevicesOutlinedIcon />
          <h2 className="security-settings__section-title">Active Sessions</h2>
        </div>
        <p className="security-settings__section-desc">
          Gestionați dispozitivele pe care sunteți autentificat.
        </p>

        <div className="security-settings__sessions">
          <div className="security-settings__session-card">
            <DevicesOutlinedIcon />
            <div className="security-settings__session-info">
              <h4>Browser curent</h4>
              <span>Ultima activitate: acum</span>
            </div>
            <span className="security-settings__session-status">Activ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;

/* ============================================
   PAGINA SETTINGS

   Layout principal al setărilor cu:
   - Navbar (logat, fără linkuri de navigare)
   - Sidebar din stânga (meniu setări)
   - Conținut din dreapta (secțiunea activă)

   Secțiunile disponibile:
   - Edit Profile
   - Notification
   - Security
   - Help

   Navigarea între secțiuni se face prin sidebar.
   ============================================ */

import { useState } from 'react';

/* Importăm componentele */
import Navbar from '../../components/Navbar/Navbar';
import SettingsSidebar from '../../components/SettingsSidebar/SettingsSidebar';

/* Importăm secțiunile */
import EditProfile from './sections/EditProfile';
import NotificationList from './sections/NotificationList';
import SecuritySettings from './sections/SecuritySettings';
import HelpFaq from './sections/HelpFaq';

/* Importăm tipurile */
import type { SettingsSection } from '../../models/settingsTypes';

/* Importăm stilurile */
import './Settings.css';

/* --- Componenta Settings --- */
const Settings = () => {
  /* State pentru secțiunea activă din sidebar */
  const [activeSection, setActiveSection] = useState<SettingsSection>('edit-profile');

  /* Funcția care returnează componenta corespunzătoare secțiunii active */
  const renderSection = () => {
    switch (activeSection) {
      case 'edit-profile':
        return <EditProfile />;
      case 'notification':
        return <NotificationList />;
      case 'security':
        return <SecuritySettings />;
      case 'help':
        return <HelpFaq />;
      default:
        return <EditProfile />;
    }
  };

  return (
    <div className="settings-page">
      {/* === NAVBAR - logat, fără linkuri navigare === */}
      <Navbar isLoggedIn={true} showNavLinks={false} />

      {/* === CONȚINUT PRINCIPAL (Sidebar + Secțiune) === */}
      <div className="settings-page__content">
        {/* Sidebar-ul din stânga */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Secțiunea activă din dreapta */}
        <main className="settings-page__main">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Settings;

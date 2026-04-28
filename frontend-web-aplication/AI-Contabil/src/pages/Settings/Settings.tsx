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

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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

/* Maparea aliasilor URL (ce trimit alte componente) -> SettingsSection real.
   Acceptam si plurale ca "notifications" pentru ca url-urile sa fie naturale. */
const TAB_ALIAS: Record<string, SettingsSection> = {
  'edit-profile': 'edit-profile',
  profile: 'edit-profile',
  notification: 'notification',
  notifications: 'notification',
  security: 'security',
  help: 'help',
  faq: 'help',
};

function rezolvaSectiune(raw: string | null): SettingsSection {
  if (!raw) return 'edit-profile';
  return TAB_ALIAS[raw.toLowerCase()] ?? 'edit-profile';
}

/* --- Componenta Settings --- */
const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /* State pentru secțiunea activă din sidebar — initializat din ?tab= */
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    rezolvaSectiune(searchParams.get('tab')),
  );

  /* Re-sincronizam cand URL-ul se schimba (ex: utilizatorul navigheaza prin Navbar) */
  useEffect(() => {
    const noua = rezolvaSectiune(searchParams.get('tab'));
    setActiveSection((prev) => (prev === noua ? prev : noua));
  }, [searchParams]);

  /* Cand userul schimba tab-ul din sidebar, actualizam si URL-ul (fara reload) */
  const handleSectionChange = (s: SettingsSection) => {
    setActiveSection(s);
    setSearchParams({ tab: s }, { replace: true });
  };

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* === NAVBAR - logat, fără linkuri navigare === */}
      <Navbar isLoggedIn={true} showNavLinks={false} />

      {/* === CONȚINUT PRINCIPAL (Sidebar + Secțiune) === */}
      <div className="flex-1 flex max-w-[1200px] mx-auto w-full bg-white border-x border-neutral-200">
        {/* Sidebar-ul din stânga */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Secțiunea activă din dreapta */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-65px)]">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Settings;

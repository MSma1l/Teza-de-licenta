/* ============================================
   COMPONENTA SETTINGS SIDEBAR

   Sidebar-ul din stânga paginii de Settings.
   Afișează meniul cu secțiunile:
   - Edit profile
   - Notification
   - Security
   - Help

   Props:
   - activeSection: secțiunea activă curentă
   - onSectionChange: callback pentru schimbarea secțiunii
   - onBack: callback pentru butonul de înapoi
   ============================================ */

import { useNavigate } from 'react-router-dom';

/* Importăm iconițe Material UI */
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

/* Importăm tipurile */
import type { SettingsSection } from '../../models/settingsTypes';

/* Importăm stilurile */
import './SettingsSidebar.css';

/* --- Tipul props-urilor componentei --- */
interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

/* --- Definim elementele meniului --- */
const menuItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'edit-profile', label: 'Edit profile', icon: <EditOutlinedIcon /> },
  { id: 'notification', label: 'Notification', icon: <NotificationsNoneOutlinedIcon /> },
  { id: 'security', label: 'Security', icon: <LockOutlinedIcon /> },
  { id: 'help', label: 'Help', icon: <HelpOutlineOutlinedIcon /> },
];

/* --- Componenta SettingsSidebar --- */
const SettingsSidebar = ({ activeSection, onSectionChange }: SettingsSidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="settings-sidebar">
      {/* === Butonul de înapoi + titlu === */}
      <div className="settings-sidebar__header" onClick={() => navigate('/home')}>
        <ChevronLeftIcon />
        <h2 className="settings-sidebar__title">settings</h2>
      </div>

      {/* === Lista de meniu === */}
      <nav className="settings-sidebar__nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`settings-sidebar__item ${
              activeSection === item.id ? 'settings-sidebar__item--active' : ''
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="settings-sidebar__item-icon">{item.icon}</span>
            <span className="settings-sidebar__item-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;

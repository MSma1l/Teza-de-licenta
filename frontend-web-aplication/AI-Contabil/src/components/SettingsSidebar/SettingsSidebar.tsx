import { useNavigate } from 'react-router-dom';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import type { SettingsSection } from '../../models/settingsTypes';
import { useAuth } from '../../context/AuthContext';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const allMenuItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'edit-profile', label: 'Edit profile', icon: <EditOutlinedIcon /> },
  { id: 'notification', label: 'Notification', icon: <NotificationsNoneOutlinedIcon /> },
  { id: 'security', label: 'Security', icon: <LockOutlinedIcon /> },
  { id: 'help', label: 'Help', icon: <HelpOutlineOutlinedIcon /> },
];

const SettingsSidebar = ({ activeSection, onSectionChange }: SettingsSidebarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admin / super_admin nu au nevoie de Help — au panou dedicat
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const menuItems = isAdmin ? allMenuItems.filter((m) => m.id !== 'help') : allMenuItems;

  return (
    <aside className="w-[280px] min-w-[280px] border-r border-neutral-200 py-8 flex flex-col bg-white">
      <div
        className="flex items-center gap-3 px-8 mb-12 cursor-pointer transition-opacity hover:opacity-70 [&_svg]:text-2xl [&_svg]:text-neutral-black"
        onClick={() => navigate('/home')}
      >
        <ChevronLeftIcon />
        <h2 className="text-xl font-bold text-neutral-black">settings</h2>
      </div>

      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 py-4 px-8 cursor-pointer transition-colors hover:bg-neutral-100 ${
              activeSection === item.id ? 'text-neutral-black' : 'text-neutral-500'
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="flex items-center justify-center [&_svg]:text-[1.4rem]">{item.icon}</span>
            <span className={`text-base ${activeSection === item.id ? 'font-bold' : 'font-normal'}`}>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;

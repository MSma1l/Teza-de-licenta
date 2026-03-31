/* ============================================
   SECȚIUNEA NOTIFICATION LIST

   Lista de notificări cu:
   - Iconița clopoțel + titlu "Notification"
   - Câmp de căutare (Search)
   - Lista de carduri cu notificări
   - Fiecare card: iconița info, titlu, badge urgent,
     text mesaj, data

   NOTĂ: Datele vor veni din API în viitor.
   ============================================ */

import { useState, useEffect } from 'react';

/* Importăm iconițe Material UI */
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';

/* Importăm tipurile și API-ul */
import type { Notification } from '../../../models/settingsTypes';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../../../api/notificationsApi';

/* --- Componenta NotificationList --- */
const NotificationList = () => {
  /* State pentru notificări */
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /* State pentru termenul de căutare */
  const [searchTerm, setSearchTerm] = useState('');

  /* Încărcăm notificările la montare */
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      /* silent */
    }
  };

  /* Handler: marchează ca citită */
  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  /* Handler: marchează toate ca citite */
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  /* Handler: șterge notificare */
  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /* Filtrăm notificările după termenul de căutare */
  const filteredNotifications = notifications.filter(
    (notif) =>
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-8 px-12 animate-fade-in">
      {/* === Header cu iconița + titlu + acțiuni === */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <NotificationsNoneOutlinedIcon className="!text-[2rem] text-neutral-black" />
          <h1 className="font-heading text-2xl font-bold text-neutral-black">Notification</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold py-0.5 px-2 rounded-full bg-primary text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-70 transition-opacity cursor-pointer"
            onClick={handleMarkAllRead}
          >
            <DoneAllIcon fontSize="small" />
            Marchează toate ca citite
          </button>
        )}
      </div>

      {/* === Câmpul de căutare === */}
      <div className="flex items-center gap-2 bg-neutral-200 rounded-lg py-2 px-3 mb-8 max-w-[500px]">
        <SearchIcon className="!text-[1.2rem] text-neutral-400" />
        <input
          type="text"
          className="flex-1 bg-transparent text-sm text-neutral-black placeholder:text-neutral-400 focus:outline-none"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* === Lista de notificări === */}
      <div className="flex flex-col gap-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-3 p-6 border border-neutral-200 rounded-lg bg-white transition-shadow duration-200 hover:shadow-sm ${
                !notif.isRead ? 'border-l-3 border-l-primary' : ''
              }`}
            >
              {/* Iconița info */}
              <div className="flex items-start pt-0.5 [&_svg]:text-2xl [&_svg]:text-[#26c6da]">
                <InfoOutlinedIcon />
              </div>

              {/* Conținutul notificării */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-black">{notif.title}</h3>
                  {notif.type === 'urgent' && (
                    <span className="text-xs font-semibold py-0.5 px-2 rounded-sm lowercase bg-[#ffebee] text-[#c62828] border border-[#ef9a9a]">
                      urgent
                    </span>
                  )}
                  {notif.type === 'warning' && (
                    <span className="text-xs font-semibold py-0.5 px-2 rounded-sm lowercase bg-[#fff8e1] text-[#e65100] border border-[#ffcc02]">
                      warning
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{notif.message}</p>
                <span className="text-xs text-neutral-400 text-right mt-1">{notif.date}</span>
              </div>

              {/* Butoane acțiuni */}
              <div className="flex flex-col gap-1 items-center flex-shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-500 transition-colors cursor-pointer"
                    title="Marchează ca citită"
                  >
                    <CheckIcon fontSize="small" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Șterge"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-16 text-neutral-400 text-base">
            <p>Nu aveți notificări.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;

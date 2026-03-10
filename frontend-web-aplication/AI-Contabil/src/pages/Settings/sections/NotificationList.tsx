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

/* Importăm tipurile și API-ul */
import type { Notification } from '../../../models/settingsTypes';
import { fetchNotifications } from '../../../api/notificationsApi';

/* Importăm stilurile */
import './NotificationList.css';

/* --- Componenta NotificationList --- */
const NotificationList = () => {
  /* State pentru notificări */
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /* State pentru termenul de căutare */
  const [searchTerm, setSearchTerm] = useState('');

  /* Încărcăm notificările la montare */
  useEffect(() => {
    const loadNotifications = async () => {
      const data = await fetchNotifications();
      setNotifications(data);
    };
    loadNotifications();
  }, []);

  /* Filtrăm notificările după termenul de căutare */
  const filteredNotifications = notifications.filter(
    (notif) =>
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="notification-list">
      {/* === Header cu iconița + titlu === */}
      <div className="notification-list__header">
        <NotificationsNoneOutlinedIcon className="notification-list__header-icon" />
        <h1 className="notification-list__title">Notification</h1>
      </div>

      {/* === Câmpul de căutare === */}
      <div className="notification-list__search">
        <SearchIcon className="notification-list__search-icon" />
        <input
          type="text"
          className="notification-list__search-input"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* === Lista de notificări === */}
      <div className="notification-list__items">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${
                !notif.isRead ? 'notification-card--unread' : ''
              }`}
            >
              {/* Iconița info */}
              <div className="notification-card__icon">
                <InfoOutlinedIcon />
              </div>

              {/* Conținutul notificării */}
              <div className="notification-card__content">
                <div className="notification-card__top">
                  <h3 className="notification-card__title">{notif.title}</h3>
                  {notif.type === 'urgent' && (
                    <span className="notification-card__badge notification-card__badge--urgent">
                      urgent
                    </span>
                  )}
                  {notif.type === 'warning' && (
                    <span className="notification-card__badge notification-card__badge--warning">
                      warning
                    </span>
                  )}
                </div>
                <p className="notification-card__message">{notif.message}</p>
                <span className="notification-card__date">{notif.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="notification-list__empty">
            <p>Nu aveți notificări.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;

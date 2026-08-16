import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnreadCount,
  getMyNotifications,
  getNotificationIcon,
  getRelativeTime,
  NOTIFICATIONS_UPDATED_EVENT,
} from "../services/notificationService";
import NotificationDetailModal from "./NotificationDetailModal";
import "../styles/navbar.css";

/**
 * Campanita de notificaciones reutilizable.
 * @param {string|null} notificationLink  Ruta "Ver perfil del estudiante" desde el modal de una notif. con studentModalityId.
 * @param {string|null} viewAllLink       Ruta de la página completa de notificaciones.
 * @param {boolean}     navigateOnly      Si true, al hacer clic va directo a viewAllLink sin dropdown.
 */
export default function NotificationBell({
  notificationLink = null,
  viewAllLink = null,
  navigateOnly = false,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [detailNotification, setDetailNotification] = useState(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
      if (showDropdown) fetchNotifications();
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (navigateOnly) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, navigateOnly]);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error al obtener contador de notificaciones:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Error al obtener notificaciones:", err);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleBellClick = () => {
    if (navigateOnly) {
      if (viewAllLink) navigate(viewAllLink);
      return;
    }
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) fetchNotifications();
  };

  const handleNotificationClick = (notification) => {
    setShowDropdown(false);
    setDetailNotification(notification);
  };

  return (
    <div className="notification-container" ref={navigateOnly ? null : dropdownRef}>
      <button
        className="notification-bell"
        onClick={handleBellClick}
        aria-label="Notificaciones"
        title="Ver notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {!navigateOnly && showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} sin leer</span>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loadingNotifications ? (
              <div className="notification-loading">
                <div className="spinner-small"></div>
                <span>Cargando...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">📭</div>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-subject-row">
                        <div className="notification-subject">{notification.subject}</div>
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {getRelativeTime(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.read && <div className="notification-unread-dot"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && viewAllLink && (
            <div className="notification-dropdown-footer">
              <button
                onClick={() => { setShowDropdown(false); navigate(viewAllLink); }}
                className="view-all-btn"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      <NotificationDetailModal
        notification={detailNotification}
        onClose={() => setDetailNotification(null)}
        notificationLink={notificationLink}
      />
    </div>
  );
}
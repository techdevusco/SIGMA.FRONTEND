import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnreadCount,
  getMyNotifications,
  markNotificationAsRead,
  getNotificationIcon,
  getRelativeTime,
} from "../services/notificationService";
import "../styles/navbar.css";

/**
 * Campanita de notificaciones reutilizable.
 * @param {string|null} notificationLink  Ruta al hacer clic en una notif. con studentModalityId.
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
  const [notificationError, setNotificationError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
    if (!next) setExpandedId(null);
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        await fetchUnreadCount();
        await fetchNotifications();
      }
      setShowDropdown(false);
      if (notification.studentModalityId && notificationLink) {
        navigate(notificationLink);
      }
    } catch (err) {
      console.error("Error al marcar notificacion como leida:", err);
      setNotificationError(
        err.response?.data?.message || err.message || "Error al procesar notificacion"
      );
      setTimeout(() => setNotificationError(""), 5000);
    }
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

          {notificationError && (
            <div style={{
              padding: "0.75rem",
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.875rem",
              borderBottom: "1px solid #fecaca",
            }}>
              ⚠️ {notificationError}
            </div>
          )}

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
                    className={`notification-item ${!notification.read ? "unread" : ""} ${expandedId === notification.id ? "expanded" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-subject-row">
                        <div className="notification-subject">{notification.subject}</div>
                        <button
                          className="notification-detail-btn"
                          onClick={(e) => toggleExpand(e, notification.id)}
                          title={expandedId === notification.id ? "Ocultar detalles" : "Ver mas detalles"}
                        >
                          {expandedId === notification.id ? "▲" : "▼"}
                        </button>
                      </div>
                      <div className={`notification-message ${expandedId === notification.id ? "expanded" : ""}`}>
                        {notification.message}
                      </div>
                      {expandedId === notification.id && (
                        <div className="notification-detail-panel">
                          {notification.type && (
                            <span className="notification-type-badge">
                              {notification.type.replace(/_/g, " ")}
                            </span>
                          )}
                          {notification.studentModalityId && notificationLink && (
                            <button
                              className="notification-goto-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(false);
                                setExpandedId(null);
                                navigate(notificationLink);
                              }}
                            >
                              Ver perfil del estudiante →
                            </button>
                          )}
                        </div>
                      )}
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
    </div>
  );
}

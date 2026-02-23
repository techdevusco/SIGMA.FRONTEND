import { useEffect, useState } from "react";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  getNotificationIcon,
  getRelativeTime,
} from "../../services/notificationService";
import "../../styles/student/notifications.css";

/**
 * Página de notificaciones genérica (Director, Comité, Jurado, Jefatura).
 * Sin lógica de invitaciones grupales (exclusiva de estudiantes).
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
      setMessage("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchNotifications();
      setMessage("✅ Marcada como leída");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error al marcar como leída";
      setMessage(`❌ ${errorMsg}`);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) {
      setMessage("⚠️ No hay notificaciones sin leer");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    try {
      await markAllAsRead(unreadIds);
      await fetchNotifications();
      setMessage(`✅ ${unreadIds.length} marcadas como leídas`);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="notifications-title-section">
          <h1>Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="unread-badge-header">{unreadCount} sin leer</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-mark-all">
            ✓ Marcar todas como leídas
          </button>
        )}
      </div>

      {message && <div className="notifications-alert">{message}</div>}

      <div className="notifications-tabs">
        <button
          className={`tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Todas ({notifications.length})
        </button>
        <button
          className={`tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Sin leer ({unreadCount})
        </button>
      </div>

      <div className="notifications-list-container">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>
              {filter === "unread"
                ? "No tienes notificaciones sin leer"
                : "No tienes notificaciones"}
            </h3>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? "unread" : ""}`}
              >
                <div className="notification-main">
                  <div className="notification-icon-container">
                    <span className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>

                  <div className="notification-body">
                    <div className="notification-top">
                      <h3 className="notification-title">{notification.subject}</h3>
                      {!notification.read && (
                        <span className="badge-nuevo">Nuevo</span>
                      )}
                    </div>
                    <p className="notification-text">{notification.message}</p>
                    <div className="notification-bottom">
                      <span className="notification-time">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {!notification.read && (
                  <button
                    className="btn-mark-read"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

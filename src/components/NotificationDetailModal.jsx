import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  markNotificationAsRead,
  getNotificationIcon,
  getRelativeTime,
  emitNotificationsUpdated,
} from "../services/notificationService";
import { useAuth } from "../context/AuthContext";
import { getModalityRoute } from "../utils/notificationUtils";
import "./NotificationDetailModal.css";

export default function NotificationDetailModal({
  notification,
  onClose,
  notificationLink = null,
}) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const modalityRoute = getModalityRoute(role, notification?.studentModalityId);

  useEffect(() => {
    if (!notification) return;
    if (!notification.read) {
      markNotificationAsRead(notification.id)
        .then(() => emitNotificationsUpdated())
        .catch(() => {});
    }
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [notification, onClose]);

  if (!notification) return null;

  const absoluteDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div
        className="notification-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-modal-header">
          <span className="notification-modal-icon">
            {getNotificationIcon(notification.type)}
          </span>
          <div className="notification-modal-heading">
            {notification.type && (
              <span className="notification-modal-type">
                {notification.type.replace(/_/g, " ")}
              </span>
            )}
            <h3 className="notification-modal-title">{notification.subject}</h3>
          </div>
          <button
            className="notification-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="notification-modal-body">
          <p className="notification-modal-message">{notification.message}</p>
        </div>

        <div className="notification-modal-footer">
          <span className="notification-modal-time">
            {getRelativeTime(notification.createdAt)}
            {absoluteDate ? ` · ${absoluteDate}` : ""}
          </span>
          {modalityRoute && (
            <button
              className="notification-modal-goto"
              onClick={() => {
                onClose();
                navigate(modalityRoute);
              }}
            >
              Ver perfil →
            </button>
          )}
          {notification.studentModalityId && notificationLink && (
            <button
              className="notification-modal-goto"
              onClick={() => {
                onClose();
                navigate(notificationLink);
              }}
            >
              Ver perfil del estudiante →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
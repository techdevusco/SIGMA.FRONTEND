import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "../styles/navbar.css";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar-wrapper">
      <div className="navbar">
        <div className="navbar-brand">SIGMA</div>

        <ul className="navbar-links">
          <li><Link to="/student">Perfil</Link></li>
          <li><Link to="/student/modalities">Modalidades</Link></li>
          <li><Link to="/student/documents">Documentos</Link></li>
          <li><Link to="/student/status">Estado</Link></li>
          <li><Link to="/student/cancellation">Cancelar Modalidad</Link></li>
        </ul>

        <div className="navbar-actions">
          <NotificationBell
            notificationLink="/student/status"
            viewAllLink="/student/notifications"
          />
          <button className="navbar-logout" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </nav>
  );
}

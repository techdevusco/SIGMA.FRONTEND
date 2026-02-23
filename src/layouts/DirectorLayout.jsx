import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import "../styles/admin/AdminLayout.css";

export default function DirectorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="sidebar-header-top">
            <h1 className="admin-logo">SIGMA DIRECTOR</h1>
            <div className="sidebar-bell"><NotificationBell viewAllLink="/project-director/notifications" navigateOnly /></div>
          </div>
          <p className="admin-subtitle">Director de Proyecto</p>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <h3 className="admin-nav-title">Estudiantes</h3>
            <NavLink to="/project-director" end className="admin-nav-link">
              <span className="admin-nav-icon">📊</span>
              Dashboard
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3 className="admin-nav-title">Sistema</h3>
            <NavLink to="/project-director/notifications" className="admin-nav-link">
              <span className="admin-nav-icon">🔔</span>
              Notificaciones
            </NavLink>
          </div>
        </nav>

        <button onClick={handleLogout} className="admin-logout-btn">
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
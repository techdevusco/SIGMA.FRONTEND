import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import "../styles/programhead/layout.css";

export default function ProgramHeadLayout() {
  console.log("👨‍💼 ProgramHeadLayout montado");
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProgramHeadLayout useEffect - usuario:", user);
    
    return () => {
      console.log("ProgramHeadLayout desmontado");
    };
  }, [user]);

  const handleLogout = () => {
    console.log("Iniciando logout desde ProgramHeadLayout");
    logout();
    navigate("/login");
  };

  return (
    <div className="program-head-layout">
      {/* Sidebar */}
      <aside className="program-head-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2 className="sidebar-title">SIGMA</h2>
            <div className="sidebar-bell"><NotificationBell viewAllLink="/jefeprograma/notifications" navigateOnly /></div>
          </div>
          <p className="sidebar-subtitle">Jefatura de Programa </p>
          <p className="sidebar-subtitle">Coordinador de modalidades </p>
          <p className="user-info">{user?.email || "Cargando..."}</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="nav-section-title">Menú Principal</p>
            
            <NavLink
              to="/jefeprograma"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon"></span>
              <span className="nav-label">    Dashboard</span>
            </NavLink>

          </div>

          <div className="nav-section">
            <p className="nav-section-title">Diplomados</p>
            
            <NavLink
              to="/jefeprograma/seminars"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon"></span>
              <span className="nav-label">Gestión de Diplomados</span>
            </NavLink>

          </div>

          <div className="nav-section">
            <p className="nav-section-title">Sistema</p>
            <NavLink
              to="/jefeprograma/notifications"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon"></span>
              <span className="nav-label">Notificaciones</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="program-head-main">
        <Outlet />
      </main>
    </div>
  );
}

//layouts/ConuncilLayout.jsx//
import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import "../styles/council/layout.css";

export default function CouncilLayout() {
  console.log("🏛️ CouncilLayout montado");
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("CouncilLayout useEffect - usuario:", user);
    
    return () => {
      console.log("CouncilLayout desmontado");
    };
  }, [user]);

  const handleLogout = () => {
    console.log("Iniciando logout desde CouncilLayout");
    logout();
    navigate("/login");
  };

  return (
    <div className="council-layout">
      {/* Sidebar */}
      <aside className="council-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2>Comité de Currículo de Programa</h2>
            <div className="sidebar-bell"><NotificationBell viewAllLink="/comite/notifications" navigateOnly /></div>
          </div>
          <p className="user-info">{user?.email || "Cargando..."}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/comite"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📋</span>
            Estudiantes Pendientes
          </NavLink>

          <NavLink
            to="/comite/proposals"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📅</span>
            Solicitudes de Sustentación
          </NavLink>      

          <NavLink
            to="/comite/cancellations"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">🚫</span>
            Solicitudes de Cancelación
          </NavLink>

          <NavLink
            to="/comite/reports"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📊</span>
            Reportes
          </NavLink>

          <NavLink
            to="/comite/notifications"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">🔔</span>
            Notificaciones
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="council-main">
        <Outlet />
      </main>
    </div>
  );
}
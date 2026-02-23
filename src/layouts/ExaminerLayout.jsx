import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import "../styles/council/layout.css";

export default function ExaminerLayout() {
  console.log("👨‍⚖️ ExaminerLayout montado");
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ExaminerLayout useEffect - usuario:", user);
    
    return () => {
      console.log("ExaminerLayout desmontado");
    };
  }, [user]);

  const handleLogout = () => {
    console.log("Iniciando logout desde ExaminerLayout");
    logout();
    navigate("/login");
  };

  return (
    <div className="council-layout">
      {/* Sidebar */}
      <aside className="council-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2>Portal de Jueces</h2>
            <div className="sidebar-bell"><NotificationBell viewAllLink="/examiner/notifications" navigateOnly /></div>
          </div>
          <p className="user-info">{user?.email || "Cargando..."}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/examiner"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">👨‍⚖️</span>
            Mis Asignaciones
          </NavLink>

          <NavLink
            to="/examiner/notifications"
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
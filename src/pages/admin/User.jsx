import { useEffect, useState } from "react";
import {
  getAllUsers,
  changeUserStatus,
  getAllRoles,
  registerUserByAdmin,
  getAllAcademicPrograms,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

// Traducción de nombres de roles
const ROLE_TRANSLATIONS = {
  ADMIN: "Administrador",
  STUDENT: "Estudiante",
  PROGRAM_HEAD: "Jefe de Programa",
  PROJECT_DIRECTOR: "Director de Proyecto",
  PROGRAM_CURRICULUM_COMMITTEE: "Comité Curricular del Programa",
  EXAMINER: "Jurado",
  SECRETARY: "Secretario/a",
  COUNCIL: "Consejo",
};

const translateRole = (roleName) =>
  ROLE_TRANSLATIONS[roleName?.toUpperCase()] || roleName;

// Roles que requieren programa académico
const ROLES_REQUIRING_PROGRAM = [
  "PROGRAM_HEAD",
  "PROJECT_DIRECTOR",
  "PROGRAM_CURRICULUM_COMMITTEE",
  "EXAMINER"
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filtros
  const [searchName, setSearchName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Form data para crear usuario
  const [createFormData, setCreateFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    roleName: "",
    academicProgramIds: [],
  });

  useEffect(() => {
    fetchData();
  }, [searchName]);

  const fetchData = async () => {
    try {
      const [usersData, rolesData, programsData] = await Promise.all([
        getAllUsers({ search: searchName }),
        getAllRoles(),
        getAllAcademicPrograms(),
      ]);
      
      console.log("Users data:", usersData);
      console.log("Roles data:", rolesData);
      console.log("Programs data:", programsData);
      
      const enrichedRoles = rolesData.map((role, index) => ({
        ...role,
        id: role.id || index + 1,
      }));
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(enrichedRoles);
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setMessage("Error al cargar datos: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchName(searchInput);
  };

  const handleClearSearch = () => {
    setSearchName("");
    setSearchInput("");
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await changeUserStatus({ userId, status: newStatus });
      setMessage(`Usuario ${newStatus === "ACTIVE" ? "activado" : "desactivado"} exitosamente`);
      fetchData();
      
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setMessage("Error al cambiar estado del usuario: " + getErrorMessage(err));
    }
  };



  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: "",
      lastName: "",
      email: "",
      password: "",
      roleName: "",
      academicProgramIds: [],
    });
    setShowCreateModal(true);
  };



  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validación de correo institucional
    if (!createFormData.email.endsWith("@usco.edu.co")) {
      setMessage("El correo debe ser institucional con dominio @usco.edu.co");
      return;
    }

    // Preparar datos para enviar
    const userData = {
      name: createFormData.name,
      lastName: createFormData.lastName,
      email: createFormData.email,
      password: createFormData.password,
      roleName: createFormData.roleName,
    };

    // Solo agregar programas si el rol lo requiere
    if (ROLES_REQUIRING_PROGRAM.includes(createFormData.roleName)) {
      if (!createFormData.academicProgramIds.length) {
        setMessage(`El rol ${createFormData.roleName} requiere que se especifique al menos un programa académico`);
        return;
      }
      if (createFormData.roleName === "EXAMINER") {
        // nuevo campo lista para el backend actualizado
        userData.academicProgramIds = createFormData.academicProgramIds;
        // campo singular para compatibilidad con la validación actual del backend
        userData.academicProgramId = createFormData.academicProgramIds[0];
      } else {
        userData.academicProgramId = createFormData.academicProgramIds[0];
      }
    }

    console.log("Creando usuario:", userData);

    try {
      await registerUserByAdmin(userData);
      // Construir mensaje local mostrando todos los programas seleccionados
      if (ROLES_REQUIRING_PROGRAM.includes(createFormData.roleName) && createFormData.academicProgramIds.length) {
        const selectedProgramNames = programs
          .filter((p) => createFormData.academicProgramIds.includes(p.id))
          .map((p) => p.name)
          .join(", ");
        setMessage(
          `Usuario registrado exitosamente con el rol ${translateRole(createFormData.roleName)} asignado al/los programa(s): ${selectedProgramNames}`
        );
      } else {
        setMessage(`Usuario registrado exitosamente con el rol ${translateRole(createFormData.roleName)}`);
      }
      setShowCreateModal(false);
      fetchData();
      
      setTimeout(() => setMessage(""), 9000);
    } catch (err) {
      console.error("Error al crear usuario:", err);
      const errorMsg = getErrorMessage(err);
      setMessage("Error al crear usuario: " + errorMsg);
    }
  };

  const requiresProgram = () => {
    return ROLES_REQUIRING_PROGRAM.includes(createFormData.roleName);
  };

  const handleProgramCheckboxChange = (programId) => {
    const id = parseInt(programId);
    setCreateFormData(prev => ({
      ...prev,
      academicProgramIds: prev.academicProgramIds.includes(id)
        ? prev.academicProgramIds.filter(p => p !== id)
        : [...prev.academicProgramIds, id],
    }));
  };

  const getFullName = (user) => {
    if (user.name) {
      return user.name;
    }
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Sin nombre';
  };

  const getProfileName = (user) => {
    if (user.name) return user.name;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre';
  };

  if (loading) {
    return <div className="admin-loading">Cargando usuarios...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Usuarios</h1>
          <p className="admin-page-subtitle">Administra usuarios y sus estados</p>
        </div>
        <button onClick={handleOpenCreateModal} className="admin-btn-primary">
          ➕ Crear Usuario
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      {/* Filtro de búsqueda */}
      <div className="admin-filters">
        <div className="filter-section">
          <label className="filter-label">Buscar usuario por nombre o email:</label>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre o email del usuario..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Buscar
            </button>
          </form>
        </div>

        {searchName && (
          <button onClick={handleClearSearch} className="clear-filters-button">
            ✕ Limpiar Búsqueda
          </button>
        )}
      </div>

      {/* Indicador de búsqueda activa */}
      {searchName && (
        <div className="active-filters">
          <strong>Búsqueda activa:</strong>
          <span className="filter-tag">"{searchName}"</span>
        </div>
      )}

      {/* Contador de resultados */}
      {searchName && (
        <div className="results-count">
          {users.length === 0 
            ? "No se encontraron usuarios" 
            : `Mostrando ${users.length} usuario${users.length !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                  {searchName 
                    ? `No se encontraron usuarios que coincidan con "${searchName}"`
                    : "No hay usuarios registrados"}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{getFullName(user)}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <div className="admin-tags">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, idx) => (
                          <span key={idx} className="admin-tag">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="admin-text-muted">Sin rol</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${user.status?.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        className={user.status === "ACTIVE" ? "admin-btn-delete" : "admin-btn-edit"}
                      >
                        {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button onClick={() => setShowCreateModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Nombre *</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="admin-input"
                  placeholder="Juan"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Apellido *</label>
                <input
                  type="text"
                  value={createFormData.lastName}
                  onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                  className="admin-input"
                  placeholder="Pérez"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Email Institucional *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="admin-input"
                  placeholder="juan.perez@usco.edu.co"
                  required
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Debe terminar en @usco.edu.co
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Contraseña *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="admin-input"
                  placeholder="Contraseña segura"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Rol *</label>
                <select
                  value={createFormData.roleName}
                  onChange={(e) => setCreateFormData({ ...createFormData, roleName: e.target.value, academicProgramIds: [] })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona un rol --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {translateRole(role.name)}
                    </option>
                  ))}
                </select>
              </div>

              {requiresProgram() && (
                <div className="admin-form-group">
                  <label className="admin-label">
                    Programa{createFormData.roleName === "EXAMINER" ? "s" : ""} Académico{createFormData.roleName === "EXAMINER" ? "s" : ""} *
                  </label>
                  {createFormData.roleName === "EXAMINER" ? (
                    <>
                      <div className="admin-checkbox-grid">
                        {programs.map((program) => (
                          <label key={program.id} className="admin-checkbox-label">
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              checked={createFormData.academicProgramIds.includes(program.id)}
                              onChange={() => handleProgramCheckboxChange(program.id)}
                            />
                            <span>{program.name}</span>
                          </label>
                        ))}
                      </div>
                      <small style={{ color: "#f59e0b", marginTop: "0.5rem", display: "block" }}>
                        ⚠️ El rol EXAMINER puede asociarse a múltiples programas académicos
                      </small>
                    </>
                  ) : (
                    <>
                      <select
                        value={createFormData.academicProgramIds[0] || ""}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            academicProgramIds: e.target.value ? [parseInt(e.target.value)] : [],
                          })
                        }
                        className="admin-select"
                        required
                      >
                        <option value="">-- Selecciona un programa --</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: "#f59e0b", marginTop: "0.5rem", display: "block" }}>
                        ⚠️ Este rol requiere un programa académico
                      </small>
                    </>
                  )}
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
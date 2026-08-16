import { useEffect, useState } from "react";
import {
  getAllUsers,
  getAllAcademicPrograms,
  getAllFaculties,
  assignProgramHead,
  assignProjectDirector,
  assignCommitteeMember,
  assignExaminer,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

const ASSIGNMENT_TYPES = [
  { value: "PROGRAM_HEAD", label: "Jefe de Programa" },
  { value: "PROJECT_DIRECTOR", label: "Director de Proyecto" },
  { value: "PROGRAM_CURRICULUM_COMMITTEE", label: "Miembro de Comité" },
  { value: "EXAMINER", label: "Jurado" }

];

const ASSIGNMENT_ENDPOINTS = {
  PROGRAM_HEAD: assignProgramHead,
  PROJECT_DIRECTOR: assignProjectDirector,
  PROGRAM_CURRICULUM_COMMITTEE: assignCommitteeMember,
  EXAMINER: assignExaminer
};

export default function Assignments() {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Filtros para ver asignaciones
  const [roleFilter, setRoleFilter] = useState("PROGRAM_CURRICULUM_COMMITTEE"); // Por defecto Comité
  const [facultyFilter, setFacultyFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  // Filtros para crear asignación
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState([]);

  const [formData, setFormData] = useState({
    assignmentType: "",
    userId: "",
    academicProgramId: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedFacultyId) {
      const filtered = programs.filter(p => p.facultyId === parseInt(selectedFacultyId));
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms(programs);
    }
  }, [selectedFacultyId, programs]);

  useEffect(() => {
    fetchAssignments();
  }, [roleFilter, facultyFilter, programFilter]);

  const fetchInitialData = async () => {
    try {
      const [usersData, programsData, facultiesData] = await Promise.all([
        getAllUsers(),
        getAllAcademicPrograms(),
        getAllFaculties(),
      ]);
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
      setFaculties(Array.isArray(facultiesData) ? facultiesData : []);
      setFilteredPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (err) {
      console.error("❌ Error loading data:", err);
      setMessage("Error al cargar datos: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    if (!roleFilter) {
      setAssignedUsers([]);
      return;
    }

    setLoadingAssignments(true);
    try {
      const filters = { role: roleFilter };
      
      if (facultyFilter) filters.facultyId = parseInt(facultyFilter);
      if (programFilter) filters.programId = parseInt(programFilter);

      console.log("🔍 Fetching assignments with filters:", filters);
      
      const assignmentsData = await getAllUsers(filters);

      console.log("✅ Assignments received:", assignmentsData);

      setAssignedUsers(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (err) {
      console.error("❌ Error fetching assignments:", err);
      setAssignedUsers([]);
      
      const errorMsg = getErrorMessage(err);
      setMessage("Error al cargar asignaciones: " + errorMsg);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      assignmentType: "",
      userId: "",
      academicProgramId: "",
    });
    setSelectedFacultyId("");
    setMessage("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const assignEndpoint = ASSIGNMENT_ENDPOINTS[formData.assignmentType];
    
    if (!assignEndpoint) {
      setMessage("Tipo de asignación no válido");
      return;
    }

    try {
      await assignEndpoint({
        userId: parseInt(formData.userId),
        academicProgramId: parseInt(formData.academicProgramId),
      });
      
      const assignmentLabel = ASSIGNMENT_TYPES.find(t => t.value === formData.assignmentType)?.label;
      setMessage(`✅ ${assignmentLabel} asignado exitosamente`);
      setShowModal(false);
      
      await fetchAssignments();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error assigning user:", err);
      const errorMsg = getErrorMessage(err, "Error al asignar usuario");
      setMessage("❌ " + errorMsg);
    }
  };

  const getFullName = (user) => {
    if (!user) return "Usuario no encontrado";
    const name = user.name || "";
    const lastName = user.lastname || user.lastName || "";
    return `${name} ${lastName}`.trim() || "Sin nombre";
  };

  const getRoleLabel = (roleValue) => {
    const role = ASSIGNMENT_TYPES.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  if (loading) {
    return <div className="admin-loading">Cargando datos...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Asignaciones Especiales</h1>
          <p className="admin-page-subtitle">
            Asigna y visualiza Jefes de Programa, Directores de Proyecto y Miembros del Comité Curricular
          </p>
        </div>
        <button onClick={handleOpenModal} className="admin-btn-primary">
          ➕ Nueva Asignación
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("❌") ? "error" : "success"}`}>
          {message}
          <button 
            onClick={() => setMessage("")} 
            style={{ 
              marginLeft: "auto", 
              background: "transparent", 
              border: "none", 
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "inherit"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem", 
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#f8f9fa",
        borderRadius: "8px"
      }}>
        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-label">Tipo de Asignación *</label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setFacultyFilter("");
              setProgramFilter("");
            }}
            className="admin-select"
          >
            <option value="">-- Selecciona un tipo --</option>
            {ASSIGNMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-label">Filtrar por Facultad</label>
          <select
            value={facultyFilter}
            onChange={(e) => {
              setFacultyFilter(e.target.value);
              setProgramFilter("");
            }}
            className="admin-select"
            disabled={!roleFilter}
          >
            <option value="">-- Todas las facultades --</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-label">Filtrar por Programa</label>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="admin-select"
            disabled={!roleFilter}
          >
            <option value="">-- Todos los programas --</option>
            {programs
              .filter(p => !facultyFilter || p.facultyId === parseInt(facultyFilter))
              .map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Tabla de Asignaciones */}
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          {roleFilter ? getRoleLabel(roleFilter) + "s" : "Selecciona un tipo de asignación"}
        </h2>
        
        {!roleFilter ? (
          <div style={{ 
            textAlign: "center", 
            padding: "4rem 2rem", 
            background: "white",
            borderRadius: "8px",
            border: "2px dashed #e0e0e0"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👆</div>
            <p style={{ fontSize: "1.1rem", color: "#666", margin: 0 }}>
              Selecciona un tipo de asignación para ver los usuarios asignados
            </p>
          </div>
        ) : loadingAssignments ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            <div className="admin-loading" style={{ display: "inline-block" }}>
              Cargando asignaciones...
            </div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Programa Académico</th>
                  <th>Facultad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {assignedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
                      {facultyFilter || programFilter 
                        ? `No hay ${getRoleLabel(roleFilter).toLowerCase()}s asignados con los filtros seleccionados` 
                        : `No hay ${getRoleLabel(roleFilter).toLowerCase()}s asignados`}
                    </td>
                  </tr>
                ) : (
                  assignedUsers.map((user, idx) => (
                    <tr key={user.id || idx}>
                      <td>
                        <strong>{getFullName(user)}</strong>
                      </td>
                      <td>{user.email || "N/A"}</td>
                      <td>
                        <span className="admin-tag">
                          {user.academicProgram || "N/A"}
                        </span>
                      </td>
                      <td>{user.faculty || "N/A"}</td>
                      <td>
                        <span className={`admin-status-badge ${user.status?.toLowerCase()}`}>
                          {user.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Nueva Asignación Especial</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Tipo de Asignación *</label>
                <select
                  value={formData.assignmentType}
                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona el tipo --</option>
                  {ASSIGNMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Usuario *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona un usuario --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getFullName(user)} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Facultad (Filtro)</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => {
                    setSelectedFacultyId(e.target.value);
                    setFormData({ ...formData, academicProgramId: "" });
                  }}
                  className="admin-select"
                >
                  <option value="">-- Todas las facultades --</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Filtra los programas académicos por facultad
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Programa Académico *</label>
                <select
                  value={formData.academicProgramId}
                  onChange={(e) => setFormData({ ...formData, academicProgramId: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona un programa académico --</option>
                  {filteredPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
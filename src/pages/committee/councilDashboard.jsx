import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentsPendingModalities } from "../../services/committeeService";
import "../../styles/council/studentpending.css";

const AVAILABLE_STATUSES = [
  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Listo para comité de currículo de programa" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión - Comité de currículo de programa" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas - Comité de currículo de programa" },
  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },
  { value: "GRADED_APPROVED", label: "Calificado - Aprobado" },
  { value: "GRADED_FAILED", label: "Calificado - Reprobado" },
  { value: "CANCELLATION_REQUESTED", label: "Cancelación Solicitada" },
  { value: "CANCELLATION_REJECTED", label: "Cancelación Rechazada" },
  { value: "MODALITY_CANCELLED", label: "Modalidad Cancelada" },
  { value: "CANCELLED_WITHOUT_REPROVAL", label: "Cancelada Sin Reprobación" },
  { value: "MODALITY_CLOSED", label: "Modalidad Cerrada" },
];

export default function CommitteeDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  // Filtros
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();

  // Cargar estudiantes cuando cambien los estados
  useEffect(() => {
    fetchStudents();
  }, [selectedStatuses]);

  // Filtro local por nombre y email
  useEffect(() => {
    applyLocalFilter();
  }, [students, searchName]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudentsPendingModalities(selectedStatuses);
      console.log("✅ Estudiantes obtenidos:", res);
      setStudents(res);
      setMessage("");
    } catch (err) {
      console.error("❌ Error al obtener estudiantes:", err);
      setMessage(
        err.response?.data?.message ||
          "Error al cargar estudiantes pendientes"
      );
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilter = () => {
    let result = [...students];
    if (searchName.trim()) {
      const searchLower = searchName.toLowerCase();
      result = result.filter((s) => {
        const fullName = (s.studentName || "").toLowerCase();
        const email = (s.studentEmail || "").toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }
    setFilteredStudents(result);
  };

  // Manejar cambio de checkbox de estados
  const handleStatusToggle = (statusValue) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusValue)
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue]
    );
  };

  // Manejar búsqueda por nombre
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchName(searchInput);
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchName("");
    setSearchInput("");
  };

  // Función helper para determinar la clase del badge según el estado
  const getStatusClass = (status) => {
    switch (status) {
      case "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE":
        return "ready";
      
      case "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE":
        return "in-review";
      
      case "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE":
        return "corrections";
      
      case "PROPOSAL_APPROVED":
        return "approved";
      
      case "DEFENSE_SCHEDULED":
      case "DEFENSE_COMPLETED":
        return "defense";
      
      case "GRADED_APPROVED":
        return "graded-approved";
      
      case "GRADED_FAILED":
        return "graded-failed";
      
      case "CANCELLATION_REQUESTED":
      case "CANCELLATION_REJECTED":
        return "pending";
      
      case "MODALITY_CANCELLED":
      case "CANCELLED_WITHOUT_REPROVAL":
      case "MODALITY_CLOSED":
        return "cancelled";
      
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      "MODALITY_SELECTED": "Modalidad Seleccionada",
      "UNDER_REVIEW_PROGRAM_HEAD": "En Revisión por Jefe de Programa",
      "CORRECTIONS_REQUESTED_PROGRAM_HEAD": "Correcciones Solicitadas por Jefe",
      "CORRECTIONS_SUBMITTED": "Correcciones Enviadas",
      "CORRECTIONS_APPROVED": "Correcciones Aprobadas",
      "CORRECTIONS_REJECTED_FINAL": "Correcciones Rechazadas (Final)",
      "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE": "Pendiente Comité de Currículo",
      "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE": "En Revisión por Comité de Currículo",
      "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE": "Correcciones Solicitadas por Comité",
      "PROPOSAL_APPROVED": "Propuesta Aprobada",
      "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR": "Sustentación Propuesta por Director",
      "DEFENSE_SCHEDULED": "Sustentación Programada",
      "EXAMINERS_ASSIGNED": "Jueces Asignados",
      "READY_FOR_EXAMINERS": "Listo para Jueces",
      "CORRECTIONS_REQUESTED_EXAMINERS": "Correcciones Solicitadas por Jueces",
      "READY_FOR_DEFENSE": "Listo para Sustentación",
      "FINAL_REVIEW_COMPLETED": "Revisión Final Completada",
      "DEFENSE_COMPLETED": "Sustentación Completada",
      "UNDER_EVALUATION_PRIMARY_EXAMINERS": "En Evaluación por Jueces Principales",
      "DISAGREEMENT_REQUIRES_TIEBREAKER": "Desacuerdo - Requiere Tercer Juez",
      "UNDER_EVALUATION_TIEBREAKER": "En Evaluación por Tercer Juez",
      "EVALUATION_COMPLETED": "Evaluación Completada",
      "GRADED_APPROVED": "Aprobado",
      "GRADED_FAILED": "Reprobado",
      "MODALITY_CLOSED": "Modalidad Cerrada",
      "SEMINAR_CANCELED": "Seminario Cancelado",
      "MODALITY_CANCELLED": "Modalidad Cancelada",
      "CANCELLATION_REQUESTED": "Cancelación Solicitada",
      "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR": "Cancelación Aprobada por Director",
      "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR": "Cancelación Rechazada por Director",
      "CANCELLED_WITHOUT_REPROVAL": "Cancelada sin Calificación",
      "CANCELLATION_REJECTED": "Cancelación Rechazada",
      "CANCELLED_BY_CORRECTION_TIMEOUT": "Cancelada por Timeout de Correcciones",
    };
    return statusMap[status] || status;
  };

  if (loading && students.length === 0) {
    return (
      <div className="students-pending-loading">
        Cargando estudiantes...
      </div>
    );
  }

  return (
    <div className="students-pending-container">
      {/* Header */}
      <div className="students-pending-header">
        <h2 className="students-pending-title">
          Gestión de Modalidades - Comité de Currículo de Programa
        </h2>
        <p className="students-pending-subtitle">
          Revisa documentos, asigna directores y programa sustentaciones
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="students-pending-message error">{message}</div>
      )}

      {/* Filtros */}
      <div className="students-pending-filters">
        {/* Búsqueda por nombre */}
        <div className="filter-section">
          <label className="filter-label">Buscar por nombre o email:</label>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar estudiante..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Buscar
            </button>
          </form>
        </div>

        {/* Filtro por estados */}
        <div className="filter-section">
          <label className="filter-label">Filtrar por estado:</label>
          <div className="status-checkboxes">
            {AVAILABLE_STATUSES.map((status) => (
              <label key={status.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status.value)}
                  onChange={() => handleStatusToggle(status.value)}
                  className="checkbox-input"
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(selectedStatuses.length > 0 || searchName) && (
          <button onClick={handleClearFilters} className="clear-filters-button">
            ✕ Limpiar Filtros
          </button>
        )}
      </div>

      {/* Indicador de filtros activos */}
      {(selectedStatuses.length > 0 || searchName) && (
        <div className="active-filters">
          <strong>Filtros activos:</strong>
          {searchName && <span className="filter-tag">Nombre: "{searchName}"</span>}
          {selectedStatuses.map((status) => (
            <span key={status} className="filter-tag">
              {AVAILABLE_STATUSES.find((s) => s.value === status)?.label}
            </span>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="students-pending-empty">
          <div className="students-pending-empty-icon">
            {selectedStatuses.length > 0 || searchName ? "🔍" : "🎓"}
          </div>
          <p className="students-pending-empty-text">
            {selectedStatuses.length > 0 || searchName
              ? "No se encontraron estudiantes con estos filtros"
              : "¡No hay estudiantes pendientes!"}
          </p>
          <p className="students-pending-empty-subtext">
            {selectedStatuses.length > 0 || searchName
              ? "Intenta ajustar los criterios de búsqueda"
              : "Todas las solicitudes han sido procesadas"}
          </p>
        </div>
      ) : (
        /* Table */
        <div className="students-pending-table-container">
          <div className="results-count">
            {filteredStudents.length === students.length
              ? `Total: ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
              : `Mostrando ${filteredStudents.length} de ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
            }
          </div>
          
          <table className="students-pending-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Email</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.studentModalityId}>
                  <td data-label="Estudiante">
                    <span className="student-name">{s.studentName}</span>
                  </td>
                  <td data-label="Email">
                    <span className="student-email">{s.studentEmail}</span>
                  </td>
                  <td data-label="Modalidad">
                    <span className="modality-name">{s.modalityName}</span>
                  </td>
                  <td data-label="Estado">
                    <span
                      className={`status-badge ${getStatusClass(
                        s.currentStatus
                      )}`}
                    >
                      {getStatusLabel(s.currentStatus)}
                    </span>
                  </td>
                  <td data-label="Última Actualización">
                    <span className="last-updated">
                      {new Date(s.lastUpdatedAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      onClick={() =>
                        navigate(`/comite/students/${s.studentModalityId}`)
                      }
                      className="view-profile-button"
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
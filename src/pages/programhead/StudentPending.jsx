import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentsPendingModalities } from "../../services/programsheadService";
import "../../styles/programhead/studentpending.css";

/* =========================
   ESTADOS DISPONIBLES
   ========================= */
const AVAILABLE_STATUSES = [
  { value: "UNDER_REVIEW_PROGRAM_HEAD", label: "En Revisión por Jefe de Programa" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_HEAD", label: "Correcciones Solicitadas por Jefe" },
  { value: "CORRECTIONS_SUBMITTED", label: "Correcciones Enviadas" },
  { value: "CORRECTIONS_APPROVED", label: "Correcciones Aprobadas" },
  { value: "CORRECTIONS_REJECTED_FINAL", label: "Correcciones Rechazadas (Final)" },

  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Pendiente Comité de Currículo" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión por Comité de Currículo" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas por Comité" },

  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR", label: "Sustentación Propuesta por Director" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "EXAMINERS_ASSIGNED", label: "Jueces Asignados" },
  { value: "READY_FOR_EXAMINERS", label: "Listo para Jueces" },
  { value: "CORRECTIONS_REQUESTED_EXAMINERS", label: "Correcciones Solicitadas por Jueces" },
  { value: "READY_FOR_DEFENSE", label: "Listo para Sustentación" },
  { value: "FINAL_REVIEW_COMPLETED", label: "Revisión Final Completada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },

  { value: "UNDER_EVALUATION_PRIMARY_EXAMINERS", label: "En Evaluación por Jueces Principales" },
  { value: "DISAGREEMENT_REQUIRES_TIEBREAKER", label: "Desacuerdo - Requiere Tercer Juez" },
  { value: "UNDER_EVALUATION_TIEBREAKER", label: "En Evaluación por Tercer Juez" },
  { value: "EVALUATION_COMPLETED", label: "Evaluación Completada" },
  { value: "GRADED_APPROVED", label: "Aprobado" },
  { value: "GRADED_FAILED", label: "Reprobado" },

  { value: "CANCELLATION_REQUESTED", label: "Cancelación Solicitada" },
  { value: "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR", label: "Cancelación Aprobada por Director" },
  { value: "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR", label: "Cancelación Rechazada por Director" },
  { value: "CANCELLED_WITHOUT_REPROVAL", label: "Cancelada sin Calificación" },
  { value: "CANCELLATION_REJECTED", label: "Cancelación Rechazada" },
  { value: "CANCELLED_BY_CORRECTION_TIMEOUT", label: "Cancelada por Timeout de Correcciones" },

  { value: "MODALITY_CANCELLED", label: "Modalidad Cancelada" },
  { value: "MODALITY_CLOSED", label: "Modalidad Cerrada" },
  { value: "SEMINAR_CANCELED", label: "Seminario Cancelado" },
];

export default function StudentsPending() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  /* Filtros */
  const [selectedStatuses, setSelectedStatuses] = useState(["UNDER_REVIEW_PROGRAM_HEAD"]);
  const [searchName, setSearchName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [selectedStatuses]);

  useEffect(() => {
    applyLocalFilter();
  }, [students, searchName]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudentsPendingModalities(selectedStatuses);
      // Excluir estudiantes con estado MODALITY_SELECTED
      const filtered = res.filter(
        (student) => student.currentStatus !== "MODALITY_SELECTED"
      );
      setStudents(filtered);
      setMessage("");
    } catch (err) {
      console.error(err);
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

  /* =========================
     MANEJO DE FILTROS
     ========================= */
  const handleStatusToggle = (statusValue) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusValue)
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue]
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchName(searchInput);
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchName("");
    setSearchInput("");
  };

  /* =========================
     HELPERS DE ESTADO
     ========================= */
  const getStatusClass = (status) => {
    switch (status) {

      case "UNDER_REVIEW_PROGRAM_HEAD":
      case "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE":
        return "in-review";

      case "CORRECTIONS_REQUESTED_PROGRAM_HEAD":
      case "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE":
        return "corrections";

      case "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE":
      case "DEFENSE_SCHEDULED":
        return "ready";

      case "PROPOSAL_APPROVED":
      case "DEFENSE_COMPLETED":
      case "GRADED_APPROVED":
        return "approved";

      case "GRADED_FAILED":
        return "rejected";

      case "MODALITY_CANCELLED":
      case "MODALITY_CLOSED":
      case "CANCELLED_WITHOUT_REPROVAL":
        return "cancelled";

      case "CANCELLATION_REQUESTED":
      case "CANCELLATION_REJECTED":
        return "pending";

      default:
        return "pending";
    }
  };

  const getStatusLabel = (status) => {
    const map = Object.fromEntries(
      AVAILABLE_STATUSES.map((s) => [s.value, s.label])
    );
    return map[status] || status;
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
      {/* HEADER */}
      <div className="students-pending-header">
        <h2 className="students-pending-title">
          Estudiantes Pendientes de Revisión
        </h2>
        <p className="students-pending-subtitle">
          Gestiona las solicitudes de modalidades de grado
        </p>
      </div>

      {/* MENSAJE */}
      {message && (
        <div className="students-pending-message error">
          {message}
        </div>
      )}

      {/* FILTROS */}
      <div className="students-pending-filters">
        <div className="filter-section">
          <label className="filter-label">Buscar por nombre o email</label>
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

        <div className="filter-section">
          <label className="filter-label">Filtrar por estado</label>
          <div className="status-checkboxes">
            {AVAILABLE_STATUSES.map((status) => (
              <label key={status.value} className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={selectedStatuses.includes(status.value)}
                  onChange={() => handleStatusToggle(status.value)}
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {(selectedStatuses.length > 0 || searchName) && (
          <button
            onClick={handleClearFilters}
            className="clear-filters-button"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* FILTROS ACTIVOS */}
      {(selectedStatuses.length > 0 || searchName) && (
        <div className="active-filters">
          <strong>Filtros activos:</strong>
          {searchName && (
            <span className="filter-tag">
              Nombre: "{searchName}"
            </span>
          )}
          {selectedStatuses.map((status) => (
            <span key={status} className="filter-tag">
              {getStatusLabel(status)}
            </span>
          ))}
        </div>
      )}

      {/* EMPTY / TABLE */}
      {filteredStudents.length === 0 ? (
        <div className="students-pending-empty">
          <div className="students-pending-empty-icon">🔍</div>
          <p className="students-pending-empty-text">
            No se encontraron estudiantes
          </p>
          <p className="students-pending-empty-subtext">
            Ajusta los filtros para ver resultados
          </p>
        </div>
      ) : (
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
                <th>Última actualización</th>
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
                  <td data-label="Última actualización">
                    <span className="last-updated">
                      {new Date(s.lastUpdatedAt).toLocaleDateString("es-CO")}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      className="view-profile-button"
                      onClick={() =>
                        navigate(
                          `/jefeprograma/students/${s.studentModalityId}`
                        )
                      }
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
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
  { value: "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD", label: "Correcciones Enviadas a Jefe de Programa" },
  { value: "CORRECTIONS_SUBMITTED_TO_COMMITTEE", label: "Correcciones Enviadas a Comité" },
  { value: "CORRECTIONS_SUBMITTED_TO_EXAMINERS", label: "Correcciones Enviadas a Jurado" },
  { value: "CORRECTIONS_APPROVED", label: "Correcciones Aprobadas" },
  { value: "CORRECTIONS_REJECTED_FINAL", label: "Correcciones Rechazadas (Final)" },

  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Pendiente Comité de Currículo" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión por Comité de Currículo" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas por Comité" },

  { value: "READY_FOR_DIRECTOR_ASSIGNMENT", label: "Listo para Asignación de Director" },
  { value: "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE", label: "Listo para Aprobación por Comité de Currículo" },
  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR", label: "Sustentación Propuesta por Director" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "EXAMINERS_ASSIGNED", label: "Jurado Asignado" },
  { value: "READY_FOR_EXAMINERS", label: "Listo para Jurado" },
  { value: "DOCUMENTS_APPROVED_BY_EXAMINERS", label: "Documentos Aprobados por Jurado" },
  { value: "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS", label: "Documentos Secundarios Aprobados por Jurado" },
  { value: "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED", label: "Revisión de Documento Requiere Desempate" },
  { value: "CORRECTIONS_REQUESTED_EXAMINERS", label: "Correcciones Solicitadas por Jurado" },
  { value: "READY_FOR_DEFENSE", label: "Listo para Sustentación" },
  { value: "FINAL_REVIEW_COMPLETED", label: "Revisión Final Completada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },

  { value: "UNDER_EVALUATION_PRIMARY_EXAMINERS", label: "En Evaluación por Jurado Principal" },
  { value: "DISAGREEMENT_REQUIRES_TIEBREAKER", label: "Desacuerdo - Requiere Tercer Jurado" },
  { value: "UNDER_EVALUATION_TIEBREAKER", label: "En Evaluación por Tercer Jurado" },
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
  { value: "MODALITY_CLOSED", label: "Modalidad Cancelada" },
  { value: "SEMINAR_CANCELED", label: "Diplomado Cancelado" },
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
  // Estado temporal para el dropdown
  const [tempStatuses, setTempStatuses] = useState(selectedStatuses);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [selectedStatuses]);

  // Mantener tempStatuses sincronizado cuando cambian los filtros aplicados
  useEffect(() => {
    setTempStatuses(selectedStatuses);
  }, [selectedStatuses]);

  useEffect(() => {
    applyLocalFilter();
  }, [students, searchName, selectedStatuses]);

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
    // Filtrar por nombre/email
    if (searchName.trim()) {
      const searchLower = searchName.toLowerCase();
      result = result.filter((s) => {
        const fullName = (s.studentName || "").toLowerCase();
        const email = (s.studentEmail || "").toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }
    // Filtrar por estados seleccionados
    if (selectedStatuses.length > 0 && selectedStatuses[0] !== "") {
      result = result.filter((s) => selectedStatuses.includes(s.currentStatus));
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
    setTempStatuses([]);
  };

  /* =========================
     HELPERS DE ESTADO
     ========================= */
  const getStatusClass = (status) => {
    switch (status) {
      // Revisión inicial
      case "UNDER_REVIEW_PROGRAM_HEAD":
      case "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE":
        return "in-review";
      case "CORRECTIONS_REQUESTED_PROGRAM_HEAD":
      case "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE":
      case "CORRECTIONS_REQUESTED_EXAMINERS":
        return "corrections";
      case "CORRECTIONS_SUBMITTED":
      case "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD":
      case "CORRECTIONS_SUBMITTED_TO_COMMITTEE":
      case "CORRECTIONS_SUBMITTED_TO_EXAMINERS":
        return "submitted";
      case "CORRECTIONS_APPROVED":
        return "approved";
      case "CORRECTIONS_REJECTED_FINAL":
        return "rejected";

      // Comité
      case "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE":
      case "READY_FOR_DIRECTOR_ASSIGNMENT":
      case "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE":
        return "ready";
      case "PROPOSAL_APPROVED":
        return "approved";

      // Sustentación
      case "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR":
        return "pending";
      case "DEFENSE_SCHEDULED":
        return "scheduled";
      case "DEFENSE_COMPLETED":
        return "completed";

      // Jurado
      case "EXAMINERS_ASSIGNED":
      case "READY_FOR_EXAMINERS":
        return "in-review";
      case "DOCUMENTS_APPROVED_BY_EXAMINERS":
      case "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS":
        return "completed";
      case "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED":
        return "warning";
      case "READY_FOR_DEFENSE":
        return "ready";
      case "FINAL_REVIEW_COMPLETED":
        return "completed";

      // Evaluación
      case "UNDER_EVALUATION_PRIMARY_EXAMINERS":
      case "UNDER_EVALUATION_TIEBREAKER":
        return "in-review";
      case "DISAGREEMENT_REQUIRES_TIEBREAKER":
        return "warning";
      case "EVALUATION_COMPLETED":
        return "completed";

      // Resultado final
      case "GRADED_APPROVED":
        return "approved";
      case "GRADED_FAILED":
        return "rejected";
      case "MODALITY_CLOSED":
        return "closed";
      case "SEMINAR_CANCELED":
        return "cancelled";

      // Cancelaciones
      case "MODALITY_CANCELLED":
      case "CANCELLED_WITHOUT_REPROVAL":
      case "CANCELLED_BY_CORRECTION_TIMEOUT":
        return "cancelled";
      case "CANCELLATION_REQUESTED":
        return "pending";
      case "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR":
        return "approved";
      case "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR":
      case "CANCELLATION_REJECTED":
        return "rejected";

      // Selección inicial (no se muestra, pero por completitud)
      case "MODALITY_SELECTED":
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
      <header className="students-pending-header enhanced-header">
        <div className="header-content">
          <div>
            <h2 className="students-pending-title enhanced-title">
              Gestión de Estudiantes
            </h2>
            <p className="students-pending-subtitle enhanced-subtitle">
              Administra y realiza seguimiento a las solicitudes de modalidades de grado, revisando su estado, documentación asociada y decisiones académicas correspondientes.
            </p>
          </div>
        </div>
      </header>

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
          <select
            className="status-dropdown"
            multiple
            value={tempStatuses}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions);
              const values = options.map(opt => opt.value);
              setTempStatuses(values);
            }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid #D5CBA0",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 700,
              color:  "#5d0d12",
              background: "#f8f6ef",
              marginTop: "0.5rem",
              minHeight: "3rem"
            }}
          >
            <option value="">Todos los estados</option>
            {AVAILABLE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <small style={{color:'#5d0d12',fontWeight:500,marginTop:'0.25rem',display:'block'}}>Mantén Ctrl (Windows) o Cmd (Mac) para seleccionar varios</small>
          <button
            type="button"
            className="apply-statuses-button"
            style={{
              marginTop: '0.5rem',
              background: '#5d0d12',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.2rem',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => setSelectedStatuses(tempStatuses)}
          >
            Aplicar estados
          </button>
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
        <div className="students-pending-empty fade-in">
          <div className="students-pending-empty-icon large-gold mb-1">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#f8f6ef"/>
              <path d="M44 40l-6-6" stroke="#7A1117" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="10" stroke="#7A1117" strokeWidth="3" fill="#fff"/>
            </svg>
          </div>
          <p className="students-pending-empty-text large-strong mb-half">
            No se encontraron estudiantes
          </p>
          <p className="students-pending-empty-subtext gold-strong mb-12">
            Ajusta los filtros para ver resultados o recarga la página.
          </p>
          <button
            className="search-button reload-btn mt-half"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      ) : (
        <div className="students-pending-table-container fade-in">
          <div className="results-count mb-15 strong-gold">
            {filteredStudents.length === students.length
              ? `Total: ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
              : `Mostrando ${filteredStudents.length} de ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
            }
          </div>

          <table className="students-pending-table rounded-shadow">
            <thead>
              <tr className="thead-gradient">
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
                <tr key={s.studentModalityId} className="student-row">
                  <td data-label="Estudiante">
                    <span className="student-name strong-gold large-strong">{s.studentName}</span>
                  </td>
                  <td data-label="Email">
                    <span className="student-email small-gray">{s.studentEmail}</span>
                  </td>
                  <td data-label="Modalidad">
                    <span className="modality-name">{s.modalityName}</span>
                  </td>
                  <td data-label="Estado">
                    <span
                      className={`status-badge ${getStatusClass(s.currentStatus)} badge-shadow`}
                    >
                      {getStatusLabel(s.currentStatus)}
                    </span>
                  </td>
                  <td data-label="Última actualización">
                    <span className="last-updated small-gray">
                      {new Date(s.lastUpdatedAt).toLocaleDateString("es-CO")}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      className="view-profile-button profile-btn"
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
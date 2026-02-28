import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getMyExaminerAssignments, 
  getStatusLabel, 
  getStatusBadgeClass, 
  formatDate,
  EXAMINER_MODALITY_STATUS 
} from "../../services/examinerService";
import "../../styles/examiners/examinerdashboard.css";

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    statuses: [],
    name: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async (customFilters = null) => {
    try {
      setLoading(true);
      const params = customFilters || filters;
      
      const cleanParams = {};
      if (params.statuses && params.statuses.length > 0) {
        cleanParams.statuses = params.statuses;
      }
      if (params.name && params.name.trim()) {
        cleanParams.name = params.name.trim();
      }
      
      const data = await getMyExaminerAssignments(cleanParams);
      console.log("📋 Asignaciones:", data);
      setAssignments(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar tus asignaciones como jurado");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchAssignments();
  };

  const handleClearFilters = () => {
    const emptyFilters = { statuses: [], name: "" };
    setFilters(emptyFilters);
    fetchAssignments(emptyFilters);
  };

  const handleStatusToggle = (status) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const getActionButtonClass = (status, hasEvaluated) => {
    if (hasEvaluated) return "completed";
    if (status === "READY_FOR_DEFENSE" || status === "DEFENSE_COMPLETED" || 
        status === "UNDER_EVALUATION_PRIMARY_EXAMINERS" || 
        status === "UNDER_EVALUATION_TIEBREAKER" ||
        status === "DISAGREEMENT_REQUIRES_TIEBREAKER") {
      return "evaluate";
    }
    if (status === "EXAMINERS_ASSIGNED") return "review";
    return "view";
  };

  const getActionButtonText = (status, hasEvaluated) => {
    if (hasEvaluated) return "✅ Ver Mi Evaluación";
    if (status === "READY_FOR_DEFENSE" || status === "DEFENSE_COMPLETED" || 
        status === "UNDER_EVALUATION_PRIMARY_EXAMINERS" || 
        status === "UNDER_EVALUATION_TIEBREAKER" ||
        status === "DISAGREEMENT_REQUIRES_TIEBREAKER") {
      return " Evaluar Sustentación";
    }
    if (status === "EXAMINERS_ASSIGNED") return "Revisar Documentos";
    return "Ver Detalles";
  };

  if (loading) {
    return (
      <div className="examiner-dashboard-container">
        <div className="examiner-loading">
          Cargando tus asignaciones como jurado...
        </div>
      </div>
    );
  }

  return (
    <div className="examiner-dashboard-container">
      {/* Header */}
      <div className="examiner-header">
        <h1 className="examiner-title">Mis Asignaciones</h1>
        <p className="examiner-subtitle">
          Modalidades de grado en las que participas como evaluador, con información detallada sobre fechas, estudiantes asignados y estado de cada sustentación.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="examiner-message error">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="examiner-toolbar">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="examiner-btn examiner-btn-primary"
        >
          {showFilters ? "🔽 Ocultar Filtros" : " Mostrar Filtros"}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="examiner-filter-panel">
          <h3 className="examiner-filter-title"> Filtros de Búsqueda</h3>
          
          <div className="examiner-filter-group">
            <label className="examiner-filter-label">
              Buscar por nombre del estudiante
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className="examiner-input"
            />
          </div>

          <div className="examiner-filter-group">
            <label className="examiner-filter-label" htmlFor="status-select">Filtrar por estado</label>
            <select
              id="status-select"
              className="examiner-input examiner-multiselect"
              multiple
              value={filters.statuses}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, statuses: selected }));
              }}
              style={{ minHeight: '120px', fontSize: '1rem', background: '#fff', border: '2px solid #B7A873', color: '#5d0d12', fontWeight: 600 }}
            >
              {Object.entries(EXAMINER_MODALITY_STATUS).map(([key, value]) => (
                <option key={key} value={value} style={{ color: '#5d0d12', fontWeight: 600 }}>
                  {getStatusLabel(value)}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.95rem', color: '#7A1117', marginTop: '4px', fontWeight: 500 }}>
              Mantén presionada <b>Ctrl</b> para seleccionar múltiples estados (Windows)
            </div>
          </div>

          <div className="examiner-filter-actions">
            <button
              onClick={handleApplyFilters}
              className="examiner-btn examiner-btn-primary"
              style={{ flex: 1 }}
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="examiner-btn examiner-btn-secondary"
              style={{ flex: 1 }}
            >
              Limpiar Filtros
            </button>
          </div>

          {(filters.statuses.length > 0 || filters.name.trim()) && (
            <div className="examiner-filter-info">
              <strong>Filtros activos:</strong>
              {filters.name.trim() && ` Nombre: "${filters.name}"`}
              {filters.statuses.length > 0 && ` | Estados: ${filters.statuses.length} seleccionado(s)`}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {assignments.length > 0 && (
        <div className="examiner-stats-card">
          <div className="examiner-stats-content">
            <div className="examiner-stats-number">{assignments.length}</div>
            <div className="examiner-stats-text">
              {assignments.length === 1 ? "Asignación Encontrada" : "Asignaciones Encontradas"}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {assignments.length === 0 ? (
        <div className="examiner-empty">
          <div className="examiner-empty-icon">📭</div>
          <h3 className="examiner-empty-title">
            {filters.statuses.length > 0 || filters.name.trim() 
              ? "No se encontraron asignaciones con los filtros aplicados" 
              : "No tienes asignaciones pendientes"}
          </h3>
          <p className="examiner-empty-text">
            {filters.statuses.length > 0 || filters.name.trim()
              ? "Intenta ajustar los filtros de búsqueda"
              : "Cuando el comité te asigne como jurado de una sustentación, aparecerá aquí."}
          </p>
          {(filters.statuses.length > 0 || filters.name.trim()) && (
            <button
              onClick={handleClearFilters}
              className="examiner-btn examiner-btn-secondary"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="examiner-table-container">
          <table className="examiner-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.studentModalityId}>
                  <td>
                    <div className="examiner-student-name">{assignment.studentName}</div>
                    <div className="examiner-student-email">{assignment.studentEmail}</div>
                  </td>
                  <td>
                    <span className="examiner-modality">{assignment.modalityName}</span>
                  </td>
                  <td>
                    <span className={`examiner-status-badge ${getStatusBadgeClass(assignment.currentStatus)}`}>
                      {getStatusLabel(assignment.currentStatus)}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.95rem", color: "#666" }}>
                    {formatDate(assignment.lastUpdatedAt)}
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/examiner/student/${assignment.studentModalityId}`)}
                      className={`examiner-action-btn ${getActionButtonClass(assignment.currentStatus, assignment.hasEvaluated)}`}
                    >
                      {getActionButtonText(assignment.currentStatus, assignment.hasEvaluated)}
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
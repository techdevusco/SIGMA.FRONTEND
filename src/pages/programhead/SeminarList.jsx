import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listSeminars,
  getSeminarStatusLabel,
  getSeminarStatusClass,
  formatCurrency,
  formatDate,
} from "../../services/programsheadService";
import "../../styles/programhead/seminarlist.css";

export default function SeminarList() {
  const navigate = useNavigate();
  
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    active: ""
  });

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await listSeminars(customFilters);
      
      if (response.success) {
        setSeminars(response.seminars || []);
      } else {
        setError(response.error || "Error al cargar seminarios");
        setSeminars([]);
      }
    } catch (err) {
      console.error("❌ Error al cargar seminarios:", err);
      const errorMsg = err.response?.data?.error || "Error al cargar los seminarios";
      setError(errorMsg);
      setSeminars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);
    
    // Convertir filtros para la API
    const apiFilters = {};
    if (newFilters.status) apiFilters.status = newFilters.status;
    if (newFilters.active !== "") apiFilters.active = newFilters.active === "true";
    
    fetchSeminars(apiFilters);
  };

  const handleClearFilters = () => {
    setFilters({ status: "", active: "" });
    fetchSeminars({});
  };

  const handleViewDetail = (seminarId) => {
    navigate(`/jefeprograma/seminars/${seminarId}`);
  };

  const handleCreateSeminar = () => {
    navigate("/jefeprograma/seminars/create");
  };

  if (loading) {
    return (
      <div className="seminar-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando seminarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seminar-list-container">
      {/* Header */}
      <div className="seminar-list-header">
        <div>
          <h1 className="seminar-list-title">Gestión de Seminarios</h1>
          <p className="seminar-list-subtitle">Administra, organiza y supervisa los seminarios académicos y sus participantes.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleCreateSeminar}
        >
          ➕ Crear Nuevo Seminario
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="seminar-filters-section">
        <div className="seminar-filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Estado:</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="form-control"
            >
              <option value="">Todos los estados</option>
              <option value="OPEN">Abierto</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completado</option>
              <option value="CLOSED">Cancelado</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="active-filter">Estado:</label>
            <select
              id="active-filter"
              value={filters.active}
              onChange={(e) => handleFilterChange("active", e.target.value)}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={handleClearFilters}
          >
            🔄 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      {seminars.length > 0 && (
        <div className="seminar-stats">
          <div className="stat-card total">
            <div className="stat-number">{seminars.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card success">
            <div className="stat-number">
              {seminars.filter(s => s.status === "OPEN").length}
            </div>
            <div className="stat-label">Abiertos</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">
              {seminars.filter(s => s.status === "IN_PROGRESS").length}
            </div>
            <div className="stat-label">En Progreso</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">
              {seminars.filter(s => s.status === "COMPLETED").length}
            </div>
            <div className="stat-label">Completados</div>
          </div>
        </div>
      )}

      {/* Lista de seminarios */}
      {seminars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No hay seminarios creados</h3>
          <p>Comienza creando tu primer seminario</p>
          <button className="btn btn-primary" onClick={handleCreateSeminar}>
            ➕ Crear Seminario
          </button>
        </div>
      ) : (
        <div className="seminars-grid">
          {seminars.map((seminar) => (
            <div key={seminar.id} className="seminar-card">
              <div className="seminar-card-header">
                <div>
                  <h3 className="seminar-card-title">{seminar.name}</h3>
                  {seminar.description && (
                    <p className="seminar-card-description">{seminar.description}</p>
                  )}
                </div>
                <span className={`badge badge-${getSeminarStatusClass(seminar.status)}`}>
                  {getSeminarStatusLabel(seminar.status)}
                </span>
              </div>

              <div className="seminar-card-body">
                <div className="seminar-info-grid">
                  <div className="info-item">
                    <span className="info-label">💰</span>
                    <span className="info-value">{formatCurrency(seminar.totalCost)}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">👥</span>
                    <span className="info-value">
                      {seminar.currentParticipants} / {seminar.maxParticipants}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">⏱️</span>
                    <span className="info-value">{seminar.totalHours}h</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">📊</span>
                    <span className="info-value">{seminar.fillPercentage.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min(seminar.fillPercentage, 100)}%` }}
                  />
                </div>

                {/* Indicadores */}
                <div className="seminar-indicators">
                  {seminar.hasMinimumParticipants && (
                    <span className="indicator success">✓ Mínimo alcanzado</span>
                  )}
                  {!seminar.hasMinimumParticipants && seminar.status === "OPEN" && (
                    <span className="indicator warning">
                      Faltan {seminar.minParticipants - seminar.currentParticipants}
                    </span>
                  )}
                  {seminar.isFull && (
                    <span className="indicator info">Cupo lleno</span>
                  )}
                </div>
              </div>

              <div className="seminar-card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleViewDetail(seminar.id)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
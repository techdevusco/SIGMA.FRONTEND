import { useEffect, useState } from "react";
import {
  getAllAcademicPrograms,
  getModalitiesAdmin,
  getProgramDegreeModalities,
  createProgramDegreeModality,
  updateProgramDegreeModality,
} from "../../services/adminService";
import "../../styles/admin/Roles.css";

export default function ProgramDegreeModalities() {
  const [programs, setPrograms] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  // Filtro
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [formData, setFormData] = useState({
    academicProgramId: "",
    degreeModalityId: "",
    creditsRequired: 0,
    requiresDefenseProcess: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [selectedProgramId]);

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.response?.data) {
      if (typeof error.response.data === 'string') return error.response.data;
      if (error.response.data.message) return error.response.data.message;
      return JSON.stringify(error.response.data);
    }
    if (error?.message) return error.message;
    return 'Error desconocido';
  };

  const fetchInitialData = async () => {
    try {
      console.log("Fetching initial data...");
      
      const [programsData, modalitiesData] = await Promise.all([
        getAllAcademicPrograms(),
        getModalitiesAdmin("ACTIVE"),
      ]);
      
      console.log("Programs:", programsData);
      console.log("Modalities:", modalitiesData);
      
      setPrograms(Array.isArray(programsData) ? programsData : []);
      setModalities(Array.isArray(modalitiesData) ? modalitiesData : []);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      const errorMsg = getErrorMessage(err);
      setMessage("Error al cargar datos: " + errorMsg);
      setPrograms([]);
      setModalities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const filters = {};
      if (selectedProgramId) filters.academicProgramId = selectedProgramId;
      
      console.log("Fetching configurations with filters:", filters);
      const data = await getProgramDegreeModalities(filters);
      console.log("Configurations received:", data);
      
      setConfigurations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar configuraciones:", err);
      setConfigurations([]);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      // Modo edición
      setEditingConfig(config);
      setFormData({
        academicProgramId: config.academicProgramId.toString(),
        degreeModalityId: config.degreeModalityId.toString(),
        creditsRequired: config.creditsRequired,
        requiresDefenseProcess: config.requiresDefenseProcess ?? config.requiresDefense ?? config.defenseProcess ?? true,
      });
    } else {
      // Modo creación
      setEditingConfig(null);
      setFormData({
        academicProgramId: selectedProgramId || "",
        degreeModalityId: "",
        creditsRequired: 0,
        requiresDefenseProcess: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        academicProgramId: parseInt(formData.academicProgramId),
        degreeModalityId: parseInt(formData.degreeModalityId),
        creditsRequired: parseInt(formData.creditsRequired),
        requiresDefenseProcess: formData.requiresDefenseProcess,
      };

      if (editingConfig) {
        // Actualizar configuración existente
        await updateProgramDegreeModality(editingConfig.id, payload);
        setMessage("Configuración actualizada exitosamente");
      } else {
        // Crear nueva configuración
        await createProgramDegreeModality(payload);
        setMessage("Configuración creada exitosamente");
      }
      
      setShowModal(false);
      setEditingConfig(null);
      fetchConfigurations();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error al guardar configuración:", err);
      const errorMsg = getErrorMessage(err);
      setMessage("Error: " + errorMsg);
    }
  };

  const getProgramName = (config) => config.academicProgramName || "Programa no encontrado";
  const getModalityName = (config) => config.degreeModalityName || "Modalidad no encontrada";

  if (loading) {
    return <div className="admin-loading">Cargando configuraciones...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Configuración de Créditos por Programa</h1>
          <p className="admin-page-subtitle">Asocia modalidades a programas y define créditos requeridos</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-primary">
          ➕ Nueva Configuración
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      {/* Debug Info */}
      {(programs.length === 0 || modalities.length === 0) && (
        <div style={{ 
          background: "#fff3cd", 
          border: "1px solid #ffc107",
          padding: "1rem", 
          borderRadius: "4px",
          marginBottom: "1rem"
        }}>
          <strong>⚠️ Atención:</strong>
          <ul style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            {programs.length === 0 && <li>No se cargaron programas académicos</li>}
            {modalities.length === 0 && <li>No se cargaron modalidades activas</li>}
          </ul>
          <p style={{ marginTop: "0.5rem", marginBottom: 0, fontSize: "0.9rem" }}>
            Verifica la consola del navegador (F12) para más detalles.
          </p>
        </div>
      )}

      {/* Filtro */}
      <div className="admin-filters" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <div className="admin-form-group" style={{ flex: 1 }}>
          <label className="admin-label">Filtrar por Programa</label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="admin-select"
          >
            <option value="">-- Todos los programas --</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de configuraciones */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Programa Académico</th>
              <th>Modalidad de Grado</th>
              <th>Créditos Requeridos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {configurations.length === 0 ? (
              <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                  No hay configuraciones disponibles. ¡Crea una nueva!
                </td>
              </tr>
            ) : (
              configurations.map((config) => (
                <tr key={config.id}>
                  <td>
                    <strong>{getProgramName(config)}</strong>
                  </td>
                  <td>{getModalityName(config)}</td>
                  <td>
                    <span className="admin-tag">{config.creditsRequired} créditos</span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${config.active ? "active" : "inactive"}`}>
                      {config.active ? "ACTIVA" : "INACTIVA"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenModal(config)}
                      className="admin-btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                      title="Editar configuración"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingConfig ? "Editar Configuración de Créditos" : "Nueva Configuración de Créditos"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Programa Académico *</label>
                <select
                  value={formData.academicProgramId}
                  onChange={(e) => setFormData({ ...formData, academicProgramId: e.target.value })}
                  className="admin-select"
                  required
                  disabled={!!editingConfig}
                >
                  <option value="">-- Selecciona un programa --</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {editingConfig && (
                  <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                    No se puede cambiar el programa en una configuración existente
                  </small>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Modalidad de Grado *</label>
                <select
                  value={formData.degreeModalityId}
                  onChange={(e) => setFormData({ ...formData, degreeModalityId: e.target.value })}
                  className="admin-select"
                  required
                  disabled={!!editingConfig}
                >
                  <option value="">-- Selecciona una modalidad --</option>
                  {modalities.map((modality) => (
                    <option key={modality.id} value={modality.id}>
                      {modality.name}
                    </option>
                  ))}
                </select>
                {editingConfig && (
                  <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                    No se puede cambiar la modalidad en una configuración existente
                  </small>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Créditos Requeridos *</label>
                <input
                  type="number"
                  value={formData.creditsRequired}
                  onChange={(e) => setFormData({ ...formData, creditsRequired: e.target.value })}
                  className="admin-input"
                  min="0"
                  placeholder="Ej: 152"
                  required
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Número de créditos que el estudiante debe tener aprobados para esta modalidad
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">¿Requiere proceso de defensa? *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer",
                    padding: "0.85rem 1rem", borderRadius: "8px", border: "2px solid",
                    borderColor: formData.requiresDefenseProcess ? "#7A1117" : "#e0e0e0",
                    background: formData.requiresDefenseProcess ? "#fdf2f3" : "#f9f9f9",
                  }}>
                    <input
                      type="radio"
                      name="requiresDefenseProcess"
                      checked={formData.requiresDefenseProcess === true}
                      onChange={() => setFormData({ ...formData, requiresDefenseProcess: true })}
                      style={{ marginTop: "3px", accentColor: "#7A1117" }}
                    />
                    <div>
                      <strong>Sí — Con proceso de defensa completo</strong>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#555" }}>
                        La modalidad incluye director de proyecto, jurados, sustentación y evaluación. Aplica para trabajos de grado tradicionales (proyecto de investigación, trabajo de grado, etc.).
                      </p>
                    </div>
                  </label>
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer",
                    padding: "0.85rem 1rem", borderRadius: "8px", border: "2px solid",
                    borderColor: formData.requiresDefenseProcess === false ? "#7A1117" : "#e0e0e0",
                    background: formData.requiresDefenseProcess === false ? "#fdf2f3" : "#f9f9f9",
                  }}>
                    <input
                      type="radio"
                      name="requiresDefenseProcess"
                      checked={formData.requiresDefenseProcess === false}
                      onChange={() => setFormData({ ...formData, requiresDefenseProcess: false })}
                      style={{ marginTop: "3px", accentColor: "#7A1117" }}
                    />
                    <div>
                      <strong>No — Solo aprobación por comité</strong>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#555" }}>
                        La modalidad no requiere director ni jurados. El comité curricular evalúa y aprueba directamente (posgrado, artículo académico, homologación, etc.).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingConfig ? "Actualizar Configuración" : "Crear Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

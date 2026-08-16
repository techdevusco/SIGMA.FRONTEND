import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getModalitiesAdmin, 
  createModality, 
  updateModality,
  getAllFaculties 
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

const MODALITY_TYPES = [
  "Degree_Project",
  "Supervised_Internship",
  "Professional_Practice",
  "Complementary_Plan_Within_A_Graduate_Program",
  "Entrepreneurship",
  "Degree_Seminar",
  "Project_Portafolio",
  "Research_Incubator",
  "Higher_Level_Academic_Production",
  "Others",
];

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];

export default function Modalities() {
  const navigate = useNavigate();
  const [modalities, setModalities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingModality, setEditingModality] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    facultyId: "",
    name: "",
    description: "",
    type: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter]);

  const fetchInitialData = async () => {
    try {
      const [modalitiesData, facultiesData] = await Promise.all([
        getModalitiesAdmin(statusFilter || null),
        getAllFaculties()
      ]);
      
      console.log("Modalities data:", modalitiesData);
      console.log("Faculties data:", facultiesData);
      
      setModalities(Array.isArray(modalitiesData) ? modalitiesData : []);
      setFaculties(Array.isArray(facultiesData) ? facultiesData : []);
    } catch (err) {
      console.error("Error loading data:", err);
      setMessage("Error al cargar datos: " + getErrorMessage(err));
      setModalities([]);
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingModality(null);
    setFormData({
      facultyId: "",
      name: "",
      description: "",
      type: "",
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (modality) => {
    setEditingModality(modality);
    setFormData({
      facultyId: modality.facultyId || "",
      name: modality.name,
      description: modality.description,
      type: modality.type,
      status: modality.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingModality) {
        await updateModality(editingModality.id, formData);
        setMessage("Modalidad actualizada exitosamente");
      } else {
        await createModality(formData);
        setMessage("Modalidad creada exitosamente");
      }
      setShowModal(false);
      fetchInitialData();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving modality:", err);
      setMessage(getErrorMessage(err, "Error al procesar la solicitud"));
    }
  };

  const handleToggleStatus = async (modalityId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const modality = modalities.find(m => m.id === modalityId);
    
    try {
      await updateModality(modalityId, { ...modality, status: newStatus });
      setMessage(`Modalidad ${newStatus === "ACTIVE" ? "activada" : "desactivada"} exitosamente`);
      fetchInitialData();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error toggling status:", err);
      setMessage("Error al cambiar estado: " + getErrorMessage(err));
    }
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : "Sin facultad";
  };

  if (loading) {
    return <div className="admin-loading">Cargando modalidades...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Modalidades</h1>
          <p className="admin-page-subtitle">Administra las modalidades de grado por facultad</p>
        </div>
        <button onClick={handleOpenCreate} className="admin-btn-primary">
          ➕ Crear Modalidad
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      {/* Filtro por estado */}
      <div className="filter-section" style={{ marginBottom: "2rem" }}>
        <label style={{ fontWeight: 600, marginRight: "1rem" }}>Filtrar por estado:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
          style={{ maxWidth: "200px" }}
        >
          <option value="">Todas</option>
          <option value="ACTIVE">Activas</option>
          <option value="INACTIVE">Inactivas</option>
        </select>
      </div>

      <div className="admin-cards-grid">
        {modalities.length > 0 ? (
          modalities.map((modality) => (
            <div key={modality.id} className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">{modality.name}</h3>
                <span className={`admin-status-badge ${modality.status?.toLowerCase()}`}>
                  {modality.status}
                </span>
              </div>
              
              <div className="admin-card-body">
                {/* Descripción */}
                <div className="admin-card-info">
                  <p>{modality.description}</p>
                </div>

                {/* Metadata */}
                <div className="admin-card-meta">
                  <div className="admin-card-meta-item">
                    <strong>Facultad:</strong>
                    <span className="admin-tag">{getFacultyName(modality.facultyId)}</span>
                  </div>
                </div>

                {/* Acciones - Grid 2x2 */}
                <div className="admin-card-actions four-buttons">
                  <button onClick={() => handleOpenEdit(modality)} className="admin-btn-edit">
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(modality.id, modality.status)}
                    className={modality.status === "ACTIVE" ? "admin-btn-delete" : "admin-btn-edit"}
                  >
                    {modality.status === "ACTIVE" ? "🚫 Desactivar" : "✅ Activar"}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/requirements?modalityId=${modality.id}`)}
                    className="admin-btn-action"
                  >
                    📋 Requerimientos
                  </button>
                  <button
                    onClick={() => navigate(`/admin/documents?modalityId=${modality.id}`)}
                    className="admin-btn-action"
                  >
                    📄 Documentos
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "#999", gridColumn: "1 / -1" }}>
            {statusFilter 
              ? `No hay modalidades con estado ${statusFilter}` 
              : "No hay modalidades registradas. ¡Crea la primera!"}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingModality ? "Editar Modalidad" : "Crear Nueva Modalidad"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Facultad *</label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona una facultad --</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-textarea"
                  required
                />
              </div>

              {editingModality && (
                <div className="admin-form-group">
                  <label className="admin-label">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="admin-select"
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingModality ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
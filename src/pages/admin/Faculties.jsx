import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllFaculties,
  createFaculty,
  updateFaculty,
  deactivateFaculty,
} from "../../services/adminService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/admin/Roles.css";

export default function Faculties() {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const data = await getAllFaculties();
      console.log("Faculties data received:", data); // Debug
      
      // Asegurarse de que data sea un array
      if (Array.isArray(data)) {
        setFaculties(data);
      } else {
        console.error("Expected array but got:", typeof data, data);
        setFaculties([]);
        setMessage("Formato de datos incorrecto recibido del servidor");
      }
    } catch (err) {
      console.error("Error fetching faculties:", err);
      setMessage("Error al cargar facultades: " + (err.response?.data || err.message));
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setFormData({
      name: "",
      description: "",
      code: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      description: faculty.description,
      code: faculty.code,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, formData);
        setMessage("Facultad actualizada exitosamente");
      } else {
        await createFaculty(formData);
        setMessage("Facultad creada exitosamente");
      }
      setShowModal(false);
      fetchFaculties();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving faculty:", err);
      setMessage(err.response?.data || "Error al procesar la solicitud");
    }
  };

  const handleDeactivate = (facultyId) => {
    setConfirmDeactivateId(facultyId);
  };

  const executeDeactivate = async () => {
    const fId = confirmDeactivateId;
    setConfirmDeactivateId(null);
    try {
      await deactivateFaculty(fId);
      setMessage("Facultad desactivada exitosamente");
      fetchFaculties();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error deactivating faculty:", err);
      setMessage("Error al desactivar facultad: " + (err.response?.data || err.message));
    }
  };

  if (loading) {
    return <div className="admin-loading">Cargando facultades...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Facultades</h1>
          <p className="admin-page-subtitle">Administra las facultades de la universidad</p>
        </div>
        <button onClick={handleOpenCreate} className="admin-btn-primary">
          ➕ Crear Facultad
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      <div className="admin-cards-grid">
        {faculties.length > 0 ? (
          faculties.map((faculty) => (
            <div key={faculty.id} className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">{faculty.name}</h3>
                <span className={`admin-status-badge ${faculty.active ? "active" : "inactive"}`}>
                  {faculty.active ? "ACTIVA" : "INACTIVA"}
                </span>
              </div>
              
              <div className="admin-card-body">
                {/* Descripción */}
                <div className="admin-card-info">
                  <p>{faculty.description}</p>
                </div>

                {/* Metadata */}
                <div className="admin-card-meta">
                  <div className="admin-card-meta-item">
                    <strong>Código:</strong>
                    <span className="admin-tag">{faculty.code}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="admin-card-actions">
                  <button onClick={() => handleOpenEdit(faculty)} className="admin-btn-edit">
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => navigate(`/admin/programs?facultyId=${faculty.id}`)}
                    className="admin-btn-action"
                  >
                    📚 Ver Programas
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "#999", gridColumn: "1 / -1" }}>
            No hay facultades registradas. ¡Crea la primera!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingFaculty ? "Editar Facultad" : "Crear Nueva Facultad"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: Facultad de Ingeniería"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-textarea"
                  placeholder="Describe la facultad..."
                  rows="4"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="admin-input"
                  placeholder="Ej: FACULTAD_INGENIERIA"
                  required
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Usa el formato: FACULTAD_NOMBRE (se convertirá a mayúsculas)
                </small>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingFaculty ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeactivateId}
        title="Desactivar Facultad"
        message="¿Estás seguro de desactivar esta facultad?"
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDeactivate}
        onCancel={() => setConfirmDeactivateId(null)}
      />
    </div>
  );
}
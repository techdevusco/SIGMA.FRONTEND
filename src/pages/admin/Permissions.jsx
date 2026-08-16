import { useEffect, useState } from "react";
import { getAllPermissions, createPermission } from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    fetchPermissions();
  }, []);

 const fetchPermissions = async () => {
  try {
    const data = await getAllPermissions();
    data.sort((a, b) => a.id - b.id); // 👈 orden numérico ascendente
    setPermissions(data);
  } catch (err) {
    setMessage("Error al cargar permisos");
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPermission(formData);
      setMessage("Permiso creado exitosamente");
      setShowModal(false);
      setFormData({ name: "" });
      fetchPermissions();
    } catch (err) {
      setMessage(getErrorMessage(err, "Error al crear permiso"));
    }
  };

  if (loading) {
    return <div className="admin-loading">Cargando permisos...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Permisos</h1>
          <p className="admin-page-subtitle">Administra los permisos del sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn-primary">
          ➕ Crear Permiso
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Permiso</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td>{perm.id}</td>
                <td>
                  <strong>{perm.name}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Crear Nuevo Permiso</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Nombre del Permiso</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: PERM_CREATE_USER"
                  required
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Usa el formato: PERM_ACCION_RECURSO (ej: PERM_CREATE_MODALITY)
                </small>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
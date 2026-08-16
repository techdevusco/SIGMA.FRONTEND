import { useEffect, useState } from "react";
import { getAllRoles, createRole, updateRole, getAllPermissions } from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    permissionIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        getAllRoles(),
        getAllPermissions(),
      ]);
      
      console.log("Roles recibidos:", rolesData); // DEBUG
      console.log("Permisos recibidos:", permsData); // DEBUG
      
      // Enriquecer roles con nombres de permisos
      const enrichedRoles = rolesData.map((role, index) => ({
        ...role,
        id: index + 1, // Generar ID temporal (SOLUCIÓN TEMPORAL)
        permissionNames: role.permissionIds?.map(permId => {
          const perm = permsData.find(p => p.id === permId);
          return perm ? perm.name : 'Permiso desconocido';
        }) || []
      }));
      
      setRoles(enrichedRoles);
      setPermissions(permsData);
    } catch (err) {
      console.error("Error al cargar datos:", err); // DEBUG
      setMessage("Error al cargar datos: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: "", permissionIds: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissionIds: role.permissionIds || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        // ⚠️ PROBLEMA: No hay ID del rol desde el backend
        // Por ahora buscaremos por nombre
        await updateRole(editingRole.id, formData);
        setMessage("Rol actualizado exitosamente");
      } else {
        await createRole(formData);
        setMessage("Rol creado exitosamente");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Error al guardar:", err); // DEBUG
      setMessage(getErrorMessage(err, "Error al procesar la solicitud"));
    }
  };

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  if (loading) {
    return <div className="admin-loading">Cargando roles...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Roles</h1>
          <p className="admin-page-subtitle">Administra roles y permisos del sistema</p>
        </div>
        <button onClick={handleOpenCreate} className="admin-btn-primary">
          ➕ Crear Rol
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      <div className="admin-cards-grid">
        {roles.length === 0 ? (
          <div className="admin-card">
            <p className="admin-text-muted">No hay roles registrados</p>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">{role.name}</h3>
                <button onClick={() => handleOpenEdit(role)} className="admin-btn-edit">
                  ✏️ Editar
                </button>
              </div>
              <div className="admin-card-body">
                <p className="admin-card-label">Permisos asociados:</p>
                <div className="admin-tags">
                  {role.permissionNames && role.permissionNames.length > 0 ? (
                    role.permissionNames.map((perm, idx) => (
                      <span key={idx} className="admin-tag">
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="admin-text-muted">Sin permisos asignados</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingRole ? "Editar Rol" : "Crear Nuevo Rol"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Nombre del Rol</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: ADMIN, COORDINATOR"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Permisos</label>
                <div className="admin-checkbox-grid">
                  {permissions.map((perm) => (
                    <label key={perm.id} className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.permissionIds.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="admin-checkbox"
                      />
                      <span>{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingRole ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

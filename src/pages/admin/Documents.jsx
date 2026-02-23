import { useEffect, useState } from "react";
import {
  getModalitiesAdmin,
  createRequiredDocument,
  updateRequiredDocument,
  getRequiredDocumentsByModalityAndStatus,
  deleteRequiredDocument,
} from "../../services/adminService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/admin/Roles.css";

const DOCUMENT_TYPES = ["MANDATORY", "SECONDARY", "CANCELLATION"];

export default function Documents() {
  const [modalities, setModalities] = useState([]);
  const [selectedModalityId, setSelectedModalityId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const [formData, setFormData] = useState({
    modalityId: "",
    documentName: "",
    allowedFormat: "",
    maxFileSizeMB: 5,
    documentType: "MANDATORY",
    description: "",
    active: true,
  });

  useEffect(() => {
    fetchModalities();
  }, []);

  useEffect(() => {
    if (selectedModalityId) {
      setFormData((prev) => ({ ...prev, modalityId: selectedModalityId }));
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [selectedModalityId, activeFilter]);

  const fetchModalities = async () => {
    try {
      const data = await getModalitiesAdmin();
      setModalities(data);
    } catch (err) {
      setMessage("Error al cargar modalidades");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedModalityId) return;
    
    setLoadingDocuments(true);
    try {
      let data;
      if (activeFilter === "all") {
        data = await getRequiredDocumentsByModalityAndStatus(selectedModalityId, null);
      } else {
        const isActive = activeFilter === "active";
        data = await getRequiredDocumentsByModalityAndStatus(selectedModalityId, isActive);
      }
      setDocuments(data);
    } catch (err) {
      setMessage("Error al cargar documentos");
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDocument(null);
    setFormData({
      modalityId: selectedModalityId,
      documentName: "",
      allowedFormat: "",
      maxFileSizeMB: 5,
      documentType: "MANDATORY",
      description: "",
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (document) => {
    setEditingDocument(document);
    setFormData({
      modalityId: selectedModalityId,
      documentName: document.documentName,
      allowedFormat: document.allowedFormat,
      maxFileSizeMB: document.maxFileSizeMB,
      documentType: document.documentType || "MANDATORY",
      description: document.description,
      active: document.active,
    });
    setShowModal(true);
  };

  const handleDelete = (documentId) => {
    setConfirmDeleteId(documentId);
  };

  const executeDelete = async () => {
    const docId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteRequiredDocument(docId);
      setMessage("Documento desactivado exitosamente");
      fetchDocuments();
    } catch (err) {
      setMessage(err.response?.data || "Error al desactivar el documento");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModalityId) {
      setMessage("Selecciona una modalidad primero");
      return;
    }

    try {
      if (editingDocument) {
        await updateRequiredDocument(editingDocument.id, formData);
        setMessage("Documento actualizado exitosamente");
      } else {
        await createRequiredDocument(formData);
        setMessage("Documento creado exitosamente");
      }
      setShowModal(false);
      fetchDocuments();
    } catch (err) {
      setMessage(err.response?.data || "Error al procesar la solicitud");
    }
  };

  const getDocumentTypeBadge = (documentType) => {
    if (documentType === "MANDATORY") {
      return <span className="admin-tag mandatory">Obligatorio</span>;
    }
    if (documentType === "SECONDARY") {
      return <span className="admin-tag secondary">Secundario</span>;
    }
        if (documentType === "CANCELLATION") {
      return <span className="admin-tag cancellation">Cancelación</span>;
    }
    return <span className="admin-tag">{documentType || "N/A"}</span>;
  };

  if (loading) {
    return <div className="admin-loading">Cargando datos...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Documentos Requeridos</h1>
          <p className="admin-page-subtitle">Administra los documentos por modalidad (Obligatorios y Secundarios)</p>
        </div>
        {selectedModalityId && (
          <button onClick={handleOpenCreate} className="admin-btn-primary">
            ➕ Agregar Documento
          </button>
        )}
      </div>

      {message && (
        <div className={`admin-message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      <div className="admin-form-group" style={{ marginBottom: "2rem" }}>
        <label className="admin-label">Seleccionar Modalidad</label>
        <select
          value={selectedModalityId}
          onChange={(e) => setSelectedModalityId(e.target.value)}
          className="admin-select"
        >
          <option value="">-- Selecciona una modalidad --</option>
          {modalities.map((modality) => (
            <option key={modality.id} value={modality.id}>
              {modality.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModalityId && (
        <div className="admin-form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="admin-label">Filtrar por Estado</label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "admin-btn-primary" : "admin-btn-secondary"}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={activeFilter === "active" ? "admin-btn-primary" : "admin-btn-secondary"}
            >
              Activos
            </button>
            <button
              onClick={() => setActiveFilter("inactive")}
              className={activeFilter === "inactive" ? "admin-btn-primary" : "admin-btn-secondary"}
            >
              Inactivos
            </button>
          </div>
        </div>
      )}

      {selectedModalityId ? (
        <div className="admin-table-container">
          {loadingDocuments ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Cargando documentos...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Formato</th>
                  <th>Tamaño Máx</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                      {activeFilter === "all" 
                        ? "No hay documentos para esta modalidad. ¡Crea uno nuevo!"
                        : `No hay documentos ${activeFilter === "active" ? "activos" : "inactivos"} para esta modalidad.`
                      }
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <strong>{doc.documentName}</strong>
                      </td>
                      <td>{getDocumentTypeBadge(doc.documentType)}</td>
                      <td>{doc.description}</td>
                      <td>
                        <span className="admin-tag">{doc.allowedFormat}</span>
                      </td>
                      <td>{doc.maxFileSizeMB} MB</td>
                      <td>
                        <span className={`admin-status-badge ${doc.active ? "active" : "inactive"}`}>
                          {doc.active ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button onClick={() => handleOpenEdit(doc)} className="admin-btn-edit">
                            Editar
                          </button>
                          {doc.active && (
                            <button onClick={() => handleDelete(doc.id)} className="admin-btn-delete">
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>
          👆 Selecciona una modalidad para ver sus documentos
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingDocument ? "Editar Documento" : "Crear Nuevo Documento"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Nombre del Documento</label>
                <input
                  type="text"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: Propuesta detallada de pasantía"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Tipo de Documento *</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona el tipo --</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "MANDATORY" ? "📋 Obligatorio (al inicio)" : "📎 Secundario (durante la modalidad)"}
                    </option>
                  ))}
                </select>
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  <strong>Obligatorio:</strong> Documentos que el estudiante debe subir al iniciar la modalidad.<br/>
                  <strong>Secundario:</strong> Documentos que se suben durante el desarrollo de la modalidad.
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-textarea"
                  placeholder="Describe el propósito del documento"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Formato Permitido</label>
                <input
                  type="text"
                  value={formData.allowedFormat}
                  onChange={(e) => setFormData({ ...formData, allowedFormat: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: PDF, DOCX, JPG"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Tamaño Máximo (MB)</label>
                <input
                  type="number"
                  value={formData.maxFileSizeMB}
                  onChange={(e) => setFormData({ ...formData, maxFileSizeMB: parseInt(e.target.value) })}
                  className="admin-input"
                  min="1"
                  max="50"
                  required
                />
              </div>

              {editingDocument && (
                <div className="admin-form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="admin-checkbox"
                    />
                    <span>Activo</span>
                  </label>
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingDocument ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Desactivar Documento"
        message="¿Estás seguro de desactivar este documento?"
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
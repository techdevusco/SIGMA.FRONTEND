import { useEffect, useState } from "react";
import {
  getModalitiesAdmin,
  createRequiredDocument,
  updateRequiredDocument,
  getRequiredDocumentsByModalityAndStatus,
  deleteRequiredDocument,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
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
    requiresProposalEvaluation: false,
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
      requiresProposalEvaluation: false,
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
      requiresProposalEvaluation: document.requiresProposalEvaluation ?? false,
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
      setMessage(getErrorMessage(err, "Error al desactivar el documento"));
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
      setMessage(getErrorMessage(err, "Error al procesar la solicitud"));
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
                  {DOCUMENT_TYPES.map((type) => {
                    const labels = {
                      MANDATORY: "📋 Obligatorio (al inicio)",
                      SECONDARY: "📎 Secundario (durante la modalidad)",
                      CANCELLATION: "🚫 Cancelación",
                    };
                    return (
                      <option key={type} value={type}>
                        {labels[type] || type}
                      </option>
                    );
                  })}
                </select>
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  <strong>Obligatorio:</strong> Documentos que el estudiante debe subir al iniciar la modalidad.<br/>
                  <strong>Secundario:</strong> Documentos que se suben durante el desarrollo de la modalidad.<br/>
                  <strong>Cancelación:</strong> Documentos requeridos para cancelar la modalidad.
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

              <div className="admin-form-group">
                <label className="admin-label">¿Requiere evaluación de propuesta por jurado?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer",
                    padding: "0.85rem 1rem", borderRadius: "8px", border: "2px solid",
                    borderColor: formData.requiresProposalEvaluation ? "#7A1117" : "#e0e0e0",
                    background: formData.requiresProposalEvaluation ? "#fdf2f3" : "#f9f9f9",
                  }}>
                    <input
                      type="radio"
                      name="requiresProposalEvaluation"
                      checked={formData.requiresProposalEvaluation === true}
                      onChange={() => setFormData({ ...formData, requiresProposalEvaluation: true })}
                      style={{ marginTop: "3px", accentColor: "#7A1117" }}
                    />
                    <div>
                      <strong>Sí — Los jurados deben revisar este documento</strong>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#555" }}>
                        El documento forma parte del proceso de evaluación formal. Los jurados asignados deben aprobarlo o solicitar correcciones antes de que el proceso avance.
                      </p>
                    </div>
                  </label>
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer",
                    padding: "0.85rem 1rem", borderRadius: "8px", border: "2px solid",
                    borderColor: formData.requiresProposalEvaluation === false ? "#7A1117" : "#e0e0e0",
                    background: formData.requiresProposalEvaluation === false ? "#fdf2f3" : "#f9f9f9",
                  }}>
                    <input
                      type="radio"
                      name="requiresProposalEvaluation"
                      checked={formData.requiresProposalEvaluation === false}
                      onChange={() => setFormData({ ...formData, requiresProposalEvaluation: false })}
                      style={{ marginTop: "3px", accentColor: "#7A1117" }}
                    />
                    <div>
                      <strong>No — Solo es un documento de soporte</strong>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#555" }}>
                        El documento se sube como requisito administrativo o de soporte, pero no requiere revisión ni aprobación por parte de los jurados.
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
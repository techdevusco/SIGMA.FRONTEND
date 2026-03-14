import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  uploadStudentDocument,
  getMyAvailableDocuments,
  getStudentDocumentBlob,
  downloadTemplateBlob,
  requestDocumentEdit,
  getErrorMessage,
} from "../../services/studentService";
import "../../styles/student/studentmodalitydocuments.css";

// ========================================
// CONFIGURACIÓN DE PLANTILLAS POR MODALIDAD
// Para agregar nuevas plantillas, solo agrega una entrada al mapa.
// La clave debe estar en MINÚSCULAS. Se compara case-insensitive.
// ========================================
const MODALITY_TEMPLATES = {
  "proyecto de grado": [
    { id: 1, name: "Formato Propuesta de Proyecto de Grado" },
    { id: 2, name: "Lista de Chequeo (Director de proyecto)" },
    { id: 4, name: "Formato del Documento Final" },
  ],

  "pasantia": [
    { id: 8, name: "Lista de Chequeo" },
    { id: 9, name: "Propuesta de la Pasantia" },
    { id: 10, name: "Formato del Informe Final" },
  ],
  "pasantia supervisada": [
    { id: 8, name: "Lista de Chequeo" },
    { id: 9, name: "Propuesta de la Pasantia" },
    { id: 10, name: "Formato del Informe Final" },
  ],

  "practica profesional": [
    { id: 17, name: "Lista de Chequeo" },
    { id: 18, name: "Formato de la Propuesta" },
    { id: 19, name: "Formato del Informe Parcial" },
    { id: 20, name: "Formato del Informe Final" },
  ],

  "emprendimiento": [
    { id: 14, name: "Guia Metodologica para Crear Empresa" },
    { id: 9, name: "Formato de Propuesta (Referencia)" },
  ],
  "fortalecimiento de empresa": [
    { id: 15, name: "Guia Metodologica para Fortalecimiento de Empresa" },
    { id: 9, name: "Formato de Propuesta (Referencia)" },
  ],
  "emprendimiento y fortalecimiento de empresa": [
    { id: 14, name: "Guia Metodologica para Crear Empresa" },
    { id: 15, name: "Guia Metodologica para Fortalecimiento de Empresa" },
    { id: 9, name: "Formato de Propuesta (Referencia)" },
  ],
};

/**
 * Busca plantillas para una modalidad comparando case-insensitive.
 * Soporta variaciones como "Proyecto de grado", "PROYECTO DE GRADO", etc.
 */
function getTemplatesForModality(modalityName) {
  if (!modalityName) return [];
  const normalized = modalityName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return MODALITY_TEMPLATES[normalized] || [];
}

export default function StudentModalityDocuments({ studentModalityId, modalityId, modalityName }) {
  const navigate = useNavigate();
  
  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [sendingDocId, setSendingDocId] = useState(null);
  const [viewingDocId, setViewingDocId] = useState(null);
  const [downloadingTemplateId, setDownloadingTemplateId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [editRequestDocId, setEditRequestDocId] = useState(null);
  const [editRequestReason, setEditRequestReason] = useState("");
  const [editRequestLoading, setEditRequestLoading] = useState(false);

  // Plantillas según la modalidad actual (basado en config local)
  const templates = getTemplatesForModality(modalityName);

  useEffect(() => {
    fetchDocumentsData();
  }, []);
  const fetchDocumentsData = async () => {
    try {
      setLoading(true);
      console.log("🔍 Obteniendo documentos disponibles...");
      
      const response = await getMyAvailableDocuments();
      
      console.log("✅ Respuesta completa:", response);

      // Verificar si hay documentos MANDATORY faltantes
      if (!response.success) {
        setMessage(response.message || "Error al cargar documentos");
        setMessageType("error");
        
        if (response.missingDocuments) {
          setMessage(
            `⚠️ ${response.message}\n\nDocumentos faltantes:\n- ${response.missingDocuments.join("\n- ")}`
          );
        }
        return;
      }

      setDocuments(response.documents || []);
      setStatistics(response.statistics || null);

    } catch (err) {
      console.error("❌ Error al cargar documentos:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (requiredDocumentId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [requiredDocumentId]: file,
    }));
  };

  const handleViewDocument = async (studentDocumentId, documentName) => {
    console.log("📄 Intentando ver documento:", studentDocumentId);
    setViewingDocId(studentDocumentId);
    
    try {
      const blobUrl = await getStudentDocumentBlob(studentDocumentId);
      console.log("✅ Abriendo documento en nueva pestaña");
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("❌ Error al cargar documento:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setViewingDocId(null);
    }
  };

  const handlePreviewTemplate = async (templateDocumentId) => {
    setDownloadingTemplateId(templateDocumentId);
    try {
      const { blob } = await downloadTemplateBlob(templateDocumentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("❌ Error al previsualizar plantilla:", err);
      setMessage(err.message || "Error al previsualizar la plantilla");
      setMessageType("error");
    } finally {
      setDownloadingTemplateId(null);
    }
  };

  const handleDownloadTemplate = async (templateDocumentId, documentName) => {
    setDownloadingTemplateId(templateDocumentId);
    try {
      const { blob, fileName } = await downloadTemplateBlob(templateDocumentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `plantilla_${documentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("❌ Error al descargar plantilla:", err);
      setMessage(err.message || "Error al descargar la plantilla");
      setMessageType("error");
    } finally {
      setDownloadingTemplateId(null);
    }
  };

  const handleUpload = async (requiredDocumentId, documentName, documentType) => {
    const file = selectedFiles[requiredDocumentId];
    if (!file) return;

    try {
      setSendingDocId(requiredDocumentId);
      setMessage("");

      const res = await uploadStudentDocument(
        studentModalityId,
        requiredDocumentId,
        file
      );

      setMessage(res.message || "Documento enviado correctamente");
      setMessageType("success");

      // Limpiar el archivo seleccionado
      setSelectedFiles((prev) => ({
        ...prev,
        [requiredDocumentId]: null,
      }));

      // Recargar documentos
      await fetchDocumentsData();

      // Si era MANDATORY, verificar si todos están completos
      if (documentType === "MANDATORY") {
        const mandatoryDocs = documents.filter((doc) => doc.documentType === "MANDATORY");
        const allMandatoryUploaded = mandatoryDocs.every(
          (doc) => doc.uploaded || doc.requiredDocumentId === requiredDocumentId
        );

        if (allMandatoryUploaded && mandatoryDocs.length > 0) {
          setMessage(
            "¡Excelente! Has subido todos los documentos obligatorios. Ahora puedes ver el estado de tu modalidad."
          );
          setMessageType("success-complete");
          setTimeout(() => {
            navigate("/student/status");
          }, 5000);
        }
      }
    } catch (err) {
      console.error("❌ Error al enviar documento:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setSendingDocId(null);
    }
  };

  const handleReupload = async (studentDocumentId, requiredDocumentId, documentName) => {
    const file = selectedFiles[requiredDocumentId];
    if (!file) return;

    try {
      setSendingDocId(requiredDocumentId);
      setMessage("");

      const res = await uploadStudentDocument(
        studentModalityId,
        requiredDocumentId,
        file
      );

      setMessage(`✅ ${documentName} actualizado correctamente`);
      setMessageType("success");

      setSelectedFiles((prev) => ({
        ...prev,
        [requiredDocumentId]: null,
      }));

      await fetchDocumentsData();
    } catch (err) {
      console.error("❌ Error al actualizar documento:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setSendingDocId(null);
    }
  };

  const handleRequestDocumentEdit = async (studentDocumentId, documentName) => {
    if (!editRequestReason.trim()) return;
    try {
      setEditRequestLoading(true);
      setMessage("");
      const res = await requestDocumentEdit(studentDocumentId, editRequestReason.trim());
      setMessage(res.message || `✅ Solicitud de edición para "${documentName}" registrada correctamente.`);
      setMessageType("success");
      setEditRequestDocId(null);
      setEditRequestReason("");
      await fetchDocumentsData();
    } catch (err) {
      console.error("❌ Error al solicitar edición:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error al solicitar edición del documento";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setEditRequestLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Pendiente de revisión",
      ACCEPTED_FOR_PROGRAM_HEAD_REVIEW: "Aceptado por Jefe de Programa",
      REJECTED_FOR_PROGRAM_HEAD_REVIEW: "Rechazado por Jefe de Programa",
      CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD: "Correcciones solicitadas",
      ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW: "Aceptado por Comité",
      REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW: "Rechazado por Comité",
      CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE: "Correcciones solicitadas por Comité",
      CORRECTION_RESUBMITTED: "Corrección reenviada",
      ACCEPTED_FOR_EXAMINER_REVIEW: "Aceptado por Jurado",
      REJECTED_FOR_EXAMINER_REVIEW: "Rechazado por Jurado",
      CORRECTIONS_REQUESTED_BY_EXAMINER: "Correcciones solicitadas por Jurado",
      EDIT_REQUESTED: "Edición solicitada — Pendiente de aprobación",
      EDIT_REQUEST_APPROVED: "Edición aprobada — Puedes subir nueva versión",
      EDIT_REQUEST_REJECTED: "Solicitud de edición rechazada",
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === "EDIT_REQUESTED") return "edit-requested";
    if (status === "EDIT_REQUEST_APPROVED") return "corrections";
    if (status === "EDIT_REQUEST_REJECTED") return "rejected";
    if (status?.includes("ACCEPTED")) return "accepted";
    if (status?.includes("REJECTED")) return "rejected";
    if (status?.includes("CORRECTIONS")) return "corrections";
    return "pending";
  };

  const canReuploadDocument = (status) => {
    const reuploadableStatuses = [
      "REJECTED_FOR_PROGRAM_HEAD_REVIEW",
      "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE",
      "CORRECTIONS_REQUESTED_BY_EXAMINER",
      "EDIT_REQUEST_APPROVED",
    ];
    return reuploadableStatuses.includes(status);
  };

  const getDocumentTypeBadge = (documentType) => {
    if (documentType === "MANDATORY") {
      return <span className="document-type-badge mandatory">Obligatorio</span>;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="documents-container">
        <div className="documents-loading">
          <div className="spinner"></div>
          <p>Cargando documentos disponibles...</p>
        </div>
      </div>
    );
  }

  // Separar documentos por tipo
  const mandatoryDocs = documents.filter((doc) => doc.documentType === "MANDATORY");
  const secondaryDocs = documents.filter((doc) => doc.documentType === "SECONDARY");

  const isFinalDocument = (docName = "") => docName.toLowerCase().includes("documento final");

  // Mostrar la plantilla del documento final solo cuando exista la opción de subir/re-subir ese documento.
  const showFinalDocumentTemplate = documents.some((doc) => {
    if (!isFinalDocument(doc.documentName)) return false;
    return !doc.uploaded || canReuploadDocument(doc.status);
  });

  const visibleTemplates = templates.filter((tpl) => {
    if (tpl.id !== 4) return true;
    return showFinalDocumentTemplate;
  });

  // Calcular progreso solo de MANDATORY
  const uploadedMandatoryCount = mandatoryDocs.filter((doc) => doc.uploaded).length;
  const progressPercentage =
    mandatoryDocs.length > 0
      ? Math.round((uploadedMandatoryCount / mandatoryDocs.length) * 100)
      : 0;

  return (
    <div className="documents-container">
      {/* Header con estadísticas */}
      <div className="documents-header">
        <h3 className="documents-title">Mis Documentos</h3>
      

        {/* Barra de progreso solo para MANDATORY */}
        {mandatoryDocs.length > 0 && (
          <div className="documents-progress">
            <div className="documents-progress-info">
              <span className="documents-progress-text">
                 Documentos obligatorios subidos: {uploadedMandatoryCount} de {mandatoryDocs.length}
              </span>
            
            </div>
            <div className="documents-progress-bar">
              <div
                className="documents-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="documents-body">
        {/* PLANTILLAS DE LA MODALIDAD */}
        {visibleTemplates.length > 0 && (
          <div className="documents-template-banner">
            <div className="documents-template-banner-icon"></div>
            <div className="documents-template-banner-content">
              <h4 className="documents-template-banner-title">
                Plantillas disponibles
              </h4>
              <p className="documents-template-banner-subtitle">
                Descarga las plantillas con el formato requerido para tus documentos.
              </p>
              <div className="documents-template-banner-list">
                {visibleTemplates.map((tpl) => (
                  <div key={tpl.id} className="documents-template-banner-item">
                    <span className="documents-template-banner-name">
                      {tpl.name || tpl.fileName || "Plantilla"}
                    </span>
                    <div className="documents-template-banner-actions">
                      <button
                        onClick={() => handlePreviewTemplate(tpl.id)}
                        disabled={downloadingTemplateId === tpl.id}
                        className="document-template-button download"
                      >
                        {downloadingTemplateId === tpl.id
                          ? "Cargando..."
                          : "⬇ Descargar plantilla"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTOS MANDATORY */}
        {mandatoryDocs.length > 0 && (
          <div className="documents-section" style={{
            background: 'linear-gradient(120deg, #f9f6e7 0%, #f7f7fa 60%, #e8ebf0 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 24px #7A111733',
            padding: '2.2rem 1.5rem',
            marginBottom: '2.5rem',
            border: '2px solid #D5CBA0',
            animation: 'slideDown 0.3s ease-out',
          }}>
            <h4 className="documents-section-title" style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              color: '#7A1117',
              fontSize: '1.35rem',
              fontWeight: 900,
              marginBottom: '0.7rem',
              letterSpacing: '0.5px',
              textShadow: '0 2px 8px #d5cba02a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              
              Documentos Obligatorios
            </h4>
            <p className="documents-section-subtitle" style={{
              color: '#7A1117cc',
              fontSize: '1.08rem',
              fontWeight: 500,
              marginBottom: '1.5rem',
              textAlign: 'center',
              background: 'rgba(213,203,160,0.08)',
              borderRadius: '8px',
              padding: '0.7rem 1rem',
              boxShadow: '0 2px 8px #D5CBA033',
            }}>
              Estos documentos son requeridos para iniciar tu modalidad de grado. Por favor, verifica que todos estén completos antes de continuar.
            </p>
            <ul className="documents-list" style={{
              marginTop: '1.2rem',
              padding: 0,
              display: 'grid',
              gap: '1.8rem',
            }}>
              {mandatoryDocs.map((doc) => (
                <DocumentCard
                  key={doc.requiredDocumentId}
                  doc={doc}
                  studentModalityId={studentModalityId}
                  selectedFiles={selectedFiles}
                  sendingDocId={sendingDocId}
                  viewingDocId={viewingDocId}
                  downloadingTemplateId={downloadingTemplateId}
                  handleFileChange={handleFileChange}
                  handleUpload={handleUpload}
                  handleReupload={handleReupload}
                  handleViewDocument={handleViewDocument}
                  handlePreviewTemplate={handlePreviewTemplate}
                  handleDownloadTemplate={handleDownloadTemplate}
                  getStatusLabel={getStatusLabel}
                  getStatusClass={getStatusClass}
                  canReuploadDocument={canReuploadDocument}
                  getDocumentTypeBadge={getDocumentTypeBadge}
                  editRequestDocId={editRequestDocId}
                  editRequestReason={editRequestReason}
                  editRequestLoading={editRequestLoading}
                  setEditRequestDocId={setEditRequestDocId}
                  setEditRequestReason={setEditRequestReason}
                  handleRequestDocumentEdit={handleRequestDocumentEdit}
                />
              ))}
            </ul>
          </div>
        )}

        {/* DOCUMENTOS SECONDARY */}
        {secondaryDocs.length > 0 && (
          <div className="documents-section">
            <h4 className="documents-section-title">Documentos pendientes</h4>
            <p className="documents-section-subtitle">
              Estos documentos se suben durante el desarrollo de tu modalidad.
            </p>
            <ul className="documents-list">
              {secondaryDocs.map((doc) => (
                <DocumentCard
                  key={doc.requiredDocumentId}
                  doc={doc}
                  studentModalityId={studentModalityId}
                  selectedFiles={selectedFiles}
                  sendingDocId={sendingDocId}
                  viewingDocId={viewingDocId}
                  downloadingTemplateId={downloadingTemplateId}
                  handleFileChange={handleFileChange}
                  handleUpload={handleUpload}
                  handleReupload={handleReupload}
                  handleViewDocument={handleViewDocument}
                  handlePreviewTemplate={handlePreviewTemplate}
                  handleDownloadTemplate={handleDownloadTemplate}
                  getStatusLabel={getStatusLabel}
                  getStatusClass={getStatusClass}
                  canReuploadDocument={canReuploadDocument}
                  getDocumentTypeBadge={getDocumentTypeBadge}
                  editRequestDocId={editRequestDocId}
                  editRequestReason={editRequestReason}
                  editRequestLoading={editRequestLoading}
                  setEditRequestDocId={setEditRequestDocId}
                  setEditRequestReason={setEditRequestReason}
                  handleRequestDocumentEdit={handleRequestDocumentEdit}
                />
              ))}
            </ul>
          </div>
        )}

        {documents.length === 0 && (
          <div className="documents-empty">
            <div className="documents-empty-icon">📄</div>
            <p className="documents-empty-text">
              No hay documentos disponibles para esta modalidad
            </p>
          </div>
        )}

        
        {message && (
          <div className={`documents-message ${messageType}`} style={{ marginTop: '2.5rem' }}>
            {message}
            {messageType === "success-complete" && (
              <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                Serás redirigido automáticamente en 5 segundos...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// COMPONENTE REUTILIZABLE: DOCUMENT CARD
// ========================================

function DocumentCard({
  doc,
  studentModalityId,
  selectedFiles,
  sendingDocId,
  viewingDocId,
  downloadingTemplateId,
  handleFileChange,
  handleUpload,
  handleReupload,
  handleViewDocument,
  handlePreviewTemplate,
  handleDownloadTemplate,
  getStatusLabel,
  getStatusClass,
  canReuploadDocument,
  getDocumentTypeBadge,
  editRequestDocId,
  editRequestReason,
  editRequestLoading,
  setEditRequestDocId,
  setEditRequestReason,
  handleRequestDocumentEdit,
}) {
  const isUploaded = doc.uploaded;
  const hasTemplate = !!doc.templateDocumentId;

  return (
    <li className={`document-card ${isUploaded ? "uploaded" : ""}`}>
      <div className="document-card-header">
        <div>
          <h4 className="document-name">{doc.documentName}</h4>
          {getDocumentTypeBadge(doc.documentType)}
        </div>
        {isUploaded && <span className="document-uploaded-badge">✓ Subido</span>}
      </div>

      {doc.description && <p className="document-description">{doc.description}</p>}

      {/* Botón de plantilla */}
      {hasTemplate && (
        <div className="document-template-section">
          <div className="document-template-info">
            <span className="document-template-icon">📋</span>
            <span className="document-template-text">
              Esta documento tiene una plantilla disponible. Descárgala para conocer el formato requerido.
            </span>
          </div>
          <div className="document-template-actions">
            <button
              onClick={() => handlePreviewTemplate(doc.templateDocumentId)}
              disabled={downloadingTemplateId === doc.templateDocumentId}
              className="document-template-button preview"
            >
              {downloadingTemplateId === doc.templateDocumentId
                ? "Cargando..."
                : "👁 Vista previa"}
            </button>
            <button
              onClick={() => handleDownloadTemplate(doc.templateDocumentId, doc.documentName)}
              disabled={downloadingTemplateId === doc.templateDocumentId}
              className="document-template-button download"
            >
              {downloadingTemplateId === doc.templateDocumentId
                ? "Descargando..."
                : "⬇ Descargar plantilla"}
            </button>
          </div>
        </div>
      )}

      <div className="document-requirements">
        <div className="document-requirement">
          <span className="document-requirement-label">Formato:</span>
          <span className="document-requirement-value">{doc.allowedFormat}</span>
        </div>
        <div className="document-requirement">
          <span className="document-requirement-label">Tamaño máx:</span>
          <span className="document-requirement-value">{doc.maxFileSizeMB} MB</span>
        </div>
      </div>

      {isUploaded && (
        <div className="document-uploaded-info">
          <div className="uploaded-info-row">
            <span className="uploaded-info-label"> Fecha de carga:</span>
            <span className="uploaded-info-value">
              {new Date(doc.uploadDate).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>

          <div className="uploaded-info-row">
            <span className="uploaded-info-label">Estado:</span>
            <span className={`uploaded-status-badge ${getStatusClass(doc.status)}`}>
              {getStatusLabel(doc.status)}
            </span>
          </div>

          {doc.notes && (
            <div className="uploaded-info-row">
              <span className="uploaded-info-label">Notas:</span>
              <span className="uploaded-info-value notes">{doc.notes}</span>
            </div>
          )}

          <button
            onClick={() => handleViewDocument(doc.studentDocumentId, doc.documentName)}
            disabled={viewingDocId === doc.studentDocumentId}
            className="document-view-button"
          >
            {viewingDocId === doc.studentDocumentId ? "Cargando..." : "Ver documento subido"}
          </button>

          {canReuploadDocument(doc.status) ? (
            <div className="document-reupload-section">
              <div className="document-reupload-message">
                ⚠️ Este documento necesita correcciones. Puedes subir una nueva versión.
              </div>
              <div className="document-file-input-wrapper">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(doc.requiredDocumentId, e.target.files[0])}
                  className="document-file-input"
                />
              </div>
              <button
                onClick={() =>
                  handleReupload(doc.studentDocumentId, doc.requiredDocumentId, doc.documentName)
                }
                disabled={
                  !selectedFiles[doc.requiredDocumentId] ||
                  sendingDocId === doc.requiredDocumentId
                }
                className={`document-upload-button ${
                  sendingDocId === doc.requiredDocumentId ? "loading" : ""
                }`}
              >
                {sendingDocId === doc.requiredDocumentId
                  ? "Actualizando..."
                  : " Actualizar documento"}
              </button>
            </div>
          ) : doc.status === "ACCEPTED_FOR_EXAMINER_REVIEW" && doc.documentType === "MANDATORY" ? (
            <div className="document-edit-request-section">
              {editRequestDocId === doc.studentDocumentId ? (
                <div className="document-edit-request-form">
                  <p className="document-edit-request-info">
                    Indica el motivo por el cual necesitas editar este documento. Tu solicitud será evaluada por los jurados asignados.
                  </p>
                  <textarea
                    className="document-edit-request-textarea"
                    placeholder="Describe el motivo de la edición (ej: Actualizar datos del marco teórico, corregir bibliografía...)"
                    value={editRequestReason}
                    onChange={(e) => setEditRequestReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="document-edit-request-actions">
                    <button
                      className="document-edit-request-btn cancel"
                      onClick={() => {
                        setEditRequestDocId(null);
                        setEditRequestReason("");
                      }}
                      disabled={editRequestLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      className="document-edit-request-btn submit"
                      onClick={() => handleRequestDocumentEdit(doc.studentDocumentId, doc.documentName)}
                      disabled={!editRequestReason.trim() || editRequestLoading}
                    >
                      {editRequestLoading ? "Enviando..." : "Enviar solicitud"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="document-edit-request-trigger"
                  onClick={() => setEditRequestDocId(doc.studentDocumentId)}
                >
                  Solicitar editar propuesta
                </button>
              )}
            </div>
          ) : doc.status === "EDIT_REQUESTED" ? (
            <div className="document-edit-request-pending">
              Tu solicitud de edición está siendo evaluada por los jurados. Serás notificado cuando haya una decisión.
            </div>
          ) : (
            <div className="document-locked-message">
              Ya subiste este documento. Si necesitas modificarlo, contacta al Jefe de Programa.
            </div>
          )}
        </div>
      )}

      {!isUploaded && (
        <div className="document-upload-section">
          <div className="document-file-input-wrapper">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange(doc.requiredDocumentId, e.target.files[0])}
              className="document-file-input"
            />
          </div>
          <button
            onClick={() =>
              handleUpload(doc.requiredDocumentId, doc.documentName, doc.documentType)
            }
            disabled={
              !selectedFiles[doc.requiredDocumentId] || sendingDocId === doc.requiredDocumentId
            }
            className={`document-upload-button ${
              sendingDocId === doc.requiredDocumentId ? "loading" : ""
            }`}
          >
            {sendingDocId === doc.requiredDocumentId ? "Enviando..." : " Enviar documento"}
          </button>
        </div>
      )}
    </li>
  );
}
import { useEffect, useState } from "react";
import {
  getCurrentModalityStatus,
  getMyDocuments,
  uploadStudentDocument,
  getStudentDocumentBlob,
  getStatusLabel,
  getStatusBadgeClass,
} from "../../services/studentService";
import "../../styles/student/status.css";

export default function ModalityStatus() {
  const [data, setData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, docsRes] = await Promise.all([
        getCurrentModalityStatus(),
        getMyDocuments(),
      ]);
     
      console.log("✅ Estado:", statusRes);
      console.log("✅ Documentos:", docsRes);
     
      setData(statusRes);
      setDocuments(docsRes);
    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      setError(
        err.response?.data?.message ||
          "No tienes una modalidad activa en este momento"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (requiredDocumentId, file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("El archivo no puede superar los 5MB");
      return;
    }

    setUploadingDocId(requiredDocumentId);
    setMessage("");

    try {
      console.log("📤 Subiendo documento:", {
        studentModalityId: data.studentModalityId,
        requiredDocumentId: requiredDocumentId,
        fileName: file.name
      });

      await uploadStudentDocument(data.studentModalityId, requiredDocumentId, file);
      setMessage("Documento subido exitosamente");
     
      const docsRes = await getMyDocuments();
      setDocuments(docsRes);
     
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error al subir:", err);
      setMessage(err.response?.data || "Error al subir el documento");
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleViewDocument = async (studentDocumentId) => {
    console.log("📄 Intentando ver documento con ID:", studentDocumentId);
    setLoadingDocId(studentDocumentId);

    try {
      const blobUrl = await getStudentDocumentBlob(studentDocumentId);
      console.log("✅ Blob URL generada:", blobUrl);
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        console.log("🗑️ Liberando blob URL");
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("❌ Error completo al cargar documento:", err);
      setMessage(err.response?.data?.message || err.message || "Error al cargar el documento");
    } finally {
      setLoadingDocId(null);
    }
  };

  // ✅ BORRADAS LAS DOS FUNCIONES LOCALES - Ahora usa las del service importadas arriba

  if (loading) {
    return <div className="status-loading">Cargando estado de la modalidad...</div>;
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="status-error-container">
          <div className="status-error-card">
            <div className="status-error-icon"></div>
            <h2 className="status-error-title">Estado de la modalidad</h2>
            <div className="status-error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="status-container">
      {/* Header institucional simple */}
      <div className="status-header status-header-clean" style={{background: '#5d0d12'}}>
        <h2 className="status-title status-title-clean" style={{color: '#fff'}}>Estado de la Modalidad</h2>
      </div>

      {/* Mensaje de feedback profesional */}
      {message && (
        <div className={`status-message status-message-clean ${message.includes("Error") || message.includes("error") ? "error" : "success"}`}>
          <span className="status-message-icon">{message.includes("Error") || message.includes("error") ? "⚠️" : "✔️"}</span>
          <span>{message}</span>
        </div>
      )}

      {/* Información principal en formato lista */}
      <ul className="status-list">
        <li><strong>Modalidad:</strong> {data.modalityName}</li>
        <li><strong>Estado actual:</strong> <span className="status-current-badge">{getStatusLabel(data.currentStatus)}</span></li>
        {data.currentStatusDescription && (
          <li><strong>Descripción:</strong> {data.currentStatusDescription}</li>
        )}
        <li><strong>Última actualización:</strong> <span className="status-date">{new Date(data.lastUpdatedAt).toLocaleString('es-CO', {dateStyle: 'long', timeStyle: 'short'})}</span></li>
        {data.projectDirectorName && (
          <li><strong>Director de Proyecto:</strong> {data.projectDirectorName} <span style={{marginLeft: '1rem', color: '#888', fontSize: '0.95rem'}}>{data.projectDirectorEmail}</span></li>
        )}
        <li>
          <strong>Información de Sustentación:</strong>
          {data.defenseDate ? (
            <span style={{marginLeft: '0.5rem'}}>
              <span><strong>Fecha:</strong> {new Date(data.defenseDate).toLocaleString('es-CO', {dateStyle: 'full', timeStyle: 'short'})}</span>
              <span style={{marginLeft: '1rem'}}><strong>Lugar:</strong> {data.defenseLocation || "No especificado"}</span>
              {data.defenseProposedByProjectDirector && (
                <span style={{marginLeft: '1rem', color: '#856404'}}>{data.defenseProposedByProjectDirector}</span>
              )}
            </span>
          ) : (
            <span style={{marginLeft: '0.5rem', color: '#888'}}>Aún no se ha programado la fecha de sustentación. Se te notificará cuando tu director o el comité programen la sustentación.</span>
          )}
        </li>
      </ul>

      {/* Estadísticas de Documentos */}
      <div className="status-section">
        <h3 className="status-section-title"> Resumen de Documentos</h3>
        <div className="status-documents-stats">
          <div className="status-stat-card">
            <div className="status-stat-number">{data.totalDocuments || 0}</div>
            <div className="status-stat-label">Total</div>
          </div>
          <div className="status-stat-card success">
            <div className="status-stat-number">{data.approvedDocuments || 0}</div>
            <div className="status-stat-label">Aprobados</div>
          </div>
          <div className="status-stat-card warning">
            <div className="status-stat-number">{data.pendingDocuments || 0}</div>
            <div className="status-stat-label">Pendientes</div>
          </div>
          <div className="status-stat-card error">
            <div className="status-stat-number">{data.rejectedDocuments || 0}</div>
            <div className="status-stat-label">Rechazados</div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="status-history-section">
        <h3 className="status-history-title">Historial de Estados</h3>

        {data.history && data.history.length > 0 ? (
          <ul className="status-history-list">
            {data.history.map((h, index) => (
              <li key={index} className="status-history-item">
                <div className="status-history-card">
                  <div className="status-history-status">{getStatusLabel(h.status)}</div>
                  <div className="status-history-description">{h.description}</div>

                  <div className="status-history-meta">
                    <div className="status-history-meta-item">
                      <span className="status-history-meta-label">Fecha:</span>
                      <span className="status-history-meta-value">
                        {new Date(h.changeDate).toLocaleString('es-CO', {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>

                    <div className="status-history-meta-item">
                      <span className="status-history-meta-label">Responsable:</span>
                      <span className="status-history-meta-value">{h.responsible}</span>
                    </div>
                  </div>

                  {h.observations && (
                    <div className="status-observations">
                      <span className="status-observations-label">Observaciones:</span>
                      <p className="status-observations-text">{h.observations}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="status-history-empty">
            <div className="status-history-empty-icon">📭</div>
            <p>No hay historial disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
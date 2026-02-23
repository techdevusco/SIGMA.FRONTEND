import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDirectorStudentDetail,
  proposeDefenseByDirector,
  notifyReadyForDefense,
  approveModalityCancellationByDirector,
  rejectModalityCancellationByDirector,
  getDocumentBlobUrl,
  viewCancellationDocument,
  canProposeDefense,
  canNotifyExaminers,
  hasCancellationRequest,
  formatDate,
  getErrorMessage,
  getStatusLabel,
  getStatusBadgeClass,
} from "../../services/directorService";
import "../../styles/director/directorStudentProfile.css";

export default function DirectorStudentProfile() {
  const { studentModalityId } = useParams();
  const navigate = useNavigate();
 
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [loadingCancellationDoc, setLoadingCancellationDoc] = useState(false);
  const [notifyingExaminers, setNotifyingExaminers] = useState(false);
 
  // Modals
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
 
  // Form data
  const [defenseData, setDefenseData] = useState({
    defenseDate: "",
    defenseLocation: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchStudentDetail();
  }, [studentModalityId]);

  const fetchStudentDetail = async () => {
    try {
      const data = await getDirectorStudentDetail(studentModalityId);
      console.log("Student detail:", data);
      setStudent(data);
    } catch (err) {
      console.error("Error fetching student detail:", err);
      setMessage("Error al cargar detalle: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyExaminers = async () => {
    if (!window.confirm("¿Confirmas que el estudiante ha entregado todos los documentos y quieres notificar a los jurados?")) return;
    setNotifyingExaminers(true);
    try {
      const response = await notifyReadyForDefense(studentModalityId);
      setMessage(response.message || "✅ Jurados notificados. Modalidad marcada como lista para defensa.");
      fetchStudentDetail();
      setTimeout(() => setMessage(""), 8000);
    } catch (err) {
      console.error("Error al notificar jurados:", err);
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        (typeof data === "object" && Object.keys(data).length > 0 && JSON.stringify(data)) ||
        err.message ||
        "Error desconocido";
      setMessage("❌ " + msg);
      setTimeout(() => setMessage(""), 8000);
    } finally {
      setNotifyingExaminers(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver documento
  const handleViewDocument = async (studentDocumentId, documentName) => {
    console.log("📄 Intentando ver documento:", studentDocumentId);
    setLoadingDoc(studentDocumentId);

    try {
      const blobUrl = await getDocumentBlobUrl(studentDocumentId);
      console.log("✅ Abriendo documento en nueva pestaña");
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("❌ Error al cargar documento:", err);
      setMessage(`Error al cargar el documento "${documentName}": ${getErrorMessage(err)}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoadingDoc(null);
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver documento de cancelación
  const handleViewCancellationDocument = async () => {
    console.log("📄 Intentando ver documento de cancelación");
    setLoadingCancellationDoc(true);

    try {
      const blob = await viewCancellationDocument(studentModalityId);
      const blobUrl = window.URL.createObjectURL(blob);
      console.log("✅ Abriendo documento de cancelación en nueva pestaña");
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("❌ Error al cargar documento de cancelación:", err);
      setMessage(`Error al cargar el documento de cancelación: ${getErrorMessage(err)}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoadingCancellationDoc(false);
    }
  };

  const handleProposeDefense = async (e) => {
    e.preventDefault();

    if (!defenseData.defenseDate) {
      setError("Debes seleccionar una fecha");
      return;
    }

    if (!defenseData.defenseLocation.trim()) {
      setError("Debes ingresar el lugar de la sustentación");
      return;
    }

    setSubmitting(true);
    setError("");
   
    try {
      const response = await proposeDefenseByDirector(studentModalityId, defenseData);

      // Formatear fecha para mostrar
      const formattedDate = new Date(defenseData.defenseDate).toLocaleString("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      });

      // Mostrar mensaje de éxito
      setSuccessMessage(
        `✅ Propuesta de sustentación enviada correctamente para el ${formattedDate} en ${defenseData.defenseLocation}`
      );

      // Esperar 10 segundos antes de cerrar
      setTimeout(() => {
        setShowDefenseModal(false);
        setSuccessMessage("");
        setDefenseData({ defenseDate: "", defenseLocation: "" });
        fetchStudentDetail();
        setMessage(response.message || "Propuesta de sustentación enviada exitosamente");
        setTimeout(() => setMessage(""), 10000);
      }, 10000);
    } catch (err) {
      console.error("Error proposing defense:", err);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveCancellation = async () => {
    if (!window.confirm("¿Estás seguro de aprobar esta solicitud de cancelación?")) {
      return;
    }

    try {
      const response = await approveModalityCancellationByDirector(studentModalityId);
      setMessage(response.message || "Cancelación aprobada. Será enviada al comité.");
      fetchStudentDetail();
     
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Error approving cancellation:", err);
      setMessage("Error al aprobar cancelación: " + getErrorMessage(err));
    }
  };

  const handleRejectCancellation = async (e) => {
    e.preventDefault();

    if (!rejectReason.trim()) {
      setMessage("Debe proporcionar un motivo para rechazar la cancelación");
      return;
    }

    try {
      const response = await rejectModalityCancellationByDirector(studentModalityId, rejectReason);
      setMessage(response.message || "Cancelación rechazada. El estudiante continuará con la modalidad.");
      setShowRejectModal(false);
      setRejectReason("");
      fetchStudentDetail();
     
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Error rejecting cancellation:", err);
      setMessage("Error al rechazar cancelación: " + getErrorMessage(err));
    }
  };

  // Helper: verifica si los documentos MANDATORY y SECONDARY han sido subidos (igual que el backend)
  const allRequiredDocsUploaded = () => {
    if (!student?.documents || student.documents.length === 0) return false;
    const required = student.documents.filter(d => d.documentType === "MANDATORY" || d.documentType === "SECONDARY");
    if (required.length === 0) return true;
    return required.every(d => d.uploaded);
  };

  // Helper para obtener clase de badge de documento
  const getDocStatusBadgeClass = (status) => {
    if (status?.includes("ACCEPTED")) return "accepted";
    if (status?.includes("REJECTED")) return "rejected";
    if (status?.includes("CORRECTIONS")) return "corrections";
    return "pending";
  };

  // Helper para obtener etiqueta legible del estado del documento
  const getDocStatusLabel = (status) => {
    const labels = {
      PENDING: "Pendiente de revisión",
      ACCEPTED_FOR_PROGRAM_HEAD_REVIEW: "Aceptado por Jefe de Programa",
      REJECTED_FOR_PROGRAM_HEAD_REVIEW: "Rechazado por Jefe de Programa",
      CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD: "Correcciones solicitadas",
      ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW: "Aceptado por Comité",
      REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW: "Rechazado por Comité",
      CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE: "Correcciones solicitadas por Comité",
      CORRECTION_RESUBMITTED: "Corrección reenviada",
    };
    return labels[status] || status;
  };

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return <div className="director-profile-loading">Cargando perfil del estudiante...</div>;
  }

  if (!student) {
    return (
      <div className="director-profile-container">
        <div className="director-profile-message error">
          No se pudo cargar la información del estudiante
        </div>
        <button onClick={() => navigate('/project-director')} className="director-btn-cancel">
          ← Volver al Dashboard
        </button>
      </div>
    );
  }

  // Separar documentos subidos de no subidos
  const uploadedDocs = student.documents?.filter(d => d.uploaded) || [];
  const notUploadedDocs = student.documents?.filter(d => !d.uploaded) || [];

  return (
    <div className="director-profile-container">
      {/* Header */}
      <div className="director-profile-header">
        <div className="director-profile-header-content">
          <button
            onClick={() => navigate('/project-director')}
            className="director-btn-cancel"
            style={{ marginBottom: "1rem" }}
          >
            ← Volver al Dashboard
          </button>
          <h1 className="director-profile-title">Perfil del Estudiante</h1>
          <p className="director-profile-subtitle">{student.studentName}</p>
        </div>
       
        <div className="director-profile-actions">
          {canProposeDefense(student.currentStatus) && (
            <button
              onClick={() => setShowDefenseModal(true)}
              className="director-btn-submit"
              style={{ border: "3px solid #000" }}
            >
              📅 Proponer Sustentación
            </button>
          )}
          {canNotifyExaminers(student.currentStatus) && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
              <button
                onClick={handleNotifyExaminers}
                disabled={notifyingExaminers || !allRequiredDocsUploaded()}
                className="director-btn-submit"
                title={
                  !allRequiredDocsUploaded()
                    ? "El estudiante debe subir todos los documentos obligatorios antes de notificar al jurado"
                    : "Notificar al jurado que la modalidad está lista para defensa"
                }
                style={{
                  background: allRequiredDocsUploaded() ? "#1d4ed8" : "#9ca3af",
                  border: `3px solid ${allRequiredDocsUploaded() ? "#1e3a8a" : "#6b7280"}`,
                  cursor: allRequiredDocsUploaded() ? "pointer" : "not-allowed",
                }}
              >
                {notifyingExaminers ? "⏳ Notificando..." : "🔔 Notificar al Jurado"}
              </button>
              {!allRequiredDocsUploaded() && (
                <small style={{ color: "#dc2626", fontSize: "0.75rem", textAlign: "right" }}>
                  ⚠️ Faltan documentos obligatorios
                </small>
              )}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`director-profile-message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      {/* Alerta de Cancelación */}
      {hasCancellationRequest(student.currentStatus) && (
        <div className="director-alert-warning">
          <h3>⚠️ Solicitud de Cancelación Pendiente</h3>
          <p>
            El estudiante ha solicitado cancelar esta modalidad. Como director de proyecto,
            debes revisar y decidir si apruebas o rechazas esta solicitud.
          </p>
          <div className="director-alert-actions">
            <button
              onClick={handleViewCancellationDocument}
              disabled={loadingCancellationDoc}
              className="btn-view"
            >
              {loadingCancellationDoc ? "⏳ Cargando..." : "📄 Ver Documento de Cancelación"}
            </button>
            <button
              onClick={handleApproveCancellation}
              className="btn-approve"
            >
              ✓ Aprobar Cancelación
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="btn-reject"
            >
              ✕ Rechazar Cancelación
            </button>
          </div>
        </div>
      )}

      {/* Información del Estudiante */}
      <div className="director-profile-card">
        <h3 className="director-profile-card-title">👤 Información del Estudiante</h3>
        <div className="director-profile-grid">
          <div className="director-profile-item">
            <span className="director-profile-label">Nombre Completo</span>
            <span className="director-profile-value">{student.studentName}</span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">Email</span>
            <span className="director-profile-value">{student.studentEmail}</span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">Estado Actual</span>
            <span className={`director-doc-status-badge ${getStatusBadgeClass(student.currentStatus)}`}>
              {getStatusLabel(student.currentStatus)}
            </span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">Última Actualización</span>
            <span className="director-profile-value">{formatDate(student.lastUpdatedAt)}</span>
          </div>
        </div>
       
        {student.currentStatusDescription && (
          <div className="director-profile-description">
            <strong className="director-profile-description-title">
              Descripción del Estado
            </strong>
            <p className="director-profile-description-text">
              {student.currentStatusDescription}
            </p>
          </div>
        )}
      </div>

      {/* Información de la Modalidad */}
      <div className="director-profile-card">
        <h3 className="director-profile-card-title">📚 Información de la Modalidad</h3>
        <div className="director-profile-grid">
          <div className="director-profile-item">
            <span className="director-profile-label">Modalidad de Grado</span>
            <span className="director-profile-value">{student.modalityName}</span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">Programa Académico</span>
            <span className="director-profile-value">{student.academicProgramName}</span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">Facultad</span>
            <span className="director-profile-value">{student.facultyName}</span>
          </div>
          <div className="director-profile-item">
            <span className="director-profile-label">ID de Modalidad</span>
            <span className="director-profile-value">#{student.studentModalityId}</span>
          </div>
        </div>
      </div>

      {/* ✅ SECCIÓN DE DOCUMENTOS - NUEVA Y MEJORADA */}
      {student.documents && student.documents.length > 0 && (
        <div className="director-documents-section">
          <h3 className="director-documents-title">📄 Documentos del Estudiante</h3>
          <div>
            {/* Documentos Subidos */}
            {uploadedDocs.length > 0 && (
              <div className="director-uploaded-docs">
                <h4 className="director-uploaded-title">✅ Documentos Subidos ({uploadedDocs.length})</h4>
                
                <div style={{ overflowX: "auto" }}>
                  <table className="director-docs-table">
                    <thead>
                      <tr>
                        <th>Documento</th>
                        <th>Obligatorio</th>
                        <th>Estado</th>
                        <th>Notas</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedDocs.map((doc, index) => (
                        <tr key={doc.studentDocumentId || index}>
                          <td>
                            <strong className="director-doc-name">{doc.documentName}</strong>
                            {doc.description && (
                              <div className="director-doc-description">{doc.description}</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {doc.documentType === "MANDATORY" ? (
                              <span className="director-doc-mandatory">Sí</span>
                            ) : (
                              <span className="director-doc-optional">No</span>
                            )}
                          </td>
                          <td>
                            <span className={`director-doc-status-badge ${getDocStatusBadgeClass(doc.status)}`}>
                              {getDocStatusLabel(doc.status)}
                            </span>
                          </td>
                          <td>
                            {doc.notes ? (
                              <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                {doc.notes}
                              </span>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                                Sin comentarios
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                              {doc.lastUpdate 
                                ? formatDate(doc.lastUpdate) 
                                : formatDate(doc.uploadDate) || "N/A"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={() => handleViewDocument(doc.studentDocumentId, doc.documentName)}
                              disabled={loadingDoc === doc.studentDocumentId}
                              className="director-doc-btn"
                            >
                              {loadingDoc === doc.studentDocumentId 
                                ? "⏳ Cargando..." 
                                : "Ver Documento"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Documentos NO Subidos */}
            {notUploadedDocs.length > 0 && (
              <>
                <h3 style={{ 
                  marginTop: uploadedDocs.length > 0 ? "1.5rem" : 0, 
                  marginBottom: "1rem", 
                  color: "#dc2626",
                  fontSize: "1.1rem",
                  fontWeight: 600
                }}>
                  ❌ Documentos Pendientes ({notUploadedDocs.length})
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {notUploadedDocs.map((doc, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "1rem",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <strong style={{ display: "block", marginBottom: "0.25rem", color: "#991b1b" }}>
                            {doc.documentName}
                            {doc.documentType === "MANDATORY" && (
                              <span style={{ 
                                marginLeft: "0.5rem",
                                background: "#fef3c7",
                                color: "#92400e",
                                padding: "0.125rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 600
                              }}>
                                Obligatorio
                              </span>
                            )}
                          </strong>
                          {doc.description && (
                            <span style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>
                              {doc.description}
                            </span>
                          )}
                        </div>
                        <span style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>
                          Sin subir
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Historial de Cambios */}
      {student.history && student.history.length > 0 && (
        <div className="director-history-section">
          <h3 className="director-history-title">📋 Historial de Estados</h3>
          <div>
            {student.history.map((history, index) => (
              <div key={index} className="director-history-item">
                <div className="director-history-item-header">
                  <strong className={`director-doc-status-badge ${getStatusBadgeClass(history.status)}`}>
                    {getStatusLabel(history.status)}
                  </strong>
                  <span className="director-history-item-date">
                    {formatDate(history.changeDate)}
                  </span>
                </div>
               
                {history.description && (
                  <p className="director-history-item-description">
                    {history.description}
                  </p>
                )}
               
                {history.observations && (
                  <p className="director-history-item-observations">
                    <strong>Observaciones:</strong> {history.observations}
                  </p>
                )}
               
                {history.responsible && (
                  <p className="director-history-item-responsible">
                    Responsable: {history.responsible}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Proponer Sustentación */}
      {showDefenseModal && (
        <div className="director-modal-overlay" onClick={() => !submitting && setShowDefenseModal(false)}>
          <div className="director-modal" onClick={(e) => e.stopPropagation()}>
            <div className="director-modal-header">
              <h3>📅 Proponer Fecha de Sustentación</h3>
              <button 
                onClick={() => setShowDefenseModal(false)} 
                className="director-modal-close"
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <div className="director-modal-body">
              {successMessage ? (
                <div className="director-success-animation">
                  <div className="director-success-icon">✅</div>
                  <div className="director-success-message">{successMessage}</div>
                  <div className="director-success-submessage">
                    El comité revisará tu propuesta...
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProposeDefense}>
                  {error && <div className="director-profile-message error" style={{padding: "1rem"}}>{error}</div>}

                  <div className="director-form-group">
                    <label className="director-form-label">Fecha y Hora de Sustentación *</label>
                    <input
                      type="datetime-local"
                      value={defenseData.defenseDate}
                      onChange={(e) => {
                        setDefenseData({ ...defenseData, defenseDate: e.target.value });
                        setError("");
                      }}
                      min={today}
                      className="director-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="director-form-group">
                    <label className="director-form-label">Lugar de Sustentación *</label>
                    <input
                      type="text"
                      value={defenseData.defenseLocation}
                      onChange={(e) => {
                        setDefenseData({ ...defenseData, defenseLocation: e.target.value });
                        setError("");
                      }}
                      placeholder="Ej: Auditorio Principal, Sala 302, etc."
                      className="director-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="director-info-box">
                    <p>
                      ℹ️ Esta propuesta será enviada al Comité de Currículo del Programa
                      para su revisión y aprobación.
                    </p>
                  </div>

                  <div className="director-modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowDefenseModal(false)}
                      className="director-btn-cancel"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="director-btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar Propuesta"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar Cancelación */}
      {showRejectModal && (
        <div className="director-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="director-modal" onClick={(e) => e.stopPropagation()}>
            <div className="director-modal-header">
              <h3>✕ Rechazar Solicitud de Cancelación</h3>
              <button onClick={() => setShowRejectModal(false)} className="director-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectCancellation}>
              <div className="director-modal-body">
                <div className="director-form-group">
                  <label className="director-form-label">Motivo del Rechazo *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="director-form-textarea"
                    placeholder="Explica por qué se rechaza la solicitud de cancelación..."
                    rows="5"
                    required
                  />
                  <small className="director-form-small">
                    El estudiante recibirá este mensaje y la modalidad continuará su proceso normal
                  </small>
                </div>
              </div>

              <div style={{ padding: "0 2rem 2rem 2rem", display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowRejectModal(false)} className="director-btn-cancel" style={{flex: 1}}>
                  Cancelar
                </button>
                <button type="submit" className="director-btn-reject" style={{flex: 1}}>
                  Rechazar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDirectorStudentDetail,
  proposeDefenseByDirector,
  notifyReadyForDefense,
  approveModalityCancellationByDirector,
  rejectModalityCancellationByDirector,
  uploadDirectorDocument,
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
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/director/directorStudentProfile.css";
import "../../styles/council/studentprofile.css";

const DISTINCTION_LABELS = {
  NO_DISTINCTION: "Sin Distinción",
  AGREED_APPROVED: "Aprobado (Por Acuerdo)",
  AGREED_MERITORIOUS: "Meritorio (Por Acuerdo)",
  AGREED_LAUREATE: "Laureado (Por Acuerdo)",
  AGREED_REJECTED: "Rechazado (Por Acuerdo)",
  DISAGREEMENT_PENDING_TIEBREAKER: "Desacuerdo - Pendiente de Desempate",
  TIEBREAKER_APPROVED: "Aprobado (Por Desempate)",
  TIEBREAKER_MERITORIOUS: "Meritorio (Por Desempate)",
  TIEBREAKER_LAUREATE: "Laureado (Por Desempate)",
  TIEBREAKER_REJECTED: "Rechazado (Por Desempate)",
  REJECTED_BY_COMMITTEE: "Rechazado por Comité",
};

export default function DirectorStudentProfile() {
  const { studentModalityId } = useParams();
  const navigate = useNavigate();
 
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [loadingCancellationDoc, setLoadingCancellationDoc] = useState(false);
  const [notifyingExaminers, setNotifyingExaminers] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
 
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
  const [confirmAction, setConfirmAction] = useState(null); // { type, title, message, variant }

  const [approvingCancellation, setApprovingCancellation] = useState(false);
  const [rejectingCancellation, setRejectingCancellation] = useState(false);
  const [cancellationMsg, setCancellationMsg] = useState("");
  const [cancellationMsgType, setCancellationMsgType] = useState("");

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

  const scrollToTopNotification = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotifyExaminers = async () => {
    setConfirmAction({
      type: "notifyExaminers",
      title: "Notificar a Jefatura de Programa",
      message: "¿Confirmas que el estudiante ha entregado todos los documentos y quieres notificar a jefatura/coordinación para revisión final? Después de aprobar, jefatura notificará al jurado.",
      variant: "primary",
    });
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
    setApprovingCancellation(true);
    try {
      const response = await approveModalityCancellationByDirector(studentModalityId);
      setCancellationMsg(response.message || "Cancelación aprobada. Será enviada al comité.");
      setCancellationMsgType("success");
      fetchStudentDetail();
      setTimeout(() => { setCancellationMsg(""); setCancellationMsgType(""); }, 5000);
    } catch (err) {
      console.error("Error approving cancellation:", err);
      setCancellationMsg("Error al aprobar cancelación: " + getErrorMessage(err));
      setCancellationMsgType("error");
    } finally {
      setApprovingCancellation(false);
    }
  };

  const executeConfirmAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action.type === "notifyExaminers") {
      setNotifyingExaminers(true);
      try {
        const response = await notifyReadyForDefense(studentModalityId);
        setMessage(response.message || "✅ Jefatura de programa notificada para revisión final. Una vez aprobada, jefatura notificará al jurado.");
        scrollToTopNotification();
        fetchStudentDetail();
        setTimeout(() => setMessage(""), 8000);
      } catch (err) {
        console.error("Error al notificar a jefatura de programa:", err);
        const msg = getErrorMessage(err);
        setMessage("❌ " + msg);
        scrollToTopNotification();
        setTimeout(() => setMessage(""), 8000);
      } finally {
        setNotifyingExaminers(false);
      }
    } else if (action.type === "approveCancellation") {
      setApprovingCancellation(true);
      try {
        const response = await approveModalityCancellationByDirector(studentModalityId);
        setCancellationMsg(response.message || "Cancelación aprobada. Será enviada al comité.");
        setCancellationMsgType("success");
        fetchStudentDetail();
        setTimeout(() => { setCancellationMsg(""); setCancellationMsgType(""); }, 5000);
      } catch (err) {
        console.error("Error approving cancellation:", err);
        setCancellationMsg("Error al aprobar cancelación: " + getErrorMessage(err));
        setCancellationMsgType("error");
      } finally {
        setApprovingCancellation(false);
      }
    }
  };

  const handleRejectCancellation = async (e) => {
    e.preventDefault();
    setRejectingCancellation(true);
    try {
      const response = await rejectModalityCancellationByDirector(studentModalityId, rejectReason);
      setCancellationMsg(response.message || "Cancelación rechazada. El estudiante continuará con la modalidad.");
      setCancellationMsgType("success");
      setShowRejectModal(false);
      setRejectReason("");
      fetchStudentDetail();
      setTimeout(() => { setCancellationMsg(""); setCancellationMsgType(""); }, 5000);
    } catch (err) {
      console.error("Error rejecting cancellation:", err);
      setCancellationMsg("Error al rechazar cancelación: " + getErrorMessage(err));
      setCancellationMsgType("error");
    } finally {
      setRejectingCancellation(false);
    }
  };

  const getRequiredDocumentId = (doc) => {
    const candidates = [
      doc?.requiredDocumentId,
      doc?.requiredDocId,
      doc?.documentId,
      doc?.requiredDocument?.requiredDocumentId,
      doc?.requiredDocument?.id,
      doc?.requiredDocument?.documentId,
      doc?.documentRequirementId,
      doc?.required_document_id,
    ];

    const resolvedId = candidates.find((value) => value !== undefined && value !== null && value !== "") || null;
    console.log("🆔 requiredDocumentId resuelto para documento:", {
      documentName: doc?.documentName,
      candidates,
      resolvedId,
      rawDocument: doc,
    });
    return resolvedId;
  };

  const getUploadControlState = (doc) => {
    const requiredDocumentId = getRequiredDocumentId(doc);
    return {
      requiredDocumentId,
      canUpload: !!requiredDocumentId,
    };
  };

  const handleDirectorFileChange = (requiredDocumentId, file) => {
    console.log("📎 Archivo seleccionado por director:", {
      requiredDocumentId,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });
    setSelectedFiles((prev) => ({
      ...prev,
      [requiredDocumentId]: file,
    }));
  };

  const handleDirectorUpload = async (doc) => {
    const requiredDocumentId = getRequiredDocumentId(doc);
    console.log("🚀 Intentando subir documento desde director:", {
      studentModalityId,
      documentName: doc?.documentName,
      requiredDocumentId,
      selectedFile: selectedFiles[requiredDocumentId],
      document: doc,
    });

    if (!requiredDocumentId) {
      console.warn("⛔ No se pudo subir porque no existe requiredDocumentId para:", doc);
      setMessage("No se encontró el identificador del documento requerido.");
      setTimeout(() => setMessage(""), 6000);
      return;
    }

    const file = selectedFiles[requiredDocumentId];
    if (!file) {
      console.warn("⛔ No se pudo subir porque no hay archivo seleccionado para requiredDocumentId:", requiredDocumentId);
      setMessage("Debes seleccionar un archivo antes de subirlo.");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    setUploadingDocId(requiredDocumentId);
    try {
      const response = await uploadDirectorDocument(studentModalityId, requiredDocumentId, file);
      setMessage(response.message || `Documento \"${doc.documentName}\" cargado correctamente.`);
      setSelectedFiles((prev) => ({ ...prev, [requiredDocumentId]: null }));
      await fetchStudentDetail();
      setTimeout(() => setMessage(""), 8000);
    } catch (err) {
      console.error("Error uploading document as director:", err);
      setMessage(`Error al subir \"${doc.documentName}\": ${getErrorMessage(err)}`);
      setTimeout(() => setMessage(""), 8000);
    } finally {
      setUploadingDocId(null);
    }
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
      ACCEPTED_FOR_EXAMINER_REVIEW: "Aceptado por Jurado",
      REJECTED_FOR_EXAMINER_REVIEW: "Rechazado por Jurado",
      CORRECTIONS_REQUESTED_BY_EXAMINER: "Correcciones solicitadas por Jurado",
      EDIT_REQUESTED: "Edición solicitada por estudiante",
      EDIT_REQUEST_APPROVED: "Solicitud de edición aprobada",
      EDIT_REQUEST_REJECTED: "Solicitud de edición rechazada",
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
          <h1 className="director-profile-title">Perfil del Estudiante</h1>
          <p className="director-profile-subtitle">Información completa sobre el estudiante, su progreso académico, modalidad de grado y estado de sus documentos.</p>
          <div className="director-profile-actions">
            <button
              onClick={() => navigate('/project-director')}
              className="director-btn-cancel"
            >
              ← Volver al Dashboard
            </button>
            <span className={`director-doc-status-badge ${getStatusBadgeClass(student.currentStatus)}`}>
              {getStatusLabel(student.currentStatus)}
            </span>
          </div>
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
        <div className="director-profile-message" style={{ background: '#fffbe6', borderLeft: '5px solid #B7A873', color: '#92400e' }}>
          ⚠️ Este estudiante tiene una solicitud de cancelación pendiente. Revisa la sección de cancelación más abajo.
        </div>
      )}

      {/* Información del Estudiante */}
      <div className="student-info-card">
        <h3 className="card-section-title"> Información del Estudiante</h3>
        {Array.isArray(student.members) && student.members.length > 0 ? (
          <div className="student-group-list">
            {student.members.map((member, idx) => (
              <div
                className="student-group-member-block"
                key={member.studentCode || idx}
                style={{
                  marginBottom: "2rem",
                  padding: "1.5rem",
                  border: "2px solid #7A1117",
                  borderRadius: "16px",
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(122,17,23,0.08)",
                }}
              >
                <h4 style={{
                  color: "#7A1117",
                  marginBottom: "1rem",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  letterSpacing: "0.02em",
                }}>
                  Estudiante {idx + 1}
                </h4>
                <div className="student-info-grid">
                  <div className="student-info-item">
                    <span className="student-info-label">Nombre Completo</span>
                    <span className="student-info-value">
                      {member.studentName} {member.studentLastName}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Correo institucional</span>
                    <span className="student-info-value">
                      {member.studentEmail}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Código Estudiantil</span>
                    <span className="student-info-value">
                      {member.studentCode || "N/A"}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Programa Académico</span>
                    <span className="student-info-value">
                      {student.academicProgramName}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Facultad</span>
                    <span className="student-info-value">
                      {student.facultyName}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Créditos Aprobados</span>
                    <span className="student-info-value">
                      {member.approvedCredits || "N/A"}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Promedio Ponderado Actual</span>
                    <span className="student-info-value">
                      {member.gpa || "N/A"}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Semestre Cursado</span>
                    <span className="student-info-value">
                      {member.semester || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="student-info-grid">
            <div className="student-info-item">
              <span className="student-info-label">Nombre Completo</span>
              <span className="student-info-value">
                {student.studentName} {student.studentLastName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Correo Institucional</span>
              <span className="student-info-value email">
                {student.studentEmail}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Código Estudiantil</span>
              <span className="student-info-value">
                {student.studentCode || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Programa Académico</span>
              <span className="student-info-value">
                {student.academicProgramName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Facultad</span>
              <span className="student-info-value">
                {student.facultyName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Créditos Aprobados</span>
              <span className="student-info-value">
                {student.approvedCredits || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Promedio Ponderado</span>
              <span className="student-info-value">
                {student.gpa || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Semestre Cursado</span>
              <span className="student-info-value">
                {student.semester || "N/A"}
              </span>
            </div>
          </div>
        )}
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
      <div className="student-info-card">
        <h3 className="card-section-title"> Información de la Modalidad</h3>
        <div className="student-info-grid">
          <div className="student-info-item">
            <span className="student-info-label">Modalidad</span>
            <span className="student-info-value">{student.modalityName}</span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Estado Actual</span>
            <span className={`student-info-value ${student.currentStatus === "MODALITY_CLOSED" ? "closed" : ""}`}>
              {student.currentStatus === "MODALITY_CLOSED" && "🔒 "}{student.currentStatusDescription}
            </span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Última Actualización</span>
            <span className="student-info-value">
              {student.lastUpdatedAt
                ? new Date(student.lastUpdatedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
                : "N/A"}
            </span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Créditos Requeridos</span>
            <span className="student-info-value">{student.creditsRequired || "N/A"}</span>
          </div>
          {student.projectDirectorName && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Director de Proyecto</span>
                <span className="student-info-value">{student.projectDirectorName}</span>
              </div>
              <div className="student-info-item">
                <span className="student-info-label">Email del Director</span>
                <span className="student-info-value">{student.projectDirectorEmail}</span>
              </div>
            </>
          )}
          {student.defenseDate && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Fecha de Sustentación</span>
                <span className="student-info-value">
                  {new Date(student.defenseDate).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })}
                </span>
              </div>
              <div className="student-info-item">
                <span className="student-info-label">Lugar de Sustentación</span>
                <span className="student-info-value">{student.defenseLocation || "N/A"}</span>
              </div>
            </>
          )}
          {student.academicDistinction && (
            <div className="student-info-item">
              <span className="student-info-label">Resultado</span>
              <span className="student-info-value distinction">{DISTINCTION_LABELS[student.academicDistinction] || student.academicDistinction}</span>
            </div>
          )}
        </div>
      </div>


      {/* ✅ SECCIÓN DE DOCUMENTOS - NUEVA Y MEJORADA */}
      {student.documents && student.documents.length > 0 && (
        <div className="director-documents-section">
          <h3 className="director-documents-title"> Documentos del Estudiante</h3>
          <div>
            {/* Documentos Subidos */}
            {uploadedDocs.length > 0 && (
              <div className="director-uploaded-docs">
                <h4 className="director-uploaded-title" style={{ color: '#5d0d12' }}> Documentos Subidos ({uploadedDocs.length})</h4>
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
                        <tr key={doc.studentDocumentId || getRequiredDocumentId(doc) || index}>
                          <td>
                            <strong className="director-doc-name" style={{ color: '#5d0d12' }}>{doc.documentName}</strong>
                            {doc.description && (
                              <div className="director-doc-description" style={{ color: '#B7A873' }}>{doc.description}</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {doc.documentType === "MANDATORY" ? (
                              <span className="director-doc-mandatory" style={{ background: '#B7A873', color: '#5d0d12' }}>Sí</span>
                            ) : (
                              <span className="director-doc-optional" style={{ background: '#D5CBA0', color: '#5d0d12' }}>No</span>
                            )}
                          </td>
                          <td>
                            <span className={`director-doc-status-badge ${getDocStatusBadgeClass(doc.status)}`}>
                              {getDocStatusLabel(doc.status)}
                            </span>
                          </td>
                          <td>
                            {doc.notes ? (
                              <span style={{ fontSize: "0.875rem", color: '#5d0d12', fontWeight: 600 }}>
                                {doc.notes}
                              </span>
                            ) : (
                              <span style={{ color: '#B7A873', fontSize: "0.875rem", fontWeight: 600 }}>
                                Sin comentarios
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "0.875rem", color: '#5d0d12', fontWeight: 600 }}>
                              {doc.lastUpdate 
                                ? formatDate(doc.lastUpdate) 
                                : formatDate(doc.uploadDate) || "N/A"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {(() => {
                              const uploadState = getUploadControlState(doc);
                              return (
                            <div className="director-doc-actions">
                              <button
                                onClick={() => handleViewDocument(doc.studentDocumentId, doc.documentName)}
                                disabled={loadingDoc === doc.studentDocumentId}
                                className="director-doc-btn"
                              >
                                {loadingDoc === doc.studentDocumentId
                                  ? "⏳ Cargando..."
                                  : "Ver Documento"}
                              </button>

                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="director-doc-file-input"
                                onChange={(e) => handleDirectorFileChange(uploadState.requiredDocumentId, e.target.files?.[0] || null)}
                                disabled={!uploadState.canUpload}
                              />
                              <button
                                onClick={() => handleDirectorUpload(doc)}
                                disabled={
                                  !uploadState.canUpload ||
                                  (uploadState.canUpload && uploadingDocId === uploadState.requiredDocumentId) ||
                                  !selectedFiles[uploadState.requiredDocumentId]
                                }
                                className="director-doc-upload-btn"
                              >
                                {uploadState.canUpload && uploadingDocId === uploadState.requiredDocumentId
                                  ? "⏳ Subiendo..."
                                  : "Subir/Actualizar"}
                              </button>
                              {!uploadState.canUpload && (
                                <small className="director-doc-upload-hint">
                                  Falta requiredDocumentId en la respuesta del backend para este documento.
                                </small>
                              )}
                            </div>
                              );
                            })()}
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
                  color: '#5d0d12',
                  fontSize: "1.1rem",
                  fontWeight: 700
                }}>
                   Documentos Pendientes ({notUploadedDocs.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {notUploadedDocs.map((doc, index) => (
                    <div
                      key={getRequiredDocumentId(doc) || doc.documentName || index}
                      style={{
                        padding: "1rem",
                        background: '#f8f6ef',
                        border: '1px solid #D5CBA0',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <strong style={{ display: "block", marginBottom: "0.25rem", color: '#5d0d12', fontWeight: 700 }}>
                            {doc.documentName}
                            {doc.documentType === "MANDATORY" && (
                              <span style={{ 
                                marginLeft: "0.5rem",
                                background: '#B7A873',
                                color: '#5d0d12',
                                padding: "0.125rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 700
                              }}>
                                Obligatorio
                              </span>
                            )}
                          </strong>
                          {doc.description && (
                            <span style={{ fontSize: "0.875rem", color: '#B7A873', fontWeight: 600 }}>
                              {doc.description}
                            </span>
                          )}
                        </div>
                        <span style={{
                          background: '#D5CBA0',
                          color: '#5d0d12',
                          padding: "0.25rem 0.75rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}>
                          Sin subir
                        </span>
                      </div>

                      {(() => {
                        const uploadState = getUploadControlState(doc);
                        return (
                          <div className="director-pending-upload-row">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="director-doc-file-input"
                              onChange={(e) => handleDirectorFileChange(uploadState.requiredDocumentId, e.target.files?.[0] || null)}
                              disabled={!uploadState.canUpload}
                            />
                            <button
                              onClick={() => handleDirectorUpload(doc)}
                              disabled={
                                !uploadState.canUpload ||
                                (uploadState.canUpload && uploadingDocId === uploadState.requiredDocumentId) ||
                                !selectedFiles[uploadState.requiredDocumentId]
                              }
                              className="director-doc-upload-btn"
                            >
                              {uploadState.canUpload && uploadingDocId === uploadState.requiredDocumentId
                                ? "⏳ Subiendo..."
                                : "Subir Documento"}
                            </button>
                            {!uploadState.canUpload && (
                              <small className="director-doc-upload-hint">
                                Falta requiredDocumentId en la respuesta del backend para este documento.
                              </small>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Botón y mensaje de notificación a jefatura/coordinación */}
            {canNotifyExaminers(student.currentStatus) && (
              <div className="director-notify-section" style={{marginTop: '2rem'}}>
                <div className="director-notify-info-box" style={{background:'#f8f6ef',borderLeft:'4px solid #1d4ed8',borderRadius:'8px',padding:'0.8rem 1.2rem',marginBottom:'0.7rem'}}>
                  <span style={{color:'#5d0d12',fontWeight:'600',fontSize:'0.9rem'}}>
                    <strong>Nota:</strong>Al notificar en este paso, la modalidad pasa primero a revisión final de jefatura/coordinación. Cuando jefatura valide y apruebe los documentos finales, notificará formalmente al jurado para continuar con el proceso hacia la sustentación.
                  </span>
                </div>
                <button
                  onClick={handleNotifyExaminers}
                  disabled={notifyingExaminers}
                  className={`director-btn-submit director-notify-btn ${notifyingExaminers ? "loading" : ""}`}
                  title="Notificar a jefatura/coordinación para revisión final previa a la notificación al jurado"
                >
                  {notifyingExaminers ? "⏳ Notificando..." : "Notificar a Jefatura/Coordinador"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

        {hasCancellationRequest(student.currentStatus) && (
        <div className="director-alert-warning">
          <h3> Solicitud de Cancelación Pendiente</h3>
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
              disabled={approvingCancellation}
            >
              {approvingCancellation ? "⏳ Enviando solicitud de cancelación..." : "✓ Aprobar Cancelación"}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="btn-reject"
              disabled={rejectingCancellation}
            >
              {rejectingCancellation ? "⏳ Rechazando solicitud..." : "✕ Rechazar Cancelación"}
            </button>
          </div>
          {(approvingCancellation || rejectingCancellation) && (
            <div className="director-profile-message" style={{marginTop:'1rem',background:'#fffbe6',color:'#92400e',borderLeft:'5px solid #B7A873'}}>
              {approvingCancellation && "Enviando solicitud de cancelación al sistema..."}
              {rejectingCancellation && "Rechazando solicitud de cancelación..."}
            </div>
          )}
          {cancellationMsg && (
            <div className={`director-profile-message ${cancellationMsgType}`} style={{marginTop:'1rem'}}>
              {cancellationMsg}
              <button onClick={() => setCancellationMsg("")} style={{marginLeft:'1rem'}}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN INSTITUCIONAL: PROPONER SUSTENTACIÓN */}
      {canProposeDefense(student.currentStatus) && (
        <div className="director-propose-defense-section" style={{margin: '2.5rem 0 1.5rem 0'}}>
          <h3 className="director-documents-title" style={{marginBottom: '1.2rem'}}>Proponer Sustentación</h3>
          <div className="director-propose-defense-block">
            <div className="director-propose-defense-header">
              <span className="director-propose-defense-icon"></span>
              <span className="director-propose-defense-title">Proponer Sustentación</span>
            </div>
            <div className="director-propose-defense-message">
              <span style={{fontWeight:700, color:'#5d0d12'}}>¡Todo el jurado ha aprobado los documentos!</span><br/>
              Ya puedes programar la sustentación de la modalidad.<br/>
              <span style={{color:'#7A1117', fontWeight:600}}>Recuerda:</span> Antes de asignar la fecha y lugar, asegúrate de haber coordinado con el jurado y el estudiante.<br/>
              <span style={{color:'#92400e'}}>No olvides realizar los trámites administrativos necesarios para la programación oficial.</span>
            </div>
            <button
              onClick={() => setShowDefenseModal(true)}
              className="director-propose-defense-btn"
            >
              📅 Asignar Sustentación
            </button>
          </div>
        </div>
      )}
        <button
            onClick={() => navigate('/project-director')}
            className="director-btn-cancel"
            style={{ marginBottom: "1rem" }}
          >
            ← Volver al Dashboard
          </button>

      {/* Historial de Cambios */}
      {student.history && student.history.length > 0 && (
        <div className="director-history-section">
          <h3 className="director-history-title" style={{ color: '#5d0d12', fontSize: '1.45rem', borderBottom: '3px solid #B7A873' }}> Historial de Estados</h3>
          <div>
            {student.history.map((history, index) => (
              <div
                key={index}
                className="director-history-item"
                style={{
                  borderLeft: `4px solid ${getStatusBadgeClass(history.status) === 'accepted' ? '#B7A873' : '#5d0d12'}`,
                  background: '#f8f6ef',
                  boxShadow: '0 2px 8px rgba(93, 13, 18, 0.08)',
                  marginBottom: '1.2rem',
                  borderRadius: '12px',
                  padding: '1.2rem 1rem',
                }}
              >
                <div className="director-history-item-header">
                  <strong className={`director-doc-status-badge ${getStatusBadgeClass(history.status)}`} style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {getStatusLabel(history.status)}
                  </strong>
                  <span className="director-history-item-date" style={{ color: '#B7A873', fontWeight: 600 }}>
                    {formatDate(history.changeDate)}
                  </span>
                </div>
                {history.description && (
                  <p className="director-history-item-description" style={{ color: '#7A1117', fontWeight: 600 }}>
                    {history.description}
                  </p>
                )}
                {history.observations && (
                  <p className="director-history-item-observations" style={{ background: '#fffbe6', color: '#92400e', borderLeft: '4px solid #B7A873', fontWeight: 600 }}>
                    <strong style={{ color: '#5d0d12' }}>Observaciones:</strong> {history.observations}
                  </p>
                )}
                {history.responsible && (
                  <p className="director-history-item-responsible" style={{ color: '#7A1117', fontWeight: 600 }}>
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
              <h3>📅 Asignar Sustentación</h3>
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
                    Sustentación programada exitosamente. Este mensaje se cerrará automáticamente.
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
                      La fecha programada para la sustentación no podrá ser modificada una vez registrada en el sistema. Antes de confirmarla, asegúrate de que el jurado, el estudiante y las demás personas involucradas hayan sido debidamente informados y cuenten con disponibilidad para asistir.
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
                      {submitting ? "Enviando..." : "Programar Sustentación"}
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

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmText="Sí, confirmar"
        cancelText="Cancelar"
        variant={confirmAction?.variant || "primary"}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStudentModalityProfile,
  reviewDocument,
  approveProgramhead,
  approveFinalAndNotifyExaminers,
  getDocumentBlobUrl,
  getStatusLabel,
  getStatusBadgeClass,
} from "../../services/programsheadService";
import { getErrorMessage } from "../../utils/errorUtils";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/programhead/programheadprofile.css";

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

export default function StudentProfileProgramHead() {
  const { studentModalityId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviewingDocId, setReviewingDocId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotifyExaminersModal, setShowNotifyExaminersModal] = useState(false);
  const [notifyingExaminers, setNotifyingExaminers] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [studentModalityId]);

  const fetchProfile = async () => {
    try {
      const res = await getStudentModalityProfile(studentModalityId);
      console.log("RESPUESTA BACKEND:", res);
      setProfile(res);
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "No se pudo cargar la información del estudiante")
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToTopNotification = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewDocument = async (studentDocumentId) => {
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
      setError(getErrorMessage(err, "Error al cargar el documento"));
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleReviewDocument = async (studentDocumentId) => {
    if (!selectedStatus) {
      setError("Por favor selecciona un estado");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!notes.trim()) {
      setError("Por favor agrega un comentario");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await reviewDocument(studentDocumentId, {
        status: selectedStatus,
        notes: notes.trim(),
      });

      setSuccessMessage("Documento revisado exitosamente");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccessMessage(""), 5000);

      await fetchProfile();

      setReviewingDocId(null);
      setSelectedStatus("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Error al revisar el documento"));
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAll = async () => {
    const mandatoryDocs = profile.documents.filter(d => d.documentType === "MANDATORY");
    const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
    const allMandatoryAccepted = uploadedMandatory.every(
      (d) => d.status === "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW"
    );

    if (uploadedMandatory.length < mandatoryDocs.length) {
      setError("El estudiante debe cargar todos los documentos obligatorios");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (!allMandatoryAccepted) {
      setError("Debes aceptar todos los documentos obligatorios antes de enviar al Comité");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeApproveAll = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      await approveProgramhead(studentModalityId);
      setSuccessMessage("Estudiante enviado al Comité de Currículo de Programa exitosamente");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Error al enviar al Comité"));
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };


  const executeNotifyExaminers = async () => {
    setShowNotifyExaminersModal(false);
    setNotifyingExaminers(true);
    try {
      await approveFinalAndNotifyExaminers(studentModalityId);
      setSuccessMessage("Jurado notificado exitosamente. La modalidad avanza al proceso de revisión final por el jurado.");
      scrollToTopNotification();
      setTimeout(() => setSuccessMessage(""), 8000);
      await fetchProfile();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Error al notificar al jurado"));
      scrollToTopNotification();
      setTimeout(() => setError(""), 5000);
    } finally {
      setNotifyingExaminers(false);
    }
  };
  // Helper para determinar si un documento puede ser editado
  const canEditDocument = (doc) => {
    return doc.status !== "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW";
  };

  // Helper para obtener clase de badge
  const getStatusBadgeClass = (status) => {
    if (status === "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW") return "accepted";
    if (status === "REJECTED_FOR_PROGRAM_HEAD_REVIEW") return "rejected";
    if (status === "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD") return "corrections";
    return "pending";
  };

  // Helper para obtener etiqueta legible del estado
  const getStatusLabel = (status) => {
    const statusLabels = {
      // ========== SELECCIÓN Y REVISIÓN INICIAL ========== 
      "MODALITY_SELECTED": "Modalidad seleccionada",
      "UNDER_REVIEW_PROGRAM_HEAD": "En revisión por Jefe de Programa",
      "CORRECTIONS_REQUESTED_PROGRAM_HEAD": "Correcciones solicitadas por Jefe de Programa",
      "CORRECTIONS_SUBMITTED": "Correcciones enviadas",
      "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD": "Correcciones enviadas a Jefe de Programa",
      "CORRECTIONS_SUBMITTED_TO_COMMITTEE": "Correcciones enviadas a Comité",
      "CORRECTIONS_SUBMITTED_TO_EXAMINERS": "Correcciones enviadas a Jurado",
      "CORRECTIONS_APPROVED": "Correcciones aprobadas",
      "CORRECTIONS_REJECTED_FINAL": "Correcciones rechazadas (final)",

      // ========== REVISIÓN DE COMITÉ ========== 
      "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE": "Listo para Comité de Currículo",
      "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE": "En revisión por Comité de Currículo",
      "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE": "Correcciones solicitadas por Comité de Currículo",
      "READY_FOR_DIRECTOR_ASSIGNMENT": "Listo para asignación de Director",
      "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE": "Listo para aprobación por Comité de Currículo",
      "PROPOSAL_APPROVED": "Propuesta aprobada",

      // ========== PROGRAMACIÓN DE SUSTENTACIÓN ========== 
      "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR": "Sustentación solicitada por Director",
      "DEFENSE_SCHEDULED": "Sustentación programada",

      // ========== ASIGNACIÓN DE JURADO (NUEVO) ========== 
      "EXAMINERS_ASSIGNED": "Jurado asignado",
      "READY_FOR_EXAMINERS": "Listo para jurado",
      "PENDING_PROGRAM_HEAD_FINAL_REVIEW": "Pendiente de revisión final por jefatura",
      "DOCUMENTS_APPROVED_BY_EXAMINERS": "Documentos aprobados por jurado",
      "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS": "Documentos secundarios aprobados por jurado",
      "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED": "Revisión de documento requiere desempate",
      "CORRECTIONS_REQUESTED_EXAMINERS": "Correcciones solicitadas por jurado",
      "READY_FOR_DEFENSE": "Listo para sustentación",
      "FINAL_REVIEW_COMPLETED": "Revisión final completada",

      // ========== SUSTENTACIÓN Y EVALUACIÓN ========== 
      "DEFENSE_COMPLETED": "Sustentación realizada",
      "UNDER_EVALUATION_PRIMARY_EXAMINERS": "En evaluación por jurado principal",
      "DISAGREEMENT_REQUIRES_TIEBREAKER": "Desacuerdo, requiere jurado de desempate",
      "UNDER_EVALUATION_TIEBREAKER": "En evaluación por jurado de desempate",
      "EVALUATION_COMPLETED": "Evaluación completada",

      // ========== RESULTADO FINAL ========== 
      "GRADED_APPROVED": "Aprobado",
      "GRADED_FAILED": "Reprobado",
      "MODALITY_CLOSED": "Modalidad cancelada",
      "SEMINAR_CANCELED": "Diplomado cancelado",

      // ========== CANCELACIONES ========== 
      "MODALITY_CANCELLED": "Modalidad cancelada",
      "CANCELLATION_REQUESTED": "Cancelación solicitada",
      "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR": "Cancelación aprobada por Director",
      "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR": "Cancelación rechazada por Director",
      "CANCELLED_WITHOUT_REPROVAL": "Cancelado sin reprobación",
      "CANCELLATION_REJECTED": "Cancelación rechazada",
      "CANCELLED_BY_CORRECTION_TIMEOUT": "Cancelado por tiempo de corrección",
      "EDIT_REQUESTED_BY_STUDENT": "Edición solicitada por estudiante",

      // ========== ESTADOS ANTERIORES Y GENERALES ========== 
      "PENDING": "Pendiente",
      "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW": "Aceptado",
      "REJECTED_FOR_PROGRAM_HEAD_REVIEW": "Rechazado",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD": "Correcciones solicitadas",
      "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW": "Aceptado por Comité",
      "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW": "Rechazado por Comité",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "Correcciones solicitadas por Comité",
      "CORRECTION_RESUBMITTED": "Corrección reenviada",
      "ACCEPTED_FOR_EXAMINER_REVIEW": "Aceptado por Jurado",
      "REJECTED_FOR_EXAMINER_REVIEW": "Rechazado por Jurado",
      "CORRECTIONS_REQUESTED_BY_EXAMINER": "Correcciones solicitadas por Jurado",
      "EDIT_REQUESTED": "Edición solicitada por estudiante",
      "EDIT_REQUEST_APPROVED": "Solicitud de edición aprobada",
      "EDIT_REQUEST_REJECTED": "Solicitud de edición rechazada",
    };
    return statusLabels[status] || status;
  };

  if (loading) {
    return (
      <div className="student-profile-loading">
        Cargando perfil del estudiante...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="student-profile-error">
        <p>{error}</p>
        <button onClick={() => navigate("/jefeprograma")} className="back-btn">
          ← Volver al listado
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="student-profile-no-data">
        No hay información disponible
      </div>
    );
  }

  const mandatoryDocs = profile.documents.filter(d => d.documentType === "MANDATORY");
  const uploadedDocs = profile.documents.filter((d) => d.uploaded);
  const activeReviewDoc = uploadedDocs.find((d) => d.studentDocumentId === reviewingDocId) || null;
  const showReviewPanel = !!activeReviewDoc && canEditDocument(activeReviewDoc);
  const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
  const allMandatoryAccepted = uploadedMandatory.every(
    (d) => d.status === "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW"
  );
  const COMMITTEE_SEND_ALLOWED_STATUSES = [
    "MODALITY_SELECTED",
    "UNDER_REVIEW_PROGRAM_HEAD",
    "CORRECTIONS_REQUESTED_PROGRAM_HEAD",
    "CORRECTIONS_SUBMITTED",
    "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD",
    "CORRECTIONS_APPROVED",
  ];
  const canShowSendToCommitteeButton = COMMITTEE_SEND_ALLOWED_STATUSES.includes(profile.currentStatus);
  const modalityHistory = Array.isArray(profile.history) ? profile.history : [];

  return (
    <div className="student-profile-container">
      {/* Header */}
      <div className="student-profile-header">
        <h2 className="student-profile-title">Perfil del Estudiante</h2>
        <p className="student-profile-subtitle">
          Revisa y aprueba los documentos de la modalidad de grado, verificando que cumplan con los requisitos académicos y lineamientos establecidos antes de emitir tu concepto.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert-message error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="alert-close">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert-message success">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="alert-close">✕</button>
          <div style={{ marginTop: "0.75rem" }}>
            <button
              onClick={() => navigate("/jefeprograma")}
              className="back-btn"
            >
              ← Volver al listado
            </button>
          </div>
        </div>
      )}

      {/* Student Info Card - EXPANDIDA */}
      <div className="student-info-card">
        <h3 className="card-section-title"> Información del Estudiante</h3>
        {/* Si hay miembros, mostrar todos; si no, mostrar el estudiante principal */}
        {Array.isArray(profile.members) && profile.members.length > 0 ? (
          <div className="student-group-list">
            {profile.members.map((member, idx) => (
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
                    <span className="student-info-value email">
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
                      {profile.academicProgramName}
                    </span>
                  </div>
                  <div className="student-info-item">
                    <span className="student-info-label">Facultad</span>
                    <span className="student-info-value">
                      {profile.facultyName}
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
                {profile.studentName} {profile.studentLastName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Email</span>
              <span className="student-info-value email">
                {profile.studentEmail}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Código Estudiantil</span>
              <span className="student-info-value">
                {profile.studentCode || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Programa Académico</span>
              <span className="student-info-value">
                {profile.academicProgramName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Facultad</span>
              <span className="student-info-value">
                {profile.facultyName}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Créditos Aprobados</span>
              <span className="student-info-value">
                {profile.approvedCredits || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Promedio (GPA)</span>
              <span className="student-info-value">
                {profile.gpa || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Semestre</span>
              <span className="student-info-value">
                {profile.semester || "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modality Info Card */}
      <div className="student-info-card">
        <h3 className="card-section-title"> Información de la Modalidad</h3>
        <div className="student-info-grid">
          <div className="student-info-item">
            <span className="student-info-label">Modalidad</span>
            <span className="student-info-value">{profile.modalityName}</span>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">Estado Actual</span>
            <span className="student-info-value">
              {getStatusLabel(profile.currentStatus) || profile.currentStatusDescription}
            </span>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">Última Actualización</span>
            <span className="student-info-value">
              {profile.lastUpdatedAt 
                ? new Date(profile.lastUpdatedAt).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}
            </span>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">Créditos Requeridos</span>
            <span className="student-info-value">
              {profile.creditsRequired || "N/A"}
            </span>
          </div>

          {profile.projectDirectorName && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Director de Proyecto</span>
                <span className="student-info-value">
                  {profile.projectDirectorName}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Email del Director</span>
                <span className="student-info-value email">
                  {profile.projectDirectorEmail}
                </span>
              </div>
            </>
          )}

          {profile.defenseDate && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Fecha de Sustentación</span>
                <span className="student-info-value">
                  {new Date(profile.defenseDate).toLocaleString("es-CO", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Lugar de Sustentación</span>
                <span className="student-info-value">
                  {profile.defenseLocation || "N/A"}
                </span>
              </div>
            </>
          )}

          {profile.academicDistinction && (
            <div className="student-info-item">
              <span className="student-info-label">Resultado</span>
              <span className="student-info-value distinction">
                {DISTINCTION_LABELS[profile.academicDistinction] || profile.academicDistinction}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section - SOLO DOCUMENTOS CARGADOS */}
      <div className="documents-section">
        <h3 className="documents-section-title"> Documentos</h3>

        {uploadedDocs.length === 0 ? (
          <div className="documents-empty">
            <div className="documents-empty-icon"></div>
            <p className="documents-empty-text">
              El estudiante aún no ha cargado documentos
            </p>
          </div>
        ) : (
          <>
            <div className="documents-table-wrapper">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Obligatorio</th>
                    <th>Estado</th>
                    <th>Notas</th>
                    <th>Última actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedDocs.map((doc) => (
                    <tr key={doc.studentDocumentId || doc.documentName}>
                      <td>
                        <strong>{doc.documentName}</strong>
                      </td>
                      <td>
                        <span className={`mandatory-badge ${doc.documentType === "MANDATORY" ? "yes" : "no"}`}>
                          {doc.documentType === "MANDATORY" ? "Sí" : "No"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`doc-status-badge ${getStatusBadgeClass(
                            doc.status
                          )}`}
                        >
                          {getStatusLabel(doc.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`doc-notes ${!doc.notes ? "empty" : ""}`}>
                          {doc.notes || "Sin comentarios"}
                        </span>
                      </td>
                      <td>
                        <span className="doc-date">
                          {doc.lastUpdate
                            ? new Date(doc.lastUpdate).toLocaleString("es-CO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "-"}
                        </span>
                      </td>
                      <td>
                        <div className="doc-actions">
                          <button
                            onClick={() =>
                              handleViewDocument(doc.studentDocumentId)
                            }
                            disabled={loadingDoc === doc.studentDocumentId}
                            className={`doc-btn doc-btn-view ${
                              loadingDoc === doc.studentDocumentId
                                ? "loading"
                                : ""
                            }`}
                          >
                            {loadingDoc === doc.studentDocumentId
                              ? "Cargando..."
                              : "Ver documento"}
                          </button>

                          {canEditDocument(doc) ? (
                            <button
                              onClick={() => {
                                if (reviewingDocId === doc.studentDocumentId) {
                                  setReviewingDocId(null);
                                  setSelectedStatus("");
                                  setNotes("");
                                } else {
                                  setReviewingDocId(doc.studentDocumentId);
                                  setSelectedStatus("");
                                  setNotes("");
                                }
                              }}
                              className={`doc-btn ${
                                reviewingDocId === doc.studentDocumentId
                                  ? "doc-btn-cancel"
                                  : "doc-btn-review"
                              }`}
                            >
                              {reviewingDocId === doc.studentDocumentId
                                ? "Cancelar"
                                : "Cambiar estado"}
                            </button>
                          ) : (
                            <span className="locked-badge">
                              🔒 Aprobado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showReviewPanel && (
              <div className="review-panel">
                <h4 className="review-panel-title">
                  <span style={{
                    color: '#7A1117',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', flexShrink: 0}}>
                      <circle cx="12" cy="12" r="12" fill="#7A1117"/>
                      <path d="M8 12.5L11 15.5L16 10.5" stroke="#D5CBA0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Revisión de documento — {activeReviewDoc.documentName}</span>
                  </span>
                </h4>

                <div className="review-form-group">
                  <label className="review-label">
                    <span style={{color:'#7A1117', fontWeight:900}}>Nuevo estado:</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="review-select"
                    style={{borderColor: '#7A1117', fontWeight:700, color:'#7A1117'}}
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="ACCEPTED_FOR_PROGRAM_HEAD_REVIEW">
                      ✅ Aceptado
                    </option>
                    <option value="CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD">
                      🔄 Requiere correcciones
                    </option>
                  </select>
                </div>

                <div className="review-form-group">
                  <label className="review-label">
                    <span style={{color:'#7A1117', fontWeight:900}}>Comentario:</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="review-textarea"
                    placeholder="Justifica tu decisión de manera clara y profesional..."
                    rows={4}
                    style={{borderColor:'#7A1117', fontWeight:600, color:'#1a1a2e'}}
                  />
                </div>

                <button
                  onClick={() => handleReviewDocument(activeReviewDoc.studentDocumentId)}
                  disabled={submitting}
                  className="review-submit-btn"
                  style={{
                    background: submitting ? '#9e9e9e' : 'linear-gradient(135deg, #7A1117 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    border: 'none',
                    boxShadow: '0 3px 8px rgba(122,17,23,0.15)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {submitting ? "Guardando..." : "Guardar revisión"}
                </button>
              </div>
            )}

            {/* Approve All Section */}
            {canShowSendToCommitteeButton && (
              <div className="approve-all-section">
                <div className="approve-all-content">
                  <button
                    onClick={handleApproveAll}
                    disabled={!allMandatoryAccepted || submitting || uploadedMandatory.length < mandatoryDocs.length}
                    className={`approve-all-btn ${
                      allMandatoryAccepted && uploadedMandatory.length === mandatoryDocs.length ? "enabled" : "disabled"
                    }`}
                    style={
                      allMandatoryAccepted && uploadedMandatory.length === mandatoryDocs.length
                        ? {
                            background: 'linear-gradient(135deg, #7A1117 0%, #5d0d12 100%)',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '1.15rem',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(122,17,23,0.15)',
                            letterSpacing: '0.5px',
                          }
                        : {}
                    }
                  >
                    {submitting
                      ? "Procesando..."
                      : "Enviar al Comité de Currículo de Programa"}
                  </button>

                  {uploadedMandatory.length < mandatoryDocs.length && (
                    <div className="approve-warning">
                      ⚠️ El estudiante debe cargar todos los documentos obligatorios ({uploadedMandatory.length}/{mandatoryDocs.length})
                    </div>
                  )}

                  {uploadedMandatory.length === mandatoryDocs.length && !allMandatoryAccepted && (
                    <div className="approve-warning">
                      ⚠️ Debes aceptar todos los documentos obligatorios antes de enviar al comité
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>


      {/* Sección: Notificar al Jurado (revisión final por jefatura) */}
      {profile.currentStatus === "PENDING_PROGRAM_HEAD_FINAL_REVIEW" && (
        <div style={{
          background: '#f8f6ef',
          border: '2px solid #B7A873',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(122,17,23,0.10)',
        }}>
          <h3 style={{ color: '#5d0d12', fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.2rem' }}>
            Revisión Final — Notificar al Jurado
          </h3>
          <p style={{ color: '#7A1117', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            El director de proyecto ha verificado que los documentos finales del estudiante están completos.
            Como jefatura de programa, debes revisar y aprobar antes de notificar formalmente al jurado para
            continuar con el proceso hacia la sustentación.
          </p>
          <button
            onClick={() => setShowNotifyExaminersModal(true)}
            disabled={notifyingExaminers}
            style={{
              background: notifyingExaminers ? '#D5CBA0' : '#7A1117',
              color: notifyingExaminers ? '#5d0d12' : '#fff',
              fontWeight: 900,
              fontSize: '1.1rem',
              padding: '0.9rem 2.2rem',
              borderRadius: '12px',
              border: '2px solid #B7A873',
              boxShadow: '0 4px 12px rgba(122,17,23,0.20)',
              cursor: notifyingExaminers ? 'not-allowed' : 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {notifyingExaminers ? '⏳ Notificando al jurado...' : 'Aprobar y Notificar al Jurado'}
          </button>
        </div>
      )}

      {/* Back Button */}
      <div className="back-button-section">
        <button onClick={() => navigate("/jefeprograma")} className="back-btn">
          ← Volver al listado
        </button>
      </div>

      <div className="student-info-card modality-history-section">
        <h3 className="card-section-title"> Historial de Estados</h3>

        {modalityHistory.length > 0 ? (
          <ul className="modality-history-list">
            {modalityHistory.map((item, index) => {
              const status = item.status || item.currentStatus;
              const changeDate = item.changeDate || item.updatedAt || item.lastUpdatedAt || item.createdAt;
              const responsible = item.responsible || item.actorName || item.userName || "Sistema";
              const description = item.description || item.currentStatusDescription || "Sin descripción";

              return (
                <li
                  key={`${status || "STATUS"}-${changeDate || "DATE"}-${index}`}
                  className="modality-history-item"
                >
                  <div className="modality-history-item-header">
                    <span className="modality-history-status-badge">
                      {getStatusLabel(status)}
                    </span>
                    <span className="modality-history-date">
                      {changeDate
                        ? new Date(changeDate).toLocaleString("es-CO", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })
                        : "Fecha no disponible"}
                    </span>
                  </div>

                  <p className="modality-history-description">{description}</p>

                  <p className="modality-history-responsible">
                    <strong>Responsable:</strong> {responsible}
                  </p>

                  {item.observations && (
                    <p className="modality-history-observations">
                      <strong>Observaciones:</strong> {item.observations}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="modality-history-empty">
            No hay historial disponible para esta modalidad.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Enviar al Comité"
        message="¿Estás seguro de enviar este estudiante al Comité de Currículo de Programa?"
        confirmText="Sí, enviar"
        cancelText="Cancelar"
        variant="primary"
        onConfirm={executeApproveAll}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showNotifyExaminersModal}
        title="Aprobar y Notificar al Jurado"
        message="¿Confirmas que has revisado los documentos finales y deseas notificar formalmente al jurado para que continúe con el proceso de revisión hacia la sustentación?"
        confirmText="Sí, notificar al jurado"
        cancelText="Cancelar"
        variant="primary"
        onConfirm={executeNotifyExaminers}
        onCancel={() => setShowNotifyExaminersModal(false)}
      />
    </div>
  );
}
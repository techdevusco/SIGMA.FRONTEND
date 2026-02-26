import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStudentModalityProfile,
  reviewDocumentCommittee,
  approveCommittee,
  getDocumentBlobUrl,
  getModalityDetails,
  closeModalityByCommittee,
} from "../../services/committeeService";
import AssignDirectorModal from "../../components/committee/AssignDirectorModal";
import AssignExaminersModal from "../../components/committee/AssignExaminerModal";
import ModalityDetailsModal from "../../components/committee/ModalityDetailsModal";
import ChangeDirectorModal from "../../components/committee/ChangeDirectorModal";
import FinalDecisionModal, { isFinalDecisionModality } from "../../components/committee/FinalDecisionModal";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/council/studentprofile.css";

export default function CommitteeStudentProfile() {
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

  // Estados para modales
  const [showChangeDirectorModal, setShowChangeDirectorModal] = useState(false);
  const [showAssignDirectorModal, setShowAssignDirectorModal] = useState(false);
  const [showAssignExaminersModal, setShowAssignExaminersModal] = useState(false);
  const [showModalityDetailsModal, setShowModalityDetailsModal] = useState(false);
  const [showCloseModalityModal, setShowCloseModalityModal] = useState(false);
  const [showFinalDecisionModal, setShowFinalDecisionModal] = useState(false);
  const [modalityDetails, setModalityDetails] = useState(null);
  const [closeReason, setCloseReason] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [studentModalityId]);

  const fetchProfile = async () => {
    try {
      const res = await getStudentModalityProfile(studentModalityId);
      console.log("RESPUESTA BACKEND (comité):", res);
      setProfile(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo cargar la información del estudiante");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (studentDocumentId) => {
    setLoadingDoc(studentDocumentId);
    try {
      const blobUrl = await getDocumentBlobUrl(studentDocumentId);
      window.open(blobUrl, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar el documento");
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
      await reviewDocumentCommittee(studentDocumentId, { status: selectedStatus, notes: notes.trim() });
      setSuccessMessage("✅ Documento revisado exitosamente");
      setTimeout(() => setSuccessMessage(""), 5000);
      await fetchProfile();
      setReviewingDocId(null);
      setSelectedStatus("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Error al revisar el documento");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveModality = async () => {
    const mandatoryDocs = profile.documents.filter(d => d.mandatory);
    const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
    const allMandatoryAccepted = uploadedMandatory.every(
      (d) => d.status === "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW"
    );
    if (uploadedMandatory.length < mandatoryDocs.length) {
      setError("El estudiante debe cargar todos los documentos obligatorios");
      setTimeout(() => setError(""), 5000);
      return;
    }
    if (!allMandatoryAccepted) {
      setError("Debes aceptar todos los documentos obligatorios antes de aprobar la modalidad");
      setTimeout(() => setError(""), 5000);
      return;
    }
    setShowApproveConfirm(true);
  };

  const executeApproveModality = async () => {
    setShowApproveConfirm(false);
    setSubmitting(true);
    try {
      await approveCommittee(studentModalityId);
      setSuccessMessage("✅ Modalidad aprobada exitosamente. Ahora puedes asignar los jueces.");
      await fetchProfile();
      setShowAssignExaminersModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al aprobar la modalidad");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModality = async (e) => {
    e.preventDefault();
    if (!closeReason.trim()) {
      setError("Debe proporcionar el motivo del cierre");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const response = await closeModalityByCommittee(studentModalityId, closeReason);
      setSuccessMessage(`✅ ${response.message || "Modalidad cerrada exitosamente"}`);
      setShowCloseModalityModal(false);
      setCloseReason("");
      await fetchProfile();
      setTimeout(() => setSuccessMessage(""), 10000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al cerrar la modalidad");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewModalityDetails = async () => {
    try {
      const details = await getModalityDetails(profile.modalityId);
      setModalityDetails(details);
      setShowModalityDetailsModal(true);
    } catch (err) {
      setError("Error al cargar detalles de la modalidad");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleModalSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
    fetchProfile();
  };

  const canEditDocument = (doc) => doc.status !== "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW";

  const getStatusBadgeClass = (status) => {
    if (status === "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW") return "accepted";
    if (status === "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW") return "rejected";
    if (status === "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE") return "corrections";
    if (status === "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW") return "accepted";
    if (status === "REJECTED_FOR_PROGRAM_HEAD_REVIEW") return "rejected";
    if (status === "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD") return "corrections";
    return "pending";
  };

  const getStatusLabel = (status) => {
    const labels = {
      "PENDING": "Pendiente",
      "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW": "Aceptado por Jefe de Programa",
      "REJECTED_FOR_PROGRAM_HEAD_REVIEW": "Rechazado por Jefe de Programa",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD": "Correcciones solicitadas por Jefe",
      "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW": "Aceptado por Comité",
      "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW": "Rechazado por Comité",
      "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "Correcciones solicitadas por Comité",
      "CORRECTION_RESUBMITTED": "Corrección reenviada",
      "ACCEPTED_FOR_EXAMINER_REVIEW": "Aceptado por Juez",
      "REJECTED_FOR_EXAMINER_REVIEW": "Rechazado por Juez",
      "CORRECTIONS_REQUESTED_BY_EXAMINER": "Correcciones solicitadas por Juez",
    };
    return labels[status] || status;
  };

  if (loading) return <div className="student-profile-loading">Cargando perfil del estudiante...</div>;

  if (error && !profile) {
    return (
      <div className="student-profile-error">
        <p>{error}</p>
        <button onClick={() => navigate("/comite")} className="back-btn">← Volver al listado</button>
      </div>
    );
  }

  if (!profile) return <div className="student-profile-no-data">No hay información disponible</div>;

  const mandatoryDocs = profile.documents.filter(d => d.mandatory);
  const uploadedDocs = profile.documents.filter((d) => d.uploaded);
  const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
  const allMandatoryAccepted = uploadedMandatory.every(
    (d) => d.status === "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW"
  );
  const isModalityClosed = profile.currentStatus === "MODALITY_CLOSED";

  // ✅ Solo aplica para: Posgrado, Seminario de Grado, Producción Académica de Alto Nivel
  const isFinalDecision = isFinalDecisionModality(profile.modalityName);

  // Stepper pre-aprobación (solo docs + director son obligatorios)
  const step1Ok = allMandatoryAccepted && uploadedMandatory.length === mandatoryDocs.length;
  const step2Ok = !!profile.projectDirectorName;
  const canApproveModality = step1Ok && step2Ok;

  return (
    <div className="student-profile-container">

      {/* Header */}
      <div className="student-profile-header">
        <h2 className="student-profile-title">Perfil del Estudiante - Comité de Currículo</h2>
        <p className="student-profile-subtitle">Revisa la documentación presentada y gestiona la modalidad de grado conforme a los lineamientos académicos establecidos.</p>
      </div>

      {/* Student Info */}
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
              <span className="student-info-label">Correo Institucional</span>
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
              <span className="student-info-label">Promedio Ponderado</span>
              <span className="student-info-value">
                {profile.gpa || "N/A"}
              </span>
            </div>
            <div className="student-info-item">
              <span className="student-info-label">Semestre Cursado</span>
              <span className="student-info-value">
                {profile.semester || "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modality Info */}
      <div className="student-info-card">
        <h3 className="card-section-title"> Información de la Modalidad</h3>
        <div className="student-info-grid">
          <div className="student-info-item">
            <span className="student-info-label">Modalidad</span>
            <span className="student-info-value">{profile.modalityName}</span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Estado Actual</span>
            <span className={`student-info-value ${isModalityClosed ? "closed" : ""}`}>
              {isModalityClosed && "🔒 "}{profile.currentStatusDescription}
            </span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Última Actualización</span>
            <span className="student-info-value">
              {profile.lastUpdatedAt
                ? new Date(profile.lastUpdatedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
                : "N/A"}
            </span>
          </div>
          <div className="student-info-item">
            <span className="student-info-label">Créditos Requeridos</span>
            <span className="student-info-value">{profile.creditsRequired || "N/A"}</span>
          </div>
          {profile.projectDirectorName && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Director de Proyecto</span>
                <span className="student-info-value">{profile.projectDirectorName}</span>
              </div>
              <div className="student-info-item">
                <span className="student-info-label">Email del Director</span>
                <span className="student-info-value email">{profile.projectDirectorEmail}</span>
              </div>
            </>
          )}
          {profile.defenseDate && (
            <>
              <div className="student-info-item">
                <span className="student-info-label">Fecha de Sustentación</span>
                <span className="student-info-value">
                  {new Date(profile.defenseDate).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })}
                </span>
              </div>
              <div className="student-info-item">
                <span className="student-info-label">Lugar de Sustentación</span>
                <span className="student-info-value">{profile.defenseLocation || "N/A"}</span>
              </div>
            </>
          )}
          {profile.academicDistinction && (
            <div className="student-info-item">
              <span className="student-info-label">Resultado</span>
              <span className="student-info-value distinction">{profile.academicDistinction}</span>
            </div>
          )}
        </div>
        {profile.modalityId && (
          <div className="modality-details-btn-container">
            <button onClick={handleViewModalityDetails} className="btn-view-modality-details">
              📋 Ver Detalles Completos de la Modalidad
            </button>
          </div>
        )}
      </div>

      {/* Documents Stats */}
      <div className="documents-stats-card">
        <h3 className="card-section-title"> Estadísticas de Documentos</h3>
        <div className="stats-grid">
          <div className="stat-item total" style={{ background: 'linear-gradient(135deg, #7A1117 0%, #D5CBA0 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.totalDocuments || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item approved" style={{ background: 'linear-gradient(135deg, #28a745 0%, #D5CBA0 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.approvedDocuments || 0}</div>
            <div className="stat-label">Aprobados</div>
          </div>
          <div className="stat-item pending" style={{ background: 'linear-gradient(135deg, #D5CBA0 0%, #ff9800 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.pendingDocuments || 0}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-item rejected" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #D5CBA0 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.rejectedDocuments || 0}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
      </div>

      {/* Documents */}
<div className="documents-card">
  <div className="documents-card-header">
    <div>
      <h3 className="documents-title" style={{ color: '#5d0d12' }}>Documentos de la Modalidad</h3>
      <p className="documents-subtitle">
        Revisión y validación de los soportes académicos presentados por el estudiante
      </p>
    </div>
  </div>

  <div className="documents-card-body">
    {uploadedDocs.length === 0 ? (
      <div className="documents-empty">
        <div className="documents-empty-icon">📭</div>
        <p className="documents-empty-text">
          El estudiante aún no ha cargado documentos para esta modalidad.
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
                    <strong className="document-name">{doc.documentName}</strong>
                  </td>

                  <td>
                    <span className={`mandatory-badge ${doc.documentType === "MANDATORY" ? "yes" : "no"}`}>
                      {doc.documentType === "MANDATORY" ? "Sí" : "No"}
                    </span>
                  </td>

                  <td>
                    <span className={`doc-status-badge ${getStatusBadgeClass(doc.status)}`}>
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
                            timeStyle: "short"
                          })
                        : "-"}
                    </span>
                  </td>

                  <td>
                    <div className="doc-actions">
                      <button
                        onClick={() => handleViewDocument(doc.studentDocumentId)}
                        disabled={loadingDoc === doc.studentDocumentId}
                        className={`doc-btn doc-btn-view ${
                          loadingDoc === doc.studentDocumentId ? "loading" : ""
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
                        <span className="locked-badge">Aprobado</span>
                      )}
                    </div>

                    {reviewingDocId === doc.studentDocumentId &&
                      canEditDocument(doc) && (
                        <div className="review-panel">
                          <h4 className="review-panel-title">
                            Revisión de documento
                          </h4>

                          <div className="review-form-group">
                            <label className="review-label">
                              Nuevo estado:
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setSelectedStatus(e.target.value)
                              }
                              className="review-select"
                            >
                              <option value="">Seleccionar estado</option>
                              <option value="ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW">
                                Aceptado
                              </option>
                              <option value="CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE">
                                Requiere correcciones
                              </option>
                            </select>
                          </div>

                          <div className="review-form-group">
                            <label className="review-label">
                              Comentario:
                            </label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="review-textarea"
                              placeholder="Escribe aquí el motivo de tu decisión..."
                              rows={4}
                            />
                          </div>

                          <button
                            onClick={() =>
                              handleReviewDocument(doc.studentDocumentId)
                            }
                            disabled={submitting}
                            className="review-submit-btn"
                          >
                            {submitting ? "Guardando..." : "Guardar revisión"}
                          </button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
</div>




      {/* Stepper de aprobación — solo para modalidades que NO son de decisión final */}
      {!isFinalDecision && (
        <div className="approve-all-section">
          <h4 className="stepper-title">Pasos para aprobar la modalidad</h4>

          {/* Paso 1: Documentos */}
          <div className={`stepper-step ${step1Ok ? "step-done" : "step-pending"}`}>
            <span className="step-icon">{step1Ok ? "✅" : "⏳"}</span>
            <span className="step-label">Documentos obligatorios aceptados</span>
            {!step1Ok && (
              <div className="step-hint">
                {uploadedMandatory.length < mandatoryDocs.length
                  ? `El estudiante debe cargar todos los documentos (${uploadedMandatory.length}/${mandatoryDocs.length})`
                  : "Debes aceptar todos los documentos obligatorios"}
              </div>
            )}
          </div>

          {/* Paso 2: Director */}
          <div className={`stepper-step ${step2Ok ? "step-done" : "step-pending"}`}>
            <div className="step-header">
              <span className="step-icon">{step2Ok ? "✅" : "❌"}</span>
              <span className="step-label">
                Director de proyecto
                {step2Ok && <em className="step-value"> — {profile.projectDirectorName}</em>}
              </span>
              {!step2Ok && (
                <button
                  onClick={() => setShowAssignDirectorModal(true)}
                  className="step-action-btn"
                >
                  Asignar Director
                </button>
              )}
              {step2Ok && (
                <button
                  onClick={() => setShowChangeDirectorModal(true)}
                  className="step-action-btn step-action-secondary"
                >
                  Cambiar
                </button>
              )}
            </div>
          </div>

          {/* Botón final */}
          <div className="approve-all-content" style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleApproveModality}
              disabled={!canApproveModality || submitting}
              className={`approve-all-btn ${canApproveModality ? "enabled" : "disabled"}`}
            >
              {submitting ? "Procesando..." : "Aprobar Modalidad Para Inicio"}
            </button>
            {!canApproveModality && (
              <div className="approve-warning">⚠️ Completa todos los pasos requeridos antes de aprobar</div>
            )}
          </div>
        </div>
      )}

      {/* Committee Actions */}
      <div className="council-actions-section">
        <div className="council-actions-premium-card">
          <h3 className="section-title premium">Acciones del Comité de Currículo</h3>
          <div className="council-actions-grid premium">
            {isFinalDecision && !isModalityClosed && (
              <button
                onClick={() => setShowFinalDecisionModal(true)}
                className="council-action-btn premium"
                style={{ background: 'linear-gradient(135deg, #7A1117 0%, #D5CBA0 100%)', color: '#fff', border: '1px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(122,17,23,0.10)' }}
              >
                <span className="action-text premium">Decisión Final del Comité</span>
              </button>
            )}
            {!profile.projectDirectorName && !isFinalDecision && (
              <button
                onClick={() => setShowAssignDirectorModal(true)}
                className="council-action-btn assign-director premium"
                style={{ background: 'linear-gradient(135deg, #5d0d12 0%, #7A1117 100%)', color: '#fff', border: '1px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(122,17,23,0.10)' }}
              >
                <span className="action-text premium">Asignar Director</span>
              </button>
            )}
            {profile.projectDirectorName && !isModalityClosed && !isFinalDecision && (
              <button
                onClick={() => setShowChangeDirectorModal(true)}
                className="council-action-btn change-director premium"
                style={{ background: 'linear-gradient(135deg, #5d0d12 0%, #7A1117 100%)', color: '#fff', border: '1px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(122,17,23,0.10)' }}
              >
                <span className="action-text premium">Cambiar Director</span>
              </button>
            )}
            {!isFinalDecision && (
              <button
                onClick={() => setShowAssignExaminersModal(true)}
                className="council-action-btn assign-director premium"
                style={{ background: 'linear-gradient(135deg, #5d0d12 0%, #7A1117 100%)', color: '#fff', border: '1px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(122,17,23,0.10)' }}
              >
                <span className="action-text premium">Asignar Jueces de Sustentación</span>
              </button>
            )}
            {!isModalityClosed && (
              <button
                onClick={() => setShowCloseModalityModal(true)}
                className="council-action-btn assign-director premium"
                style={{ background: 'linear-gradient(135deg, #5d0d12 0%, #7A1117 100%)', color: '#fff', border: '1px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(122,17,23,0.10)' }}
              >
                <span className="action-text premium">Cerrar Modalidad</span>
              </button>
            )}
          </div>
        </div>
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
        </div>
      )}

      {/* Back */}
      <div className="back-button-section">
        <button onClick={() => navigate("/comite")} className="back-btn">← Volver al listado</button>
      </div>

      {/* ======= MODALES ======= */}
      {showAssignDirectorModal && (
        <AssignDirectorModal
          studentModalityId={studentModalityId}
          onClose={() => setShowAssignDirectorModal(false)}
          onSuccess={() => { setShowAssignDirectorModal(false); handleModalSuccess("✅ Director asignado correctamente"); }}
        />
      )}

      {showChangeDirectorModal && (
        <ChangeDirectorModal
          studentModalityId={studentModalityId}
          currentDirectorName={profile.projectDirectorName}
          onClose={() => setShowChangeDirectorModal(false)}
          onSuccess={(message) => { setShowChangeDirectorModal(false); handleModalSuccess(message); }}
        />
      )}

      {showAssignExaminersModal && (
        <AssignExaminersModal
          studentModalityId={studentModalityId}
          onClose={() => setShowAssignExaminersModal(false)}
          onSuccess={() => {
            setShowAssignExaminersModal(false);
            handleModalSuccess("✅ Jueces asignados correctamente");
          }}
        />
      )}

      {showModalityDetailsModal && modalityDetails && (
        <ModalityDetailsModal
          modalityDetails={modalityDetails}
          onClose={() => setShowModalityDetailsModal(false)}
        />
      )}

      {/* Modal: Cerrar Modalidad */}
      {showCloseModalityModal && (
        <div className="modal-overlay" style={{ background: 'rgba(122,17,23,0.12)' }} onClick={() => !submitting && setShowCloseModalityModal(false)}>
          <div
            className="modal"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #D5CBA0 100%)',
              border: '2px solid #7A1117',
              borderRadius: '18px',
              boxShadow: '0 8px 32px rgba(122,17,23,0.12)',
              maxWidth: '420px',
              margin: 'auto',
              padding: '2rem 1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D5CBA0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Cerrar Modalidad</h2>
              <button onClick={() => setShowCloseModalityModal(false)} className="modal-close" disabled={submitting} style={{ color: '#7A1117', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCloseModality} className="modal-form">
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Estudiante</label>
                <input
                  type="text"
                  value={profile.studentName}
                  className="input"
                  disabled
                  style={{
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '1rem',
                    color: '#7A1117',
                    background: '#f9f6ee',
                    fontWeight: 500,
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Motivo del Cierre *</label>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="textarea"
                  placeholder="Explica por qué se cierra esta modalidad..."
                  required
                  rows="5"
                  style={{
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '1rem',
                    color: '#7A1117',
                    background: '#f9f6ee',
                    fontWeight: 500,
                  }}
                />
                <small style={{ color: '#7A1117', marginTop: '0.5rem', display: 'block', fontSize: '0.95rem' }}>
                  El estudiante será notificado por correo electrónico
                </small>
              </div>
              <div style={{ background: '#f9f6ee', border: '1px solid #D5CBA0', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                <p style={{ margin: 0, color: '#7A1117', fontSize: '0.98rem' }}>
                  <strong>Advertencia:</strong> Esta acción cerrará permanentemente la modalidad del estudiante.
                </p>
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCloseModalityModal(false)}
                  className="btn-cancel"
                  disabled={submitting}
                  style={{
                    background: '#fff',
                    color: '#7A1117',
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirm-reject"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #D5CBA0 100%)',
                    color: '#fff',
                    border: '1.5px solid #7A1117',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(122,17,23,0.08)'
                  }}
                >
                  {submitting ? 'Cerrando...' : 'Cerrar Modalidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modal: Decisión Final — Posgrado, Seminario de Grado, Producción Académica de Alto Nivel */}
      {showFinalDecisionModal && (
        <FinalDecisionModal
          studentModalityId={studentModalityId}
          modalityName={profile.modalityName}
          studentName={`${profile.studentName} ${profile.studentLastName}`}
          onClose={() => setShowFinalDecisionModal(false)}
          onSuccess={(message) => {
            setShowFinalDecisionModal(false);
            handleModalSuccess(message);
          }}
        />
      )}

      <ConfirmModal
        isOpen={showApproveConfirm}
        title="Aprobar Modalidad"
        message="¿Estás seguro de aprobar esta modalidad? Esta acción es definitiva."
        confirmText="Sí, aprobar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={executeApproveModality}
        onCancel={() => setShowApproveConfirm(false)}
      />
    </div>
  );
}
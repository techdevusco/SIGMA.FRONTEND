import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStudentModalityProfile,
  reviewDocumentCommittee,
  approveCommittee,
  getDocumentBlobUrl,
  getModalityDetails,
  closeModalityByCommittee,
  getAssignedExaminers,
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
  const [assignedExaminers, setAssignedExaminers] = useState([]);

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
      console.log("Examiners data:", res.examiners, "| Status:", res.currentStatus);
      setProfile(res);

      // Obtener jurado asignado desde endpoint dedicado
      try {
        const examiners = await getAssignedExaminers(studentModalityId);
        console.log("Jurado asignado (endpoint):", examiners);
        if (examiners && examiners.length > 0) {
          setAssignedExaminers(examiners);
          // Sincronizar localStorage con la respuesta del backend
          localStorage.setItem(`examiner_assignment_${studentModalityId}`, JSON.stringify(examiners));
        } else {
          // El endpoint no devuelve datos — recuperar desde localStorage si existe
          const cached = localStorage.getItem(`examiner_assignment_${studentModalityId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
              console.log("Jurado recuperado desde localStorage:", parsed);
              setAssignedExaminers(parsed);
            }
          }
        }
      } catch (exErr) {
        console.log("No se pudo obtener jurado asignado:", exErr);
        // Intentar recuperar desde localStorage
        const cached = localStorage.getItem(`examiner_assignment_${studentModalityId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setAssignedExaminers(parsed);
          }
        }
      }
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
    const mandatoryDocs = profile.documents.filter(d => d.documentType === "MANDATORY");
    const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
    const allMandatoryAccepted = mandatoryDocs.length > 0 && uploadedMandatory.every(
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
      setSuccessMessage("✅ Modalidad aprobada exitosamente por el comité de currículo.");
      await fetchProfile();
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
      setError("Debe proporcionar el motivo de la cancelación");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const response = await closeModalityByCommittee(studentModalityId, closeReason);
      setSuccessMessage(`✅ ${response.message || "Modalidad cancelada exitosamente"}`);
      setShowCloseModalityModal(false);
      setCloseReason("");
      await fetchProfile();
      setTimeout(() => setSuccessMessage(""), 10000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al cancelar la modalidad");
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
      "ACCEPTED_FOR_EXAMINER_REVIEW": "Aceptado por Jurado",
      "REJECTED_FOR_EXAMINER_REVIEW": "Rechazado por Jurado",
      "CORRECTIONS_REQUESTED_BY_EXAMINER": "Correcciones solicitadas por Jurado",
      "EDIT_REQUESTED": "Edición solicitada por estudiante",
      "EDIT_REQUEST_APPROVED": "Solicitud de edición aprobada",
      "EDIT_REQUEST_REJECTED": "Solicitud de edición rechazada",
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

  const mandatoryDocs = profile.documents.filter(d => d.documentType === "MANDATORY");
  const uploadedDocs = profile.documents.filter((d) => d.uploaded);
  const uploadedMandatory = mandatoryDocs.filter(d => d.uploaded);
  const allMandatoryAccepted = mandatoryDocs.length > 0 && uploadedMandatory.length === mandatoryDocs.length && uploadedMandatory.every(
    (d) => d.status === "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW"
  );
  const isModalityClosed = profile.currentStatus === "MODALITY_CLOSED";

  // ✅ Solo aplica para: Posgrado, Seminario de Grado, Producción Académica de Alto Nivel
  // Estas modalidades NO requieren director, jurado ni sustentación
  const isFinalDecision = isFinalDecisionModality(profile.modalityName);

  // Estados finales de la decisión del comité (para modalidades simplificadas)
  const finalDecisionStatuses = [
    "GRADED_APPROVED", "GRADED_FAILED",
    "MODALITY_APPROVED_BY_COMMITTEE", "MODALITY_FAILED_BY_COMMITTEE",
    "APPROVED_BY_COMMITTEE", "REJECTED_BY_COMMITTEE",
  ];
  const isFinalDecisionDone = finalDecisionStatuses.includes(profile.currentStatus);

  // Checklist: pasos para aprobar la modalidad
  const step1Ok = allMandatoryAccepted;
  const step2Ok = !!profile.projectDirectorName;
  
  // Jurado: solo marcar como completado si hay datos reales de jurado asignado
  const hasExaminersData = assignedExaminers.length > 0 || (profile && Array.isArray(profile.examiners) && profile.examiners.length > 0);
  const examinersToDisplay = assignedExaminers.length > 0 ? assignedExaminers : (profile?.examiners || []);
  const step3Ok_examiners = hasExaminersData;

  // Detectar si la modalidad ya fue aprobada por comité (solo estados posteriores a la aprobación explícita)
  const postApprovalStatuses = [
    "PROPOSAL_APPROVED",
    "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR",
    "DEFENSE_SCHEDULED",
    "DEFENSE_COMPLETED",
    "EXAMINERS_ASSIGNED",
    "READY_FOR_EXAMINERS",
    "DOCUMENTS_APPROVED_BY_EXAMINERS",
    "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS",
    "GRADED_APPROVED",
    "GRADED_FAILED",
    "MODALITY_APPROVED_BY_COMMITTEE",
    "MODALITY_FAILED_BY_COMMITTEE",
    "APPROVED_BY_COMMITTEE",
    "REJECTED_BY_COMMITTEE",
  ];
  const isModalityApprovedByCommittee = postApprovalStatuses.includes(profile.currentStatus);

  // Solo se puede aprobar si los docs están OK, director asignado, y el estado es válido para el backend
  const validStatusesForApproval = [
    "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE",
    "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE",
    "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE",
    "CORRECTIONS_SUBMITTED_TO_COMMITTEE",
  ];
  const isInValidStatusForApproval = validStatusesForApproval.includes(profile.currentStatus);
  const canApproveModality = step1Ok && step2Ok && !isModalityApprovedByCommittee && isInValidStatusForApproval;

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
          <div className="stat-item total" style={{ background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.totalDocuments || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item approved" style={{ background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.approvedDocuments || 0}</div>
            <div className="stat-label">Aprobados</div>
          </div>
          <div className="stat-item pending" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #e68900 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
            <div className="stat-number">{profile.pendingDocuments || 0}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-item rejected" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #b02a37 100%)', color: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(122,17,23,0.08)' }}>
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
                            <span style={{
                              color: '#7A1117',
                              fontWeight: 900,
                              fontSize: '1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle'}}>
                                <circle cx="12" cy="12" r="12" fill="#7A1117"/>
                                <path d="M8 12.5L11 15.5L16 10.5" stroke="#D5CBA0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Revisión de documento
                            </span>
                          </h4>

                          <div className="review-form-group">
                            <label className="review-label">
                              <span style={{color:'#7A1117', fontWeight:900}}>Nuevo estado:</span>
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setSelectedStatus(e.target.value)
                              }
                              className="review-select"
                              style={{borderColor: '#7A1117', fontWeight:700, color:'#7A1117'}}
                            >
                              <option value="">Seleccionar estado</option>
                              <option value="ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW">
                                ✅ Aceptado
                              </option>
                              <option value="CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE">
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
                            onClick={() =>
                              handleReviewDocument(doc.studentDocumentId)
                            }
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




      {/* Checklist de aprobación — modalidades con flujo completo (director + jurado) */}
      {!isFinalDecision && (
        <div className="documents-card approve-all-section" style={{ border: '2.5px solid #7A1117', borderRadius: '18px', background: 'linear-gradient(135deg, #f7f7fa 0%, #e8ebf0 100%)', boxShadow: '0 8px 32px rgba(122, 17, 23, 0.10)', padding: '2rem' }}>
          <h3 className="documents-title institutional-title" style={{ color: '#7A1117', fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.5px', textShadow: '0 2px 8px #7A111733', marginBottom: '2rem' }}>Checklist de Aprobación de la Modalidad</h3>

          {/* Paso 1: Documentos */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px', background: step1Ok ? '#f0fdf4' : '#fefce8', border: step1Ok ? '1.5px solid #bbf7d0' : '1.5px solid #fde68a', transition: 'all 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: step1Ok ? '#166534' : '#92400e' }}>
                  1. Documentos obligatorios aceptados
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: step1Ok ? '#dcfce7' : '#fef9c3',
                  color: step1Ok ? '#166534' : '#92400e',
                  border: step1Ok ? '1px solid #86efac' : '1px solid #fde047',
                }}>
                  {step1Ok ? 'COMPLETADO' : 'PENDIENTE'}
                </span>
              </div>
              {!step1Ok && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  {uploadedMandatory.length < mandatoryDocs.length
                    ? `El estudiante debe cargar todos los documentos obligatorios (${uploadedMandatory.length}/${mandatoryDocs.length} cargados)`
                    : "Debes aceptar todos los documentos obligatorios desde la tabla de documentos"}
                </p>
              )}
              {step1Ok && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                  Todos los documentos obligatorios han sido aceptados ({uploadedMandatory.length}/{mandatoryDocs.length})
                </p>
              )}
            </div>
          </div>

          {/* Paso 2: Director de Proyecto */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px', background: step2Ok ? '#f0fdf4' : '#fefce8', border: step2Ok ? '1.5px solid #bbf7d0' : '1.5px solid #fde68a', transition: 'all 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: step2Ok ? '#166534' : '#92400e' }}>
                  2. Director de proyecto asignado
                  {step2Ok && <em style={{ fontWeight: 500, color: '#374151' }}> — {profile.projectDirectorName}</em>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: step2Ok ? '#dcfce7' : '#fef9c3',
                    color: step2Ok ? '#166534' : '#92400e',
                    border: step2Ok ? '1px solid #86efac' : '1px solid #fde047',
                  }}>
                    {step2Ok ? 'COMPLETADO' : 'PENDIENTE'}
                  </span>
                  {!step2Ok && (
                    <button
                      onClick={() => setShowAssignDirectorModal(true)}
                      style={{ background: '#7A1117', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Asignar Director
                    </button>
                  )}
                  {step2Ok && (
                    <button
                      onClick={() => setShowChangeDirectorModal(true)}
                      style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              </div>
              {!step2Ok && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  Se debe asignar un director de proyecto antes de aprobar la modalidad
                </p>
              )}
            </div>
          </div>

          {/* Paso 3: Aprobar modalidad */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px', background: isModalityApprovedByCommittee ? '#f0fdf4' : (canApproveModality ? '#fefce8' : '#f9fafb'), border: isModalityApprovedByCommittee ? '1.5px solid #bbf7d0' : (canApproveModality ? '1.5px solid #fde68a' : '1.5px solid #e5e7eb'), transition: 'all 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isModalityApprovedByCommittee ? '#166534' : (canApproveModality ? '#92400e' : '#6b7280') }}>
                  3. Aprobar modalidad por comité
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: isModalityApprovedByCommittee ? '#dcfce7' : (canApproveModality ? '#fef9c3' : '#f3f4f6'),
                    color: isModalityApprovedByCommittee ? '#166534' : (canApproveModality ? '#92400e' : '#6b7280'),
                    border: isModalityApprovedByCommittee ? '1px solid #86efac' : (canApproveModality ? '1px solid #fde047' : '1px solid #d1d5db'),
                  }}>
                    {isModalityApprovedByCommittee ? 'COMPLETADO' : (canApproveModality ? 'LISTO' : 'PENDIENTE')}
                  </span>
                  {canApproveModality && (
                    <button
                      onClick={handleApproveModality}
                      disabled={submitting}
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
                    >
                      {submitting ? 'Aprobando...' : '✅ Aprobar Modalidad'}
                    </button>
                  )}
                </div>
              </div>
              {!isModalityApprovedByCommittee && !canApproveModality && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                  {!step1Ok && !step2Ok
                    ? "Completa los pasos 1 y 2 primero"
                    : !step1Ok
                    ? "Completa el paso 1 primero (documentos obligatorios)"
                    : !step2Ok
                    ? "Completa el paso 2 primero (asignar director)"
                    : !isInValidStatusForApproval
                    ? `La modalidad no está en un estado válido para aprobación (estado actual: ${profile.currentStatusDescription || profile.currentStatus})`
                    : "Completa los pasos anteriores"}
                </p>
              )}
              {isModalityApprovedByCommittee && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                  La modalidad ha sido aprobada por el comité de currículo
                </p>
              )}
            </div>
          </div>

          {/* Paso 4: Asignar jurado (opcional) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '12px', background: step3Ok_examiners ? '#f0fdf4' : '#f9fafb', border: step3Ok_examiners ? '1.5px solid #bbf7d0' : '1.5px dashed #d1d5db', transition: 'all 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: step3Ok_examiners ? '#166534' : '#6b7280' }}>
                  4. Asignar jurado evaluador
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: step3Ok_examiners ? '#dcfce7' : '#f3f4f6',
                    color: step3Ok_examiners ? '#166534' : '#9ca3af',
                    border: step3Ok_examiners ? '1px solid #86efac' : '1px solid #e5e7eb',
                  }}>
                    {step3Ok_examiners ? 'COMPLETADO' : 'OPCIONAL'}
                  </span>
                  <button
                    onClick={() => setShowAssignExaminersModal(true)}
                    style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {step3Ok_examiners ? 'Cambiar Jurado' : 'Asignar Jurado'}
                  </button>
                </div>
              </div>
              {step3Ok_examiners && hasExaminersData && (
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {examinersToDisplay.map((examiner, idx) => (
                    <div key={examiner.id || examiner.examinerId || idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '10px', border: '1px solid #86efac', boxShadow: '0 1px 4px rgba(22,101,52,0.07)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #166534)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(22,101,52,0.25)' }}>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                          {examiner.role === 'TIEBREAKER' ? '3' : idx + 1}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>
                          {examiner.role === 'TIEBREAKER' ? 'Jurado Desempate' : `Jurado ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {examiner.name || examiner.fullName || ''} {examiner.lastName || ''}
                        </div>
                      </div>
                      {examiner.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: '#fff', background: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 500, letterSpacing: '0.01em' }}>
                            {examiner.email}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {step3Ok_examiners && !hasExaminersData && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                  Jurado ya asignado (estado: {profile.currentStatusDescription || profile.currentStatus})
                </p>
              )}
              {!step3Ok_examiners && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#9ca3af' }}>
                  El jurado puede ser asignado ahora o en cualquier momento posterior
                </p>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '10px', background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                <strong style={{ color: '#10b981' }}>{[step1Ok, step2Ok, isModalityApprovedByCommittee, step3Ok_examiners].filter(Boolean).length}</strong> de <strong>4</strong> pasos completados
              </span>
              {isModalityApprovedByCommittee && (
                <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>
                  Modalidad aprobada
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checklist simplificado — modalidades de decisión final (Posgrado, Seminario, Producción Académica de Alto Nivel) */}
      {isFinalDecision && !isModalityClosed && (
        <div className="documents-card approve-all-section" style={{ border: '2.5px solid #7A1117', borderRadius: '18px', background: 'linear-gradient(135deg, #f7f7fa 0%, #e8ebf0 100%)', boxShadow: '0 8px 32px rgba(122, 17, 23, 0.10)', padding: '2rem' }}>
          <h3 className="documents-title institutional-title" style={{ color: '#7A1117', fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.5px', textShadow: '0 2px 8px #7A111733', marginBottom: '2rem' }}>Checklist — Decisión Final del Comité</h3>

          <div style={{ background: '#fffbea', border: '1.5px solid #D5CBA0', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#7A1117', fontSize: '0.95rem', lineHeight: '1.5' }}>
              <strong>ℹ️ Modalidad simplificada:</strong> Esta modalidad (<strong>{profile.modalityName}</strong>) no requiere asignación de director de proyecto, jurado ni sustentación. Una vez los documentos estén aceptados, el comité puede aprobar o rechazar directamente.
            </p>
          </div>

          {/* Paso 1: Documentos */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px', background: step1Ok ? '#f0fdf4' : '#fefce8', border: step1Ok ? '1.5px solid #bbf7d0' : '1.5px solid #fde68a', transition: 'all 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: step1Ok ? '#166534' : '#92400e' }}>
                  1. Documentos obligatorios aceptados
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: step1Ok ? '#dcfce7' : '#fef9c3',
                  color: step1Ok ? '#166534' : '#92400e',
                  border: step1Ok ? '1px solid #86efac' : '1px solid #fde047',
                }}>
                  {step1Ok ? 'COMPLETADO' : 'PENDIENTE'}
                </span>
              </div>
              {!step1Ok && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  {uploadedMandatory.length < mandatoryDocs.length
                    ? `El estudiante debe cargar todos los documentos obligatorios (${uploadedMandatory.length}/${mandatoryDocs.length} cargados)`
                    : "Debes aceptar todos los documentos obligatorios desde la tabla de documentos"}
                </p>
              )}
              {step1Ok && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                  Todos los documentos obligatorios han sido aceptados ({uploadedMandatory.length}/{mandatoryDocs.length})
                </p>
              )}
            </div>
          </div>

          {/* Paso 2: Decisión Final */}
          {(() => {
            const isApproved = isFinalDecisionDone && (profile.currentStatus === 'GRADED_APPROVED' || profile.currentStatus === 'MODALITY_APPROVED_BY_COMMITTEE' || profile.currentStatus === 'APPROVED_BY_COMMITTEE');
            const isRejected = isFinalDecisionDone && !isApproved;
            return (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '12px', background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#f9fafb', border: isApproved ? '1.5px solid #bbf7d0' : isRejected ? '1.5px solid #fecaca' : '1.5px solid #e5e7eb', transition: 'all 0.3s ease' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#6b7280' }}>
                      2. Decisión final del comité (Aprobar o Rechazar)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isApproved && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #86efac',
                        }}>
                          APROBADA
                        </span>
                      )}
                      {isRejected && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fca5a5',
                        }}>
                          RECHAZADA
                        </span>
                      )}
                      {!isFinalDecisionDone && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: '#f3f4f6',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                        }}>
                          {step1Ok ? 'LISTO' : 'PENDIENTE'}
                        </span>
                      )}
                      {step1Ok && !isFinalDecisionDone && (
                        <button
                          onClick={() => setShowFinalDecisionModal(true)}
                          style={{ background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(122,17,23,0.2)' }}
                        >
                          ⚖️ Tomar Decisión Final
                        </button>
                      )}
                    </div>
                  </div>
                  {!step1Ok && !isFinalDecisionDone && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                      Primero debes aceptar todos los documentos obligatorios
                    </p>
                  )}
                  {isApproved && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                      La modalidad ha sido aprobada definitivamente por el comité
                    </p>
                  )}
                  {isRejected && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#991b1b' }}>
                      La modalidad ha sido rechazada definitivamente por el comité
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Committee Actions */}
      <div className="council-actions-section" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="council-actions-premium-card" style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px 0 rgba(122,17,23,0.08)', padding: '1.5rem 1.5rem 2.2rem 1.5rem', width: '100%', maxWidth: '600px', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="section-title premium" style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.55rem', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '0.5px', textShadow: '0 2px 8px #7A111733' }}>Acciones del Comité de Currículo</h3>
          <div className="council-actions-grid premium" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', minHeight: '120px' }}>
            {/* Botón Decisión Final — solo para Posgrado, Seminario, Producción Académica */}
            {isFinalDecision && !isModalityClosed && step1Ok && !isFinalDecisionDone && (
              <button
                onClick={() => setShowFinalDecisionModal(true)}
                className="council-action-btn assign-director premium"
                style={{ width: '240px', height: '120px', background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 6px 24px 0 rgba(122,17,23,0.13)', fontWeight: 700, fontSize: '1.15rem', padding: '0.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.2s', outline: 'none' }}
              >
                Decisión Final Comité
              </button>
            )}
            {!isModalityClosed && (
              <button
                onClick={() => setShowCloseModalityModal(true)}
                className="council-action-btn assign-director premium"
                style={{ width: '240px', height: '120px', background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 6px 24px 0 rgba(122,17,23,0.13)', fontWeight: 700, fontSize: '1.25rem', padding: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.2s', outline: 'none' }}
              >
                Cancelar Modalidad
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
          onSuccess={() => {
            setShowAssignDirectorModal(false);
            window.location.reload();
          }}
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
          onSuccess={(selectedExaminers) => {
            setShowAssignExaminersModal(false);
            if (selectedExaminers && selectedExaminers.length > 0) {
              setAssignedExaminers(selectedExaminers);
              // Guardar en localStorage para persistir el dato si el backend no lo devuelve en GET
              localStorage.setItem(`examiner_assignment_${studentModalityId}`, JSON.stringify(selectedExaminers));
            }
            setSuccessMessage("✅ Jurado asignado correctamente");
            setTimeout(() => setSuccessMessage(""), 5000);
            fetchProfile();
          }}
        />
      )}

      {showModalityDetailsModal && modalityDetails && (
        <ModalityDetailsModal
          modalityDetails={modalityDetails}
          onClose={() => setShowModalityDetailsModal(false)}
        />
      )}

      {/* Modal: Cancelar Modalidad */}
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
              <h2 style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Cancelar Modalidad</h2>
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
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Motivo de la Cancelación *</label>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="textarea"
                  placeholder="Explica por qué se cancela esta modalidad..."
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
                  <strong>Advertencia:</strong> Esta acción cancelará permanentemente la modalidad del estudiante.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', background: 'transparent' }}>
                <button
                  type="button"
                  onClick={() => setShowCloseModalityModal(false)}
                  disabled={submitting}
                  style={{
                    background: 'transparent',
                    color: '#7A1117',
                    border: '1.5px solid #7A1117',
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
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: '#fff',
                    border: '1.5px solid #7A1117',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
                  }}
                >
                  {submitting ? 'Cancelando...' : 'Cancelar Modalidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modal: Decisión Final — Posgrado, Diplomado, Producción Académica de Alto Nivel */}
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
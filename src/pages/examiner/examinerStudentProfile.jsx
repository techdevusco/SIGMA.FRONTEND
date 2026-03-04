import '../../styles/examiner/examinerStudentProfile.css';
// Traducción de tipo de documento
const translateDocumentType = (type) => {
  switch (type) {
    case "MANDATORY":
      return "Obligatorio";
    case "SECONDARY":
      return "Secundario";
    case "CANCELLATION":
      return "Cancelación";
    default:
      return type;
  }
};
// Traducción de estados de documentos
const translateDocumentStatus = (status) => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW":
      return "Aceptado por Jefatura de Programa";
    case "REJECTED_FOR_PROGRAM_HEAD_REVIEW":
      return "Rechazado por Jefatura de Programa";
    case "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD":
      return "Correcciones solicitadas por Jefatura de Programa";
    case "CORRECTION_RESUBMITTED":
      return "Corrección reenviada";
    case "ACCEPTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW":
      return "Aceptado por comité curricular";
    case "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW":
      return "Rechazado por comité curricular";
    case "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE":
      return "Correcciones solicitadas por comité curricular";
    case "ACCEPTED_FOR_EXAMINER_REVIEW":
      return "Aceptado por revisión del jurado";
    case "REJECTED_FOR_EXAMINER_REVIEW":
      return "Rechazado por jurado";
    case "CORRECTIONS_REQUESTED_BY_EXAMINER":
      return "Correcciones solicitadas por jurado";
    default:
      return status;
  }
};
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getExaminerStudentProfile,
  getDocumentBlobUrl,
  reviewDocumentExaminer,
  registerEvaluation,
  formatDate,
  getErrorMessage,
  EXAMINER_DOCUMENT_STATUS,
  EXAMINER_DECISIONS,
  isGradeConsistentWithDecision,
  getSuggestedDecision,
  getExaminerTypeForModality,
  getExaminerEvaluation
} from "../../services/examinerService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/examiners/examinerstudentprofile.css";
import "../../styles/council/studentprofile.css"


export default function ExaminerStudentProfile() {
  const { studentModalityId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [approveModalityMsg, setApproveModalityMsg] = useState("");
  const [approveModalityMsgType, setApproveModalityMsgType] = useState("");

  const [examinerRoleInfo, setExaminerRoleInfo] = useState(null);
const [loadingExaminerRole, setLoadingExaminerRole] = useState(false);
const [examinerRoleError, setExaminerRoleError] = useState(null);

  

  const [reviewingDocId, setReviewingDocId] = useState(null);
  const [reviewData, setReviewData] = useState({ status: "", notes: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [finalizingReview, setFinalizingReview] = useState(false);
  const [approvingModality, setApprovingModality] = useState(false);

  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    grade: "",
    decision: "",
    observations: ""
  });
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [registeredEvaluation, setRegisteredEvaluation] = useState(null);

  useEffect(() => {
  if (!studentModalityId) return;

  fetchProfile();
  fetchExaminerRole();
}, [studentModalityId]);

const fetchExaminerRole = async () => {
  try {
    setLoadingExaminerRole(true);
    setExaminerRoleError(null);

    const response = await getExaminerTypeForModality(studentModalityId);

    if (response?.success) {
      setExaminerRoleInfo(response);
    } else {
      setExaminerRoleInfo(null);
    }

  } catch (err) {
    console.error("Error obteniendo rol del jurado:", err);
    setExaminerRoleError("No se pudo cargar la información del rol.");
  } finally {
    setLoadingExaminerRole(false);
  }
};

  const fetchProfile = async () => {
    try {
      const data = await getExaminerStudentProfile(studentModalityId);
      console.log("📋 Perfil completo:", data);
      setProfile(data);
      // Obtener evaluación registrada del backend
      const evalData = await getExaminerEvaluation(studentModalityId);
      if (evalData && evalData.success) {
        setRegisteredEvaluation(evalData);
      } else {
        setRegisteredEvaluation(null);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error al cargar el perfil del estudiante");
      setMessageType("error");
      setProfile(null);
      setRegisteredEvaluation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (studentDocumentId, documentName) => {
    console.log("📄 Abriendo documento:", studentDocumentId);
    setLoadingDocId(studentDocumentId);

    try {
      const blobUrl = await getDocumentBlobUrl(studentDocumentId);
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("Error:", err);
      setMessage(`Error al cargar: ${documentName}`);
      setMessageType("error");
    } finally {
      setLoadingDocId(null);
    }
  };

  const EVALUATION_GRADES = ["EXCELLENT", "GOOD", "ACCEPTABLE", "DEFICIENT"];
  const EVALUATION_GRADE_LABELS = {
    EXCELLENT: "Excelente",
    GOOD: "Bueno",
    ACCEPTABLE: "Aceptable",
    DEFICIENT: "Deficiente",
  };

  const PROPOSAL_ASPECTS = [
    { key: "summary", label: "Resumen", description: "El resumen presenta una explicación clara de las principales características del trabajo a realizar y los resultados esperados." },
    { key: "backgroundJustification", label: "Antecedentes y Justificación", description: "La propuesta se encuentra correctamente referenciada, se basa en una revisión bibliográfica actual y pertinente, incluyendo análisis y descripción de la problemática estudiada." },
    { key: "problemStatement", label: "Formulación del Problema", description: "La pregunta de investigación ha sido delimitada y definida con claridad y precisión. Se evidencia la importancia y justificación de la realización del estudio." },
    { key: "objectives", label: "Objetivos", description: "El objetivo general de la propuesta está acorde al título planteado y los objetivos específicos son alcanzables con la metodología propuesta." },
    { key: "methodology", label: "Metodología", description: "La metodología utilizada para la adquisición, procesamiento, interpretación y análisis de datos es clara y adecuada en la búsqueda de los objetivos planteados. Las técnicas cualitativas o cuantitativas son coherentes con la metodología propuesta." },
    { key: "bibliographyReferences", label: "Bibliografía o referencias", description: "Las referencias bibliográficas empleadas son pertinentes, actuales y están citadas de forma adecuada en el documento siguiendo las normas APA (7.ª edición). Proyecto de grado: Mínimo 10 referencias con mínimo 5 DOI. Pasantía Supervisada: Mínimo 10 referencias con mínimo 3 DOI." },
    { key: "documentOrganization", label: "Organización del documento", description: "El documento presenta manejo adecuado del lenguaje en términos de ortografía, redacción, fluidez y composición gramatical. Se encuentra en el formato vigente para la presentación del mismo." },
  ];

  const handleProposalEvalChange = (key, value) => {
    setReviewData(prev => ({
      ...prev,
      proposalEvaluation: {
        ...prev.proposalEvaluation,
        [key]: value,
      },
    }));
  };

  const resetReviewData = () => {
    setReviewData({
      status: "",
      notes: "",
      proposalEvaluation: {
        summary: "",
        backgroundJustification: "",
        problemStatement: "",
        objectives: "",
        methodology: "",
        bibliographyReferences: "",
        documentOrganization: "",
      },
    });
  };

  const handleSubmitReview = async (studentDocumentId, docType) => {
    if (!reviewData.status) {
      setMessage("Debes seleccionar una decisión");
      setMessageType("error");
      return;
    }

    if (
      (reviewData.status === EXAMINER_DOCUMENT_STATUS.CORRECTIONS ||
       reviewData.status === EXAMINER_DOCUMENT_STATUS.REJECTED) &&
      !reviewData.notes.trim()
    ) {
      setMessage("Debes proporcionar notas al solicitar correcciones");
      setMessageType("error");
      return;
    }

    // Validar rúbrica solo para documentos MANDATORY
    if (docType === "MANDATORY") {
      const eval_ = reviewData.proposalEvaluation;
      const allFilled = PROPOSAL_ASPECTS.every(a => eval_[a.key] && eval_[a.key] !== "");
      if (!allFilled) {
        setMessage("Debes calificar todos los aspectos de la evaluación de la propuesta");
        setMessageType("error");
        return;
      }
    }

    setSubmittingReview(true);

    try {
      const payload = {
        status: reviewData.status,
        notes: reviewData.notes,
      };

      // Solo enviar proposalEvaluation para documentos MANDATORY
      if (docType === "MANDATORY") {
        payload.proposalEvaluation = reviewData.proposalEvaluation;
      }

      const response = await reviewDocumentExaminer(studentDocumentId, payload);
      
      setMessage(response.message || "Documento revisado correctamente");
      setMessageType("success");

      setReviewingDocId(null);
      resetReviewData();

      await fetchProfile();

      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (err) {
      console.error("Error:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGradeChange = (grade) => {
    setEvaluationData({
      ...evaluationData,
      grade,
      decision: getSuggestedDecision(grade),
    });
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();

    if (!evaluationData.grade || !evaluationData.decision) {
      setMessage("Debes proporcionar calificación y decisión");
      setMessageType("error");
      return;
    }

    if (!evaluationData.observations.trim()) {
      setMessage("Debes proporcionar observaciones");
      setMessageType("error");
      return;
    }

    if (!isGradeConsistentWithDecision(evaluationData.grade, evaluationData.decision)) {
      setMessage("La calificación no es consistente con la decisión");
      setMessageType("error");
      return;
    }

    setSubmittingEvaluation(true);

    try {
      const response = await registerEvaluation(studentModalityId, {
        grade: parseFloat(evaluationData.grade),
        decision: evaluationData.decision,
        observations: evaluationData.observations,
      });

      setMessage(response.message || "Evaluación registrada correctamente");
      setMessageType("success");

      setShowEvaluationForm(false);
      setEvaluationData({ grade: "", decision: "", observations: "" });

      await fetchProfile();

      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 10000);
    } catch (err) {
      console.error("Error:", err);
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const canReviewDocuments = () => {
    return profile?.currentStatus === "EXAMINERS_ASSIGNED" || 
           profile?.currentStatus === "READY_FOR_EXAMINERS" ||
           profile?.currentStatus === "CORRECTIONS_REQUESTED_EXAMINERS" ||
           profile?.currentStatus === "CORRECTIONS_SUBMITTED_TO_EXAMINERS";
  };

  const executeConfirmAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    // No more approve/finalize actions needed - handled automatically by backend
  };

  const canEvaluate = () => {
    // Solo se puede evaluar DESPUÉS de que la sustentación fue programada
    const validStatuses = [
      "DEFENSE_SCHEDULED",
      "DEFENSE_COMPLETED",
      "UNDER_EVALUATION_PRIMARY_EXAMINERS",
      "UNDER_EVALUATION_TIEBREAKER",
      "DISAGREEMENT_REQUIRES_TIEBREAKER"
    ];

    // Puede evaluar si el estado es válido Y NO ha evaluado
    const statusValid = validStatuses.includes(profile?.currentStatus);
    const notEvaluated = !hasEvaluated();
    
    console.log("🔍 canEvaluate check:", {
      currentStatus: profile?.currentStatus,
      statusValid,
      hasEvaluated: hasEvaluated(),
      notEvaluated,
      result: statusValid && notEvaluated
    });

    return statusValid && notEvaluated;
  };

  const hasEvaluated = () => {
    return profile?.hasEvaluated === true;
  };

  

  if (loading) {
    return (
      <div className="examiner-profile-container">
        <div className="examiner-profile-loading">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="examiner-profile-container">
        <div className="examiner-profile-message error">
          No se pudo cargar el perfil
        </div>
        <button 
          onClick={() => navigate("/examiner")} 
          className="examiner-profile-back-btn"
        >
          ← Volver
        </button>
      </div>
    );
  }

  

  return (
    <div className="examiner-profile-container">
      {/* Header */}
       <div className="student-profile-header">
        <h2 className="student-profile-title">Perfil del Estudiante - Jurado </h2>
        <p className="student-profile-subtitle">En este espacio podrá revisar los trabajos asignados, analizar cada entrega con base en los criterios establecidos, registrar observaciones y emitir su concepto final de manera objetiva y fundamentada.

</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`examiner-profile-message ${messageType}`}>
          {message}
          <button 
            onClick={() => setMessage("")} 
            className="examiner-profile-close-btn"
          >
            ✕
          </button>
        </div>
      )}


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
            <span className={`student-info-value ${profile.currentStatus === "MODALITY_CLOSED" ? "closed" : ""}`}>
              {profile.currentStatus === "MODALITY_CLOSED" && "🔒 "}{profile.currentStatusDescription}
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
                <span className="student-info-value">{profile.projectDirectorEmail}</span>
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

      {/* Examiner Role */}
{loadingExaminerRole && (
  <div className="examiner-profile-card examiner-profile-card-student">
    <h3 className="examiner-role-title"> Mi Rol como Jurado</h3>
    <div>Cargando información del rol...</div>
  </div>
)}

{examinerRoleError && (
  <div className="examiner-profile-card examiner-profile-card-student">
    <h3 className="examiner-role-title"> Mi Rol como Jurado</h3>
    <div style={{ color: "red" }}>{examinerRoleError}</div>
  </div>
)}

{examinerRoleInfo && !loadingExaminerRole && (
  <div className="student-info-card">
    <h3 className="examiner-profile-card-title"> Mi Rol como Jurado</h3>

    <div className="examiner-profile-value email">
      {examinerRoleInfo.examinerType === "PRIMARY_EXAMINER_1" && " Jurado Principal 1"}
      {examinerRoleInfo.examinerType === "PRIMARY_EXAMINER_2" && " Jurado Principal 2"}
      {examinerRoleInfo.examinerType === "TIEBREAKER_EXAMINER" && " Jurado de Desempate"}
    </div>

    {examinerRoleInfo.assignmentDate && (
      <div className="examiner-role-date">
        Asignado: {formatDate(examinerRoleInfo.assignmentDate)}
      </div>
    )}
  </div>
)}

      {/* Documents */}
      {profile.documents && profile.documents.filter(d => d.uploaded).length > 0 && (
        <div className="examiner-profile-card examiner-profile-card-student">
          <div className="examiner-doc-header-top">
            <h3 className="examiner-doc-title"> Documentos para Revisión</h3>
          </div>

          {profile.documents.filter(d => d.uploaded).map((doc) => (
            <div
              key={doc.studentDocumentId || Math.random()}
              className={`examiner-doc-item ${doc.status?.includes("ACCEPTED") ? "accepted" : "pending"}`}
            >
              <div className="examiner-doc-header">
                <div>
                  <div className="examiner-doc-name">{doc.documentName}</div>
                  <div className="examiner-doc-type">Tipo de documento: {translateDocumentType(doc.documentType)}</div>
                </div>
                <span className={`examiner-doc-status ${doc.status?.includes("ACCEPTED") ? "approved" : "pending"}`}> {translateDocumentStatus(doc.status)} </span>
              </div>

              {doc.notes && (
                <div className="examiner-doc-notes">
                  <strong>Notas previas:</strong>
                  <p>{doc.notes}</p>
                </div>
              )}

              <div className="examiner-doc-actions">
                <button
                  onClick={() => handleViewDocument(doc.studentDocumentId, doc.documentName)}
                  disabled={loadingDocId === doc.studentDocumentId}
                  className="examiner-doc-btn view"
                >
                  {loadingDocId === doc.studentDocumentId ? "Cargando..." : " Ver Documento"}
                </button>

                {canReviewDocuments() && !doc.status?.includes("ACCEPTED_FOR_EXAMINER") && (
                  <button
                    onClick={() => {
                      if (reviewingDocId === doc.studentDocumentId) {
                        setReviewingDocId(null);
                      } else {
                        setReviewingDocId(doc.studentDocumentId);
                        resetReviewData();
                      }
                    }}
                    className={`examiner-doc-btn ${reviewingDocId === doc.studentDocumentId ? "cancel" : "review"}`}
                  >
                    {reviewingDocId === doc.studentDocumentId ? "✕ Cancelar" : "📝 Evaluar"}
                  </button>
                )}
              </div>

              {reviewingDocId === doc.studentDocumentId && (
                <div className="examiner-review-panel">
                  <h4 className="examiner-review-title">Evaluación: {doc.documentName}</h4>

                  {/* Rúbrica de evaluación - solo para documentos MANDATORY */}
                  {doc.documentType === "MANDATORY" && (
                    <div className="examiner-rubric-section">
                      <h5 className="examiner-rubric-title">Aspectos para evaluar</h5>
                      <p className="examiner-rubric-subtitle">Califique cada aspecto de la propuesta según los criterios establecidos.</p>
                      
                      <div className="examiner-rubric-table">
                        <div className="examiner-rubric-header">
                          <div className="examiner-rubric-col-aspect">Aspecto</div>
                          {EVALUATION_GRADES.map(g => (
                            <div key={g} className="examiner-rubric-col-grade">{EVALUATION_GRADE_LABELS[g]}</div>
                          ))}
                        </div>
                        
                        {PROPOSAL_ASPECTS.map(aspect => (
                          <div key={aspect.key} className="examiner-rubric-row">
                            <div className="examiner-rubric-col-aspect">
                              <div className="examiner-rubric-aspect-label">{aspect.label}</div>
                              <div className="examiner-rubric-aspect-desc">{aspect.description}</div>
                            </div>
                            {EVALUATION_GRADES.map(g => (
                              <div key={g} className="examiner-rubric-col-grade">
                                <label className="examiner-rubric-radio-label">
                                  <input
                                    type="radio"
                                    name={`rubric-${aspect.key}`}
                                    value={g}
                                    checked={reviewData.proposalEvaluation[aspect.key] === g}
                                    onChange={() => handleProposalEvalChange(aspect.key, g)}
                                    disabled={submittingReview}
                                    className="examiner-rubric-radio"
                                  />
                                  <span className="examiner-rubric-radio-custom"></span>
                                  <span className="examiner-rubric-grade-mobile">{EVALUATION_GRADE_LABELS[g]}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decisión */}
                  <div className="examiner-form-group">
                    <label className="examiner-form-label">Decisión sobre el documento *</label>
                    <div className="examiner-decision-options">
                      <label className={`examiner-decision-option ${reviewData.status === EXAMINER_DOCUMENT_STATUS.ACCEPTED ? "selected accepted" : ""}`}>
                        <input
                          type="radio"
                          name="review-decision"
                          value={EXAMINER_DOCUMENT_STATUS.ACCEPTED}
                          checked={reviewData.status === EXAMINER_DOCUMENT_STATUS.ACCEPTED}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                          disabled={submittingReview}
                        />
                        <span className="examiner-decision-icon"></span>
                        <div className="examiner-decision-text">
                          <strong>Avalar propuesta sin modificaciones</strong>
                          <span>Apruebo la propuesta tal como está presentada.</span>
                        </div>
                      </label>
                      <label className={`examiner-decision-option ${reviewData.status === EXAMINER_DOCUMENT_STATUS.CORRECTIONS ? "selected corrections" : ""}`}>
                        <input
                          type="radio"
                          name="review-decision"
                          value={EXAMINER_DOCUMENT_STATUS.CORRECTIONS}
                          checked={reviewData.status === EXAMINER_DOCUMENT_STATUS.CORRECTIONS}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                          disabled={submittingReview}
                        />
                        <span className="examiner-decision-icon"></span>
                        <div className="examiner-decision-text">
                          <strong>Apruebo con modificaciones</strong>
                          <span>Apruebo la propuesta siempre y cuando se realicen las modificaciones. Se requiere el concepto del director sobre las modificaciones propuestas dentro de los treinta (30) días calendario siguientes.</span>
                        </div>
                      </label>
                      <label className={`examiner-decision-option ${reviewData.status === EXAMINER_DOCUMENT_STATUS.REJECTED ? "selected rejected" : ""}`}>
                        <input
                          type="radio"
                          name="review-decision"
                          value={EXAMINER_DOCUMENT_STATUS.REJECTED}
                          checked={reviewData.status === EXAMINER_DOCUMENT_STATUS.REJECTED}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                          disabled={submittingReview}
                        />
                        <span className="examiner-decision-icon"></span>
                        <div className="examiner-decision-text">
                          <strong>No apruebo la propuesta</strong>
                          <span>Se requieren cambios sustanciales. Es necesario un replanteamiento de la propuesta e iniciar un nuevo proceso de evaluación. El documento ajustado debe entregarse máximo 30 días calendario.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="examiner-form-group">
                    <label className="examiner-form-label">
                      Observaciones {(reviewData.status === EXAMINER_DOCUMENT_STATUS.CORRECTIONS || reviewData.status === EXAMINER_DOCUMENT_STATUS.REJECTED) ? "*" : ""}
                    </label>
                    <textarea
                      value={reviewData.notes}
                      onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                      rows="5"
                      placeholder="Si considera necesario amplíe la evaluación con sus observaciones..."
                      className="examiner-form-textarea"
                      disabled={submittingReview}
                    />
                  </div>

                  <div className="examiner-form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingDocId(null);
                        resetReviewData();
                      }}
                      className="examiner-doc-btn cancel"
                      disabled={submittingReview}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSubmitReview(doc.studentDocumentId, doc.documentType)}
                      disabled={submittingReview}
                      className="examiner-form-submit"
                    >
                      {submittingReview ? "Enviando..." : "Enviar Evaluación"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Section */}
      {canEvaluate() && (
        <div className="examiner-eval-section">
          <h3 className="examiner-profile-card-title">Evaluación de la Sustentación</h3>
          <div className="examiner-eval-block">
            {!showEvaluationForm ? (
              <div className="examiner-eval-empty">
                <div className="examiner-eval-icon">📝</div>
                <h3 className="examiner-eval-title">Registrar Evaluación Final</h3>
                <div className="examiner-eval-message">
                  <span className="examiner-eval-alert">Todos los documentos han sido aprobados.</span><br/>
                  Una vez realizada la sustentación, debes registrar en este apartado la calificación que fue otorgada al estudiante durante la sesión.<br/>
                  <span style={{color:'#7A1117',fontWeight:600}}>Recuerda:</span> Asegúrate de consignar exactamente la nota definida y comunicada en el momento de la evaluación, junto con las observaciones correspondientes.<br/>
                  <span style={{color:'#B7A873'}}>La información registrada debe reflejar fielmente la decisión adoptada y el desempeño evidenciado por el estudiante durante la sustentación.</span>
                </div>
                <button
                  onClick={() => setShowEvaluationForm(true)}
                  className="examiner-eval-btn"
                >
                 Registrar Evaluación
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitEvaluation} className="examiner-eval-form">
                <div className="examiner-form-group">
                  <label className="examiner-form-label">Calificación (0.0 - 5.0) *</label>
                  <select
                    value={evaluationData.grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="examiner-form-select"
                    disabled={submittingEvaluation}
                    required
                  >
                    <option value="">Seleccionar calificación...</option>
                    <option value="0.0">0.0</option>
                    <option value="0.5">0.5</option>
                    <option value="1.0">1.0</option>
                    <option value="1.5">1.5</option>
                    <option value="2.0">2.0</option>
                    <option value="2.5">2.5</option>
                    <option value="3.0">3.0</option>
                    <option value="3.5">3.5</option>
                    <option value="4.0">4.0</option>
                    <option value="4.5">4.5</option>
                    <option value="5.0">5.0</option>
                  </select>
                </div>
                <div className="examiner-form-group">
                  <label className="examiner-form-label">Decisión *</label>
                  <select
                    value={evaluationData.decision}
                    onChange={(e) => setEvaluationData({ ...evaluationData, decision: e.target.value })}
                    className="examiner-form-select"
                    disabled={submittingEvaluation}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value={EXAMINER_DECISIONS.REJECTED}> Reprobado (0.0 - 2.9)</option>
                    <option value={EXAMINER_DECISIONS.APPROVED_NO_DISTINCTION}> Aprobado (3.0 - 3.9)</option>
                    <option value={EXAMINER_DECISIONS.APPROVED_MERITORIOUS}> Meritorio (4.0 - 4.4)</option>
                    <option value={EXAMINER_DECISIONS.APPROVED_LAUREATE}> Laureado (4.5 - 5.0)</option>
                  </select>
                </div>
                <div className="examiner-form-group">
                  <label className="examiner-form-label">Observaciones *</label>
                  <textarea
                    value={evaluationData.observations}
                    onChange={(e) => setEvaluationData({ ...evaluationData, observations: e.target.value })}
                    rows="6"
                    placeholder="Observaciones detalladas..."
                    className="examiner-form-textarea"
                    disabled={submittingEvaluation}
                    required
                  />
                </div>
                <div className="examiner-form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEvaluationForm(false);
                      setEvaluationData({ grade: "", decision: "", observations: "" });
                    }}
                    className="examiner-doc-btn cancel"
                    disabled={submittingEvaluation}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="examiner-eval-btn"
                    disabled={submittingEvaluation}
                    style={{ flex: 1 }}
                  >
                    {submittingEvaluation ? "Registrando..." : "Registrar Evaluación"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Already Evaluated */}
      {hasEvaluated() && registeredEvaluation && (() => {
        let decisionLabel = '';
        switch (registeredEvaluation.decision) {
          case 'REJECTED':
            decisionLabel = ' Reprobado';
            break;
          case 'APPROVED_NO_DISTINCTION':
            decisionLabel = ' Aprobado';
            break;
          case 'APPROVED_MERITORIOUS':
            decisionLabel = ' Meritorio';
            break;
          case 'APPROVED_LAUREATE':
            decisionLabel = ' Laureado';
            break;
          default:
            decisionLabel = registeredEvaluation.decision;
        }
        let examinerTypeLabel = '';
        switch (registeredEvaluation.examinerType) {
          case 'PRIMARY_EXAMINER_1':
            examinerTypeLabel = 'Jurado Principal 1';
            break;
          case 'PRIMARY_EXAMINER_2':
            examinerTypeLabel = 'Jurado Principal 2';
            break;
          case 'TIEBREAKER_EXAMINER':
            examinerTypeLabel = 'Jurado de Desempate';
            break;
          default:
            examinerTypeLabel = registeredEvaluation.examinerType;
        }
        return (
          <section className="examiner-eval-completed-block">
            <h3 className="examiner-eval-completed-title">Evaluación Final Registrada</h3>
            <div className="examiner-eval-completed-grid">
              <div className="eval-row">
                <span className="eval-label">Calificación:</span>
                <span className="eval-value examiner-eval-date">{registeredEvaluation.grade}</span>
              </div>
              <div className="eval-row">
                <span className="eval-label">Decisión:</span>
                <span className="eval-value examiner-eval-date">{decisionLabel}</span>
              </div>
              <div className="eval-row">
                <span className="eval-label">Observaciones:</span>
                <span className="eval-value examiner-eval-date">{registeredEvaluation.observations}</span>
              </div>
              <div className="eval-row">
                <span className="eval-label">Fecha de Evaluación:</span>
                <span className="eval-value examiner-eval-date">{registeredEvaluation.evaluationDate ? new Date(registeredEvaluation.evaluationDate).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span>
              </div>
              <div className="eval-row">
                <span className="eval-label">Tipo de Jurado:</span>
                <span className="eval-value examiner-eval-date">{examinerTypeLabel}</span>
              </div>
              
            </div>
          </section>
        );
      })()}

      <button
          onClick={() => navigate("/examiner")}
          className="examiner-profile-back-btn"
        >
          ← Volver a Mis Asignaciones
        </button>

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
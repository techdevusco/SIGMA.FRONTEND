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
    case "EDIT_REQUESTED":
      return "Edición solicitada por estudiante";
    case "EDIT_REQUEST_APPROVED":
      return "Edición aprobada — Puede resubir";
    case "EDIT_REQUEST_REJECTED":
      return "Solicitud de edición rechazada";
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
  reviewFinalDocumentExaminer,
  getExaminerProposalEvaluation,
  getExaminerFinalEvaluation,
  registerEvaluation,
  formatDate,
  getErrorMessage,
  EXAMINER_DOCUMENT_STATUS,
  getExaminerTypeForModality,
  getExaminerEvaluation,
  getDocumentEditRequests,
  voteDocumentEditRequest,
} from "../../services/examinerService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/examiners/examinerstudentprofile.css";
import "../../styles/council/studentprofile.css"

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
  const [reviewData, setReviewData] = useState({
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
    finalEvaluation: {
      summary: "",
      introduction: "",
      materialsAndMethods: "",
      materialsMethods: "",
      resultsAndDiscussion: "",
      conclusions: "",
      bibliographyReferences: "",
      documentOrganization: "",
      prototypeSoftware: "",
      prototypeDeviceSoftware: "",
    },
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [finalizingReview, setFinalizingReview] = useState(false);
  const [approvingModality, setApprovingModality] = useState(false);

  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    grade: "",
    observations: "",
    defenseCriteria: {
      domainAndClarity: "",
      synthesisAndCommunication: "",
      argumentationAndResponse: "",
      innovationAndImpact: "",
      professionalPresentation: "",
    },
    proposedMention: "",
  });
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
  const [evalValidationErrors, setEvalValidationErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);

  const [registeredEvaluation, setRegisteredEvaluation] = useState(null);

  // ── Solicitudes de edición de documento ──
  const [editRequests, setEditRequests] = useState([]);
  const [editRequestsSummary, setEditRequestsSummary] = useState(null);
  const [loadingEditRequests, setLoadingEditRequests] = useState(false);
  const [votingEditRequestId, setVotingEditRequestId] = useState(null);
  const [voteData, setVoteData] = useState({ approved: null, resolutionNotes: "" });
  const [submittingVote, setSubmittingVote] = useState(false);
  const [myDocumentEvaluations, setMyDocumentEvaluations] = useState({});
  const [loadingMyDocumentEvaluations, setLoadingMyDocumentEvaluations] = useState(false);

  useEffect(() => {
  if (!studentModalityId) return;

  fetchProfile();
  fetchExaminerRole();
  fetchEditRequests();
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

  const fetchEditRequests = async () => {
    try {
      setLoadingEditRequests(true);
      const data = await getDocumentEditRequests(studentModalityId);
      if (data?.success) {
        setEditRequests(data.editRequests || []);
        setEditRequestsSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Error obteniendo solicitudes de edición:", err);
    } finally {
      setLoadingEditRequests(false);
    }
  };

  const handleVoteEditRequest = async (editRequestId) => {
    if (voteData.approved === null) return;
    if (voteData.approved === false && !voteData.resolutionNotes.trim()) return;

    try {
      setSubmittingVote(true);
      const res = await voteDocumentEditRequest(editRequestId, voteData.approved, voteData.resolutionNotes.trim());
      setMessage(res.message || "Voto registrado correctamente");
      setMessageType("success");
      setVotingEditRequestId(null);
      setVoteData({ approved: null, resolutionNotes: "" });
      await fetchEditRequests();
      await fetchProfile();
    } catch (err) {
      console.error("Error al votar solicitud:", err);
      const errorMsg = err.response?.data?.message || "Error al registrar el voto";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setSubmittingVote(false);
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

  const EVALUATION_GRADES = ["DEFICIENT", "ACCEPTABLE", "GOOD", "EXCELLENT"];
  const EVALUATION_GRADE_LABELS = {
    EXCELLENT: "Excelente",
    GOOD: "Bueno",
    ACCEPTABLE: "Aceptable",
    DEFICIENT: "Deficiente",
  };

  // ── Rúbrica de evaluación de sustentación (imagen oficial) ──
  const DEFENSE_GRADE_SCALE = [
    { value: "Insufficient", label: "Insuficiente", shortLabel: "I" },
    { value: "Acceptable", label: "Aceptable", shortLabel: "A" },
    { value: "Good", label: "Bueno", shortLabel: "B" },
    { value: "Excellent", label: "Excelente", shortLabel: "E" },
  ];

  const DEFENSE_CRITERIA = [
    { key: "domainAndClarity", label: "Dominio del tema y claridad conceptual", description: "El estudiante demuestra comprensión integral del problema abordado, los fundamentos teóricos y la metodología empleada. Explica con claridad los conceptos técnicos y la coherencia del proceso desarrollado. Expone de manera clara las conclusiones y recomendaciones, evidenciando su relación con los objetivos del proyecto y los resultados obtenidos." },
    { key: "synthesisAndCommunication", label: "Capacidad de síntesis y comunicación oral", description: "Expone la información de forma ordenada, coherente y ajustada al tiempo asignado. Utiliza un lenguaje técnico apropiado y mantiene el interés de la audiencia." },
    { key: "argumentationAndResponse", label: "Argumentación y capacidad de respuesta", description: "Responde de manera clara, fundamentada y segura a las preguntas del jurado. Justifica las decisiones tomadas durante el desarrollo del proyecto y demuestra pensamiento crítico." },
    { key: "innovationAndImpact", label: "Innovación, impacto y aplicación del trabajo", description: "Explica los aportes del proyecto en términos de innovación, pertinencia y posible impacto en el sector agropecuario o tecnológico. Evidencia comprensión de la aplicabilidad de sus resultados." },
    { key: "professionalPresentation", label: "Presentación profesional y manejo del material de apoyo", description: "Emplea adecuadamente recursos audiovisuales, con presentaciones claras y bien estructuradas. Mantiene una actitud profesional, dominio escénico y uso correcto del lenguaje." },
  ];

  const DEFENSE_GRADE_LABEL_MAP = {
    Insufficient: "Insuficiente (I)",
    Acceptable: "Aceptable (A)",
    Good: "Bueno (B)",
    Excellent: "Excelente (E)",
  };

  const MENTION_OPTIONS = [
    { value: "", label: "Sin mención" },
    { value: "MERITORIOUS", label: "Meritorio" },
    { value: "LAUREATE", label: "Laureado" },
  ];

  const PROPOSAL_ASPECTS = [
    { key: "summary", label: "Resumen", description: "El resumen presenta una explicación clara de las principales características del trabajo a realizar y los resultados esperados." },
    { key: "backgroundJustification", label: "Antecedentes y Justificación", description: "La propuesta se encuentra correctamente referenciada, se basa en una revisión bibliográfica actual y pertinente, incluyendo análisis y descripción de la problemática estudiada." },
    { key: "problemStatement", label: "Formulación del Problema", description: "La pregunta de investigación ha sido delimitada y definida con claridad y precisión. Se evidencia la importancia y justificación de la realización del estudio." },
    { key: "objectives", label: "Objetivos", description: "El objetivo general de la propuesta está acorde al título planteado y los objetivos específicos son alcanzables con la metodología propuesta." },
    { key: "methodology", label: "Metodología", description: "La metodología utilizada para la adquisición, procesamiento, interpretación y análisis de datos es clara y adecuada en la búsqueda de los objetivos planteados. Las técnicas cualitativas o cuantitativas son coherentes con la metodología propuesta." },
    { key: "bibliographyReferences", label: "Bibliografía o referencias", description: "Las referencias bibliográficas empleadas son pertinentes, actuales y están citadas de forma adecuada en el documento siguiendo las normas APA (7.ª edición). Proyecto de grado: Mínimo 10 referencias con mínimo 5 DOI. Pasantía Supervisada: Mínimo 10 referencias con mínimo 3 DOI." },
    { key: "documentOrganization", label: "Organización del documento", description: "El documento presenta manejo adecuado del lenguaje en términos de ortografía, redacción, fluidez y composición gramatical. Se encuentra en el formato vigente para la presentación del mismo." },
  ];

  const FINAL_DOCUMENT_ASPECTS = [
    { key: "summary", label: "Resumen", description: "El resumen presenta una explicación clara y coherente de las principales características del trabajo realizado, incluyendo de forma concisa el propósito del estudio, la metodología empleada, los principales resultados y las conclusiones más relevantes. Debe redactarse en un solo párrafo continuo, en tiempo pasado y voz impersonal, sin citas ni referencias, con una extensión entre 150 y 250 palabras, e incorporar de tres a seis palabras clave, ordenadas alfabéticamente y coherentes con el contenido del documento." },
    { key: "introduction", label: "Introducción", description: "La introducción es apropiada y está correctamente referenciada. Presenta el contexto y la relevancia del tema de estudio, así como un estado del arte o revisión selectiva de la literatura pertinente, con referencias actualizadas y verificables (mínimo seis con DOI). Incluye el análisis y descripción de la problemática (antecedentes, hechos, causas y efectos) sustentada en fuentes académicas. Se identifican los fundamentos teóricos y conceptuales que respaldan el trabajo, y la pregunta o problema de investigación está claramente delimitada y definida con precisión. Además, se evidencia la importancia y justificación de la investigación en términos científicos, tecnológicos o sociales, y se enuncian de forma coherente el objetivo general y los objetivos específicos." },
    { key: "materialsAndMethods", label: "Materiales y Métodos", description: "La metodología utilizada para la adquisición, procesamiento, interpretación y análisis de datos es clara y adecuada para alcanzar los objetivos planteados. La descripción incluye de forma ordenada el tipo de estudio, el lugar y periodo de ejecución, las condiciones geo-climáticas, los materiales, equipos e instrumentos empleados, así como los procedimientos, métodos de laboratorio o de campo, el diseño estadístico y el análisis de datos aplicados. Las técnicas cualitativas o cuantitativas son coherentes con la metodología propuesta. La redacción está en tiempo pasado y voz impersonal, sin incluir juicios de valor, e incorpora, cuando corresponde, los aspectos éticos y las normas o protocolos utilizados." },
    { key: "resultsAndDiscussion", label: "Resultados y Discusión", description: "La sección de Resultados y Discusión presenta y analiza de manera clara, coherente y objetiva los hallazgos del estudio, respondiendo a los postulados y objetivos planteados. Los resultados se exponen de forma ordenada y sustentada mediante tablas, cuadros, planos, gráficos y/o figuras correctamente elaborados y referenciados, sin duplicar información. La discusión interpreta los resultados con base en los objetivos del trabajo, contrastándolos con la literatura científica actual, destacando los aportes derivados del proyecto y señalando sus implicaciones o limitaciones. Se evidencia una adecuada relación entre los datos obtenidos y las conclusiones, evitando repetir información o incluir elementos del marco teórico. La redacción mantiene coherencia, precisión y un uso correcto de los tiempos verbales." },
    { key: "conclusions", label: "Conclusiones", description: "Las conclusiones presentan de manera clara y coherente los aportes y resultados más relevantes del estudio, respondiendo directamente a los objetivos propuestos. Se evidencia la capacidad de síntesis, el pensamiento crítico y la interpretación de los hallazgos sin reiterar datos. Las conclusiones reflejan la pertinencia e impacto del trabajo, su contribución al campo de estudio y la posibilidad de aplicación o continuidad en futuras investigaciones." },
    { key: "bibliographyReferences", label: "Bibliografía o referencias", description: "Las referencias bibliográficas se presentan completas, actualizadas y correctamente citadas según las normas APA (7.a edición). Existe coherencia entre las citas del texto y la lista final de referencias. Se evidencia el uso de fuentes académicas y científicas pertinentes al tema, priorizando aquellas con DOI o enlace verificable. La presentación mantiene uniformidad, orden alfabético y formato adecuado." },
    { key: "documentOrganization", label: "Organización del documento", description: "Evalúe si el documento cumple con la estructura y los requisitos formales establecidos: orden de secciones, formato tipográfico, extensión total (no superior a treinta (30) páginas) y correcta aplicación de las normas de citación y referencia (APA, 7.a edición). Verifique la coherencia y fluidez entre las partes, la adecuada jerarquización de títulos y subtítulos, y la ubicación apropiada de tablas, figuras y ecuaciones conforme a las normas del manuscrito. Considere la claridad, cohesión y consistencia argumentativa en el desarrollo del texto, así como el manejo del lenguaje académico, la redacción científica y la precisión técnica. El documento debe reflejar organización, presentación profesional y cumplimiento integral de los lineamientos establecidos por el programa." },
    { key: "prototypeSoftware", label: "Prototipo, dispositivo o software (Si aplica)", description: "Es funcional y cumple con los objetivos del proyecto de grado." },
  ];

  const isFinalDocumentForExaminer = (doc) => {
    const name = (doc?.documentName || "").toLowerCase();
    return doc?.documentType === "SECONDARY" && (
      doc?.requiresProposalEvaluation === true ||
      doc?.templateDocumentId === 4 ||
      name.includes("documento final")
    );
  };

  const isDocumentEligibleForMyEvaluationView = (doc) => {
    if (!doc?.uploaded) return false;
    if (doc.documentType === "MANDATORY") return true;
    return isFinalDocumentForExaminer(doc);
  };

  const getGradeLabel = (value) => {
    if (!value) return "—";
    const labelMap = {
      DEFICIENT: "Deficiente",
      ACCEPTABLE: "Aceptable",
      GOOD: "Bueno",
      EXCELLENT: "Excelente",
      Deficient: "Deficiente",
      Acceptable: "Aceptable",
      Good: "Bueno",
      Excellent: "Excelente",
      Insufficient: "Deficiente",
      INSUFFICIENT: "Deficiente",
    };
    return labelMap[value] || value;
  };

  const getFinalEvaluationValue = (finalEvaluation, key) => {
    if (!finalEvaluation) return null;
    if (key === "materialsAndMethods") {
      return finalEvaluation.materialsAndMethods || finalEvaluation.materialsMethods || null;
    }
    if (key === "prototypeSoftware") {
      return finalEvaluation.prototypeSoftware || finalEvaluation.prototypeDeviceSoftware || null;
    }
    return finalEvaluation[key] || null;
  };

  useEffect(() => {
    const loadMyDocumentEvaluations = async () => {
      if (!Array.isArray(profile?.documents) || profile.documents.length === 0) {
        setMyDocumentEvaluations({});
        return;
      }

      const eligibleDocs = profile.documents.filter(isDocumentEligibleForMyEvaluationView);
      if (eligibleDocs.length === 0) {
        setMyDocumentEvaluations({});
        return;
      }

      setLoadingMyDocumentEvaluations(true);
      try {
        const responses = await Promise.all(
          eligibleDocs.map(async (doc) => {
            try {
              const res = doc.documentType === "MANDATORY"
                ? await getExaminerProposalEvaluation(doc.studentDocumentId)
                : await getExaminerFinalEvaluation(doc.studentDocumentId);
              return [doc.studentDocumentId, res];
            } catch (err) {
              return [doc.studentDocumentId, {
                success: false,
                message: getErrorMessage(err),
              }];
            }
          })
        );

        const mapped = {};
        responses.forEach(([docId, data]) => {
          mapped[docId] = data;
        });
        setMyDocumentEvaluations(mapped);
      } finally {
        setLoadingMyDocumentEvaluations(false);
      }
    };

    loadMyDocumentEvaluations();
  }, [profile]);

  const handleProposalEvalChange = (key, value) => {
    setReviewData(prev => ({
      ...prev,
      proposalEvaluation: {
        ...prev.proposalEvaluation,
        [key]: value,
      },
    }));
  };

  const handleFinalEvalChange = (key, value) => {
    setReviewData(prev => {
      const nextFinalEvaluation = {
        ...prev.finalEvaluation,
        [key]: value,
      };

      if (key === "materialsAndMethods") {
        nextFinalEvaluation.materialsMethods = value;
      }
      if (key === "prototypeSoftware") {
        nextFinalEvaluation.prototypeDeviceSoftware = value;
      }

      return {
        ...prev,
        finalEvaluation: nextFinalEvaluation,
      };
    });
  };

  const handleDefenseCriteriaChange = (key, value) => {
    setEvaluationData(prev => ({
      ...prev,
      defenseCriteria: {
        ...prev.defenseCriteria,
        [key]: value,
      },
    }));
    // Clear rubric error when user fills a criterion
    if (evalValidationErrors.rubric) {
      setEvalValidationErrors(prev => { const n = {...prev}; delete n.rubric; return n; });
    }
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
      finalEvaluation: {
        summary: "",
        introduction: "",
        materialsAndMethods: "",
        materialsMethods: "",
        resultsAndDiscussion: "",
        conclusions: "",
        bibliographyReferences: "",
        documentOrganization: "",
        prototypeSoftware: "",
        prototypeDeviceSoftware: "",
      },
    });
  };

  const handleSubmitReview = async (studentDocumentId, doc) => {
    const docType = doc?.documentType;
    const isFinalDocument = isFinalDocumentForExaminer(doc);

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

    // Validar rúbrica solo para Documento Final (SECONDARY que requiere evaluación)
    if (isFinalDocument) {
      const eval_ = reviewData.finalEvaluation;
      const requiredFinalKeys = FINAL_DOCUMENT_ASPECTS
        .filter(a => a.key !== "prototypeSoftware")
        .map(a => a.key);

      const allFilled = requiredFinalKeys.every((key) => eval_[key] && eval_[key] !== "");
      if (!allFilled) {
        setMessage("Debes calificar todos los aspectos obligatorios de la evaluación del documento final");
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

      if (isFinalDocument) {
        payload.finalEvaluation = reviewData.finalEvaluation;
      }

      const response = isFinalDocument
        ? await reviewFinalDocumentExaminer(studentDocumentId, payload)
        : await reviewDocumentExaminer(studentDocumentId, payload);
      
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

  const handleGradeChange = (value) => {
    // Allow empty, or valid numbers 0-5 with up to 1 decimal
    if (value === "" || /^\d*\.?\d{0,1}$/.test(value)) {
      const num = parseFloat(value);
      if (value === "" || (num >= 0 && num <= 5)) {
        setEvaluationData({ ...evaluationData, grade: value });
        if (evalValidationErrors.grade) {
          setEvalValidationErrors(prev => { const n = {...prev}; delete n.grade; return n; });
        }
      }
    }
  };

  const getGradeDecisionLabel = () => {
    const gradeNum = parseFloat(evaluationData.grade);
    if (isNaN(gradeNum)) return null;
    return gradeNum >= 3.5
      ? { label: "APROBADO", color: "#166534", bg: "#dcfce7" }
      : { label: "REPROBADO", color: "#991b1b", bg: "#fee2e2" };
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s';
      el.style.boxShadow = '0 0 0 3px #7A1117, 0 0 16px rgba(122,17,23,0.18)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2500);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Validate rubric criteria
    const crit = evaluationData.defenseCriteria;
    const missingCriteria = DEFENSE_CRITERIA.filter(c => !crit[c.key] || crit[c.key] === "");
    if (missingCriteria.length > 0) {
      errors.rubric = `Falta calificar: ${missingCriteria.map((c, i) => `${i + 1}. ${c.label}`).join(", ")}`;
    }

    // 2. Validate grade
    const gradeNum = parseFloat(evaluationData.grade);
    if (!evaluationData.grade || isNaN(gradeNum) || gradeNum < 0 || gradeNum > 5) {
      errors.grade = "Debes ingresar una calificación válida entre 0.0 y 5.0";
    }

    // 3. Validate observations
    if (!evaluationData.observations.trim()) {
      errors.observations = "Debes proporcionar observaciones sobre la sustentación";
    }

    setEvalValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to first error section
      if (errors.rubric) scrollToSection('eval-rubric-section');
      else if (errors.grade) scrollToSection('eval-grade-section');
      else if (errors.observations) scrollToSection('eval-observations-section');

      setMessage(`⚠️ Hay ${Object.keys(errors).length} sección(es) incompleta(s). Revisa los campos marcados en rojo.`);
      setMessageType("error");
      return;
    }

    setSubmittingEvaluation(true);

    try {
      const payload = {
        grade: gradeNum,
        observations: evaluationData.observations,
        evaluationCriteria: {
          ...evaluationData.defenseCriteria,
          proposedMention: evaluationData.proposedMention || "NONE",
        },
      };

      console.log("📤 Payload evaluación sustentación:", JSON.stringify(payload, null, 2));

      const response = await registerEvaluation(studentModalityId, payload);

      setMessage(response.message || "Evaluación registrada correctamente");
      setMessageType("success");

      setShowEvaluationForm(false);
      setEvalValidationErrors({});
      setEvaluationData({
        grade: "",
        observations: "",
        defenseCriteria: {
          domainAndClarity: "",
          synthesisAndCommunication: "",
          argumentationAndResponse: "",
          innovationAndImpact: "",
          professionalPresentation: "",
        },
        proposedMention: "",
      });

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

  const canReviewDocuments = (docType) => {
    const baseStatuses = [
      "EXAMINERS_ASSIGNED",
      "READY_FOR_EXAMINERS",
      "CORRECTIONS_REQUESTED_EXAMINERS",
      "CORRECTIONS_SUBMITTED_TO_EXAMINERS"
    ];

    // Añadir estado de desempate si el jurado es de desempate
    const tiebreakerStatuses = [
      "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED"
    ];

    let validStatuses = [...baseStatuses];
    if (examinerRoleInfo?.examinerType === "TIEBREAKER_EXAMINER") {
      validStatuses = [...validStatuses, ...tiebreakerStatuses];
    }

    if (docType === "SECONDARY") {
      validStatuses = [
        ...validStatuses,
        "DOCUMENTS_APPROVED_BY_EXAMINERS",
        "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS",
        "DEFENSE_SCHEDULED",
        "READY_FOR_DEFENSE",
        "FINAL_REVIEW_COMPLETED"
      ];
    }

    return validStatuses.includes(profile?.currentStatus);
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
              <span className="student-info-value distinction">{DISTINCTION_LABELS[profile.academicDistinction] || profile.academicDistinction}</span>
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

          {/* Alerta de solicitudes de edición pendientes */}
          {editRequests.filter(r => r.authenticatedExaminerCanVote).length > 0 && (
            <div className="examiner-edit-request-alert">
              <div className="examiner-edit-request-alert-icon">⚠️</div>
              <div className="examiner-edit-request-alert-content">
                <strong>Solicitudes de edición pendientes</strong>
                <p>
                  {editRequests.filter(r => r.authenticatedExaminerCanVote).length === 1
                    ? "Un estudiante ha solicitado editar un documento aprobado. Requiere tu voto."
                    : `${editRequests.filter(r => r.authenticatedExaminerCanVote).length} solicitudes de edición requieren tu voto.`}
                </p>
              </div>
            </div>
          )}

          {profile.documents.filter(d => d.uploaded).map((doc) => {
            // Buscar solicitudes de edición asociadas a este documento
            const docEditRequests = editRequests.filter(r => r.documentId === doc.studentDocumentId);
            const pendingEditRequest = docEditRequests.find(r => r.authenticatedExaminerCanVote);
            const myEvaluation = myDocumentEvaluations[doc.studentDocumentId];
            const hasMyEvaluation = myEvaluation?.success === true;
            const showMyEvaluationLoading =
              loadingMyDocumentEvaluations &&
              isDocumentEligibleForMyEvaluationView(doc) &&
              !myEvaluation;

            return (
            <div
              key={doc.studentDocumentId || Math.random()}
              className={`examiner-doc-item ${doc.status?.includes("ACCEPTED") ? "accepted" : "pending"} ${pendingEditRequest ? "has-edit-request" : ""}`}
            >
              <div className="examiner-doc-header">
                <div>
                  <div className="examiner-doc-name">{doc.documentName}</div>
                  <div className="examiner-doc-type">Tipo de documento: {translateDocumentType(doc.documentType)}</div>
                </div>
                <span className={`examiner-doc-status ${doc.status?.includes("ACCEPTED") ? "approved" : doc.status === "EDIT_REQUESTED" ? "edit-requested" : "pending"}`}> {translateDocumentStatus(doc.status)} </span>
              </div>

              {/* Alerta inline de solicitud de edición para este documento */}
              {pendingEditRequest && (
                <div className="examiner-edit-request-inline">
                  <div className="examiner-edit-request-inline-header">
                    <span className="examiner-edit-request-inline-badge">Solicitud de edición</span>
                    <span className="examiner-edit-request-inline-date">
                      {pendingEditRequest.createdAt ? new Date(pendingEditRequest.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </span>
                  </div>
                  <div className="examiner-edit-request-inline-reason">
                    <strong>Motivo del estudiante:</strong> {pendingEditRequest.reason}
                  </div>
                  <div className="examiner-edit-request-inline-requester">
                    Solicitado por: <strong>{pendingEditRequest.requesterName}</strong> ({pendingEditRequest.requesterEmail})
                  </div>

                  {/* Votos existentes */}
                  {pendingEditRequest.votes && pendingEditRequest.votes.length > 0 && (
                    <div className="examiner-edit-request-votes-summary">
                      <strong>Votos registrados:</strong>
                      {pendingEditRequest.votes.map((v, i) => (
                        <div key={i} className={`examiner-edit-vote-chip ${v.decision === "APPROVED" ? "approved" : "rejected"}`}>
                          {v.examinerTypeLabel}: {v.decisionLabel}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario de voto */}
                  {votingEditRequestId === pendingEditRequest.editRequestId ? (
                    <div className="examiner-edit-vote-form">
                      <h5 className="examiner-edit-vote-form-title">Tu decisión sobre esta solicitud</h5>
                      <div className="examiner-edit-vote-options">
                        <label className={`examiner-edit-vote-option ${voteData.approved === true ? "selected approve" : ""}`}>
                          <input
                            type="radio"
                            name={`vote-${pendingEditRequest.editRequestId}`}
                            checked={voteData.approved === true}
                            onChange={() => setVoteData(prev => ({ ...prev, approved: true }))}
                            disabled={submittingVote}
                          />
                          <span className="examiner-edit-vote-option-icon">✅</span>
                          <div>
                            <strong>Aprobar edición</strong>
                            <span>Permitir al estudiante resubir el documento con cambios.</span>
                          </div>
                        </label>
                        <label className={`examiner-edit-vote-option ${voteData.approved === false ? "selected reject" : ""}`}>
                          <input
                            type="radio"
                            name={`vote-${pendingEditRequest.editRequestId}`}
                            checked={voteData.approved === false}
                            onChange={() => setVoteData(prev => ({ ...prev, approved: false }))}
                            disabled={submittingVote}
                          />
                          <span className="examiner-edit-vote-option-icon">❌</span>
                          <div>
                            <strong>Rechazar edición</strong>
                            <span>El documento permanece como está.</span>
                          </div>
                        </label>
                      </div>

                      {voteData.approved === false && (
                        <div className="examiner-edit-vote-notes">
                          <label>Notas de rechazo *</label>
                          <textarea
                            value={voteData.resolutionNotes}
                            onChange={(e) => setVoteData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                            placeholder="Indica el motivo del rechazo..."
                            rows={3}
                            disabled={submittingVote}
                          />
                        </div>
                      )}

                      {voteData.approved === true && (
                        <div className="examiner-edit-vote-notes">
                          <label>Notas (opcional)</label>
                          <textarea
                            value={voteData.resolutionNotes}
                            onChange={(e) => setVoteData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                            placeholder="Observaciones opcionales..."
                            rows={2}
                            disabled={submittingVote}
                          />
                        </div>
                      )}

                      <div className="examiner-edit-vote-actions">
                        <button
                          className="examiner-edit-vote-btn cancel"
                          onClick={() => {
                            setVotingEditRequestId(null);
                            setVoteData({ approved: null, resolutionNotes: "" });
                          }}
                          disabled={submittingVote}
                        >
                          Cancelar
                        </button>
                        <button
                          className="examiner-edit-vote-btn submit"
                          onClick={() => handleVoteEditRequest(pendingEditRequest.editRequestId)}
                          disabled={submittingVote || voteData.approved === null || (voteData.approved === false && !voteData.resolutionNotes.trim())}
                        >
                          {submittingVote ? "Enviando..." : "Registrar voto"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="examiner-edit-vote-trigger"
                      onClick={() => {
                        setVotingEditRequestId(pendingEditRequest.editRequestId);
                        setVoteData({ approved: null, resolutionNotes: "" });
                      }}
                    >
                      Votar sobre esta solicitud
                    </button>
                  )}
                </div>
              )}

              {/* Solicitudes ya resueltas para este documento */}
              {docEditRequests.filter(r => !r.authenticatedExaminerCanVote && (r.status === "APPROVED" || r.status === "REJECTED")).length > 0 && (
                <div className="examiner-edit-request-resolved">
                  {docEditRequests.filter(r => !r.authenticatedExaminerCanVote && (r.status === "APPROVED" || r.status === "REJECTED")).map(req => (
                    <div key={req.editRequestId} className={`examiner-edit-resolved-item ${req.status === "APPROVED" ? "approved" : "rejected"}`}>
                      <span className="examiner-edit-resolved-badge">
                        {req.status === "APPROVED" ? "✅ Edición aprobada" : "❌ Edición rechazada"}
                      </span>
                      <span className="examiner-edit-resolved-reason">Motivo: {req.reason}</span>
                      {req.resolvedAt && (
                        <span className="examiner-edit-resolved-date">
                          Resuelto: {new Date(req.resolvedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {doc.notes && (
                <div className="examiner-doc-notes">
                  <strong>Notas previas:</strong>
                  <p>{doc.notes}</p>
                </div>
              )}

              {isDocumentEligibleForMyEvaluationView(doc) && (
                <div className="examiner-doc-notes examiner-my-verdict-card">
                  <strong className="examiner-my-verdict-title">Mi veredicto registrado</strong>

                  {showMyEvaluationLoading && (
                    <p className="examiner-my-verdict-loading">Cargando tu evaluación...</p>
                  )}

                  {!showMyEvaluationLoading && !hasMyEvaluation && (
                    <p className="examiner-my-verdict-empty">
                      {myEvaluation?.message || "Aún no has emitido veredicto para este documento."}
                    </p>
                  )}

                  {hasMyEvaluation && (
                    <div className="examiner-my-verdict-content">
                      <div className="examiner-my-verdict-row">
                        <strong>Decisión:</strong> {myEvaluation.decisionDescription || myEvaluation.decision || "N/A"}
                      </div>
                      {myEvaluation.reviewedAt && (
                        <div className="examiner-my-verdict-row">
                          <strong>Fecha:</strong> {new Date(myEvaluation.reviewedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      )}
                      {myEvaluation.notes && (
                        <div className="examiner-my-verdict-row">
                          <strong>Observaciones:</strong> {myEvaluation.notes}
                        </div>
                      )}

                      {doc.documentType === "MANDATORY" && myEvaluation.proposalEvaluation && (
                        <div className="examiner-my-verdict-rubric-block">
                          <strong>Rúbrica de propuesta:</strong>
                          <ul className="examiner-my-verdict-rubric-list">
                            {PROPOSAL_ASPECTS.map((aspect) => {
                              const value = myEvaluation.proposalEvaluation?.[aspect.key];
                              if (!value) return null;
                              return (
                                <li key={aspect.key} className="examiner-my-verdict-rubric-item">
                                  <span>{aspect.label}:</span> <strong>{getGradeLabel(value)}</strong>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {doc.documentType === "SECONDARY" && myEvaluation.finalEvaluation && (
                        <div className="examiner-my-verdict-rubric-block">
                          <strong>Rúbrica de documento final:</strong>
                          <ul className="examiner-my-verdict-rubric-list">
                            {FINAL_DOCUMENT_ASPECTS.map((aspect) => {
                              const value = getFinalEvaluationValue(myEvaluation.finalEvaluation, aspect.key);
                              if (!value) return null;
                              return (
                                <li key={aspect.key} className="examiner-my-verdict-rubric-item">
                                  <span>{aspect.label}:</span> <strong>{getGradeLabel(value)}</strong>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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

                {canReviewDocuments(doc.documentType) && !doc.status?.includes("ACCEPTED_FOR_EXAMINER") && (
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

                  {/* Rúbrica de evaluación de propuesta */}
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

                  {/* Rúbrica de evaluación de documento final */}
                  {isFinalDocumentForExaminer(doc) && (
                    <div className="examiner-rubric-section">
                      <h5 className="examiner-rubric-title">Rúbrica de Documento Final</h5>
                      <p className="examiner-rubric-subtitle">Califique cada aspecto de mala a buena: Deficiente, Aceptable, Bueno y Excelente.</p>

                      <div className="examiner-rubric-table">
                        <div className="examiner-rubric-header">
                          <div className="examiner-rubric-col-aspect">Aspecto</div>
                          {EVALUATION_GRADES.map(g => (
                            <div key={g} className="examiner-rubric-col-grade">{EVALUATION_GRADE_LABELS[g]}</div>
                          ))}
                        </div>

                        {FINAL_DOCUMENT_ASPECTS.map(aspect => (
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
                                    name={`final-rubric-${aspect.key}`}
                                    value={g}
                                    checked={reviewData.finalEvaluation[aspect.key] === g}
                                    onChange={() => handleFinalEvalChange(aspect.key, g)}
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
                          <strong>{doc.documentType === "SECONDARY" ? "Aprobar documento" : "Avalar propuesta sin modificaciones"}</strong>
                          <span>{doc.documentType === "SECONDARY" ? "Apruebo el documento tal como está presentado." : "Apruebo la propuesta tal como está presentada."}</span>
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
                          <strong>{doc.documentType === "SECONDARY" ? "Solicitar correcciones al documento" : "Apruebo con modificaciones"}</strong>
                          <span>{doc.documentType === "SECONDARY" ? "El documento requiere correcciones. Se solicitan ajustes antes de su aprobación." : "Apruebo la propuesta siempre y cuando se realicen las modificaciones. Se requiere el concepto del director sobre las modificaciones propuestas dentro de los treinta (30) días calendario siguientes."}</span>
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
                          <strong>{doc.documentType === "SECONDARY" ? "Rechazar documento" : "No apruebo la propuesta"}</strong>
                          <span>{doc.documentType === "SECONDARY" ? "El documento no cumple con los requisitos establecidos y debe ser replanteado." : "Se requieren cambios sustanciales. Es necesario un replanteamiento de la propuesta e iniciar un nuevo proceso de evaluación. El documento ajustado debe entregarse máximo 30 días calendario."}</span>
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
                      onClick={() => handleSubmitReview(doc.studentDocumentId, doc)}
                      disabled={submittingReview}
                      className="examiner-form-submit"
                    >
                      {submittingReview ? "Enviando..." : "Enviar Evaluación"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Evaluation Section — Rúbrica de Sustentación */}
      {canEvaluate() && (
        <div className="examiner-eval-section">
          <h3 className="examiner-profile-card-title">Evaluación de la Sustentación</h3>
          <div className="examiner-eval-block">
            {!showEvaluationForm ? (
              <div className="examiner-eval-empty">
                <div className="examiner-eval-icon"></div>
                <h3 className="examiner-eval-title">Registrar Evaluación Final</h3>
                <div className="examiner-eval-message">
                  <span className="examiner-eval-alert">Todos los documentos han sido aprobados.</span><br/>
                  Una vez realizada la sustentación, debes registrar en este apartado la calificación que fue otorgada al estudiante durante la sesión.<br/>
                  <span style={{color:'#7A1117',fontWeight:600}}>Recuerda:</span> Evalúe cada criterio utilizando la valoración cualitativa: <strong>I</strong>= Insuficiente, <strong>A</strong>= Aceptable, <strong>B</strong>= Bueno, y <strong>E</strong>= Excelente, <strong>utilice la rúbrica de evaluación.</strong><br/>
                  <span style={{color:'#B7A873'}}>La calificación final será <strong>APROBADO</strong> o <strong>REPROBADO</strong>, utilice la regla de aprobación.</span>
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

                {/* Rúbrica de criterios de sustentación */}
                <div id="eval-rubric-section" className="examiner-rubric-section" style={evalValidationErrors.rubric ? { border: '2px solid #dc2626', borderRadius: '12px', padding: '1rem' } : {}}>
                  <h5 className="examiner-rubric-title">Rúbrica de Evaluación de Sustentación</h5>
                  <p className="examiner-rubric-subtitle">
                    Evalúe cada criterio utilizando la valoración cualitativa: <strong>I</strong>= Insuficiente, <strong>A</strong>= Aceptable, <strong>B</strong>= Bueno, y <strong>E</strong>= Excelente.
                  </p>

                  <div className="examiner-rubric-table">
                    <div className="examiner-rubric-header">
                      <div className="examiner-rubric-col-aspect">Criterio</div>
                      {DEFENSE_GRADE_SCALE.map(g => (
                        <div key={g.value} className="examiner-rubric-col-grade">{g.shortLabel}</div>
                      ))}
                    </div>

                    {DEFENSE_CRITERIA.map((criterion, idx) => (
                      <div key={criterion.key} className="examiner-rubric-row">
                        <div className="examiner-rubric-col-aspect">
                          <div className="examiner-rubric-aspect-label">{idx + 1}. {criterion.label}</div>
                          <div className="examiner-rubric-aspect-desc">{criterion.description}</div>
                        </div>
                        {DEFENSE_GRADE_SCALE.map(g => (
                          <div key={g.value} className="examiner-rubric-col-grade">
                            <label className="examiner-rubric-radio-label">
                              <input
                                type="radio"
                                name={`defense-rubric-${criterion.key}`}
                                value={g.value}
                                checked={evaluationData.defenseCriteria[criterion.key] === g.value}
                                onChange={() => handleDefenseCriteriaChange(criterion.key, g.value)}
                                disabled={submittingEvaluation}
                                className="examiner-rubric-radio"
                              />
                              <span className="examiner-rubric-radio-custom"></span>
                              <span className="examiner-rubric-grade-mobile">{g.label}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {evalValidationErrors.rubric && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.9rem', fontWeight: 600 }}>
                      ⚠️ {evalValidationErrors.rubric}
                    </div>
                  )}
                </div>

                {/* Calificación Final Cuantitativa */}
                <div id="eval-grade-section" className="examiner-form-group" style={{ marginTop: '1.5rem', ...(evalValidationErrors.grade ? { border: '2px solid #dc2626', borderRadius: '12px', padding: '1rem' } : {}) }}>
                  <label className="examiner-form-label">Calificación Final Cuantitativa (0.0 - 5.0) *</label>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                    Pondere la calificación obtenida de acuerdo a la rúbrica y registre la Nota.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={evaluationData.grade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      placeholder="Nota final"
                      className="examiner-form-select"
                      style={{ maxWidth: '160px', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}
                      disabled={submittingEvaluation}
                      required
                    />
                    {(() => {
                      const decision = getGradeDecisionLabel();
                      if (!decision) return null;
                      return (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.4rem 1.2rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: decision.color,
                          background: decision.bg,
                          border: `2px solid ${decision.color}`,
                          letterSpacing: '0.5px',
                        }}>
                          {decision.label}
                        </span>
                      );
                    })()}
                  </div>
                  {evalValidationErrors.grade && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.88rem', fontWeight: 600 }}>
                      ⚠️ {evalValidationErrors.grade}
                    </div>
                  )}
                </div>

                {/* Mención (Meritorio / Laureado) — opcional */}
                <div className="examiner-form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="examiner-form-label">Mención (opcional)</label>
                  <div style={{
                    background: '#fffbea', border: '1.5px solid #D5CBA0', borderRadius: '10px',
                    padding: '1rem 1.25rem', marginBottom: '0.75rem'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#7A1117', lineHeight: 1.6 }}>
                      <strong>Acuerdo 071 de 2023, Artículo 10. Menciones de las Modalidades de Grado:</strong><br/>
                      <strong>a) Meritorio:</strong> Una modalidad de grado podrá recibir mención de Meritorio si a juicio unánime de los evaluadores se tiene un impacto positivo evidenciado en al menos una de las dimensiones: académica, social, económica y/o tecnológica.<br/>
                      <strong>b) Laureado:</strong> Una modalidad de grado podrá recibir mención de Laureado si además de cumplir con las condiciones de un producto meritorio, cumple con evidenciar el carácter innovador del producto o el aporte nuevo al estado del arte.
                    </p>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                    Si considera que el trabajo puede tener una mención, seleccione la que corresponda. Si deja vacío se registra como "Sin mención".
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {MENTION_OPTIONS.map(opt => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                          border: evaluationData.proposedMention === opt.value
                            ? '2px solid #7A1117' : '2px solid #e5e7eb',
                          background: evaluationData.proposedMention === opt.value
                            ? '#fef2f2' : '#fff',
                          fontWeight: evaluationData.proposedMention === opt.value ? 700 : 500,
                          fontSize: '0.95rem', color: '#374151',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="proposedMention"
                          value={opt.value}
                          checked={evaluationData.proposedMention === opt.value}
                          onChange={() => setEvaluationData({ ...evaluationData, proposedMention: opt.value })}
                          disabled={submittingEvaluation}
                          style={{ accentColor: '#7A1117' }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                <div id="eval-observations-section" className="examiner-form-group" style={{ marginTop: '1.5rem', ...(evalValidationErrors.observations ? { border: '2px solid #dc2626', borderRadius: '12px', padding: '1rem' } : {}) }}>
                  <label className="examiner-form-label">Observaciones *</label>
                  <textarea
                    value={evaluationData.observations}
                    onChange={(e) => {
                      setEvaluationData({ ...evaluationData, observations: e.target.value });
                      if (evalValidationErrors.observations) {
                        setEvalValidationErrors(prev => { const n = {...prev}; delete n.observations; return n; });
                      }
                    }}
                    rows="6"
                    placeholder="Registre aquí sus observaciones sobre el desempeño del estudiante durante la sustentación..."
                    className="examiner-form-textarea"
                    disabled={submittingEvaluation}
                    required
                  />
                  {evalValidationErrors.observations && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.88rem', fontWeight: 600 }}>
                      ⚠️ {evalValidationErrors.observations}
                    </div>
                  )}
                </div>

                <div className="examiner-form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEvaluationForm(false);
                      setEvalValidationErrors({});
                      setEvaluationData({
                        grade: "", observations: "",
                        defenseCriteria: { domainAndClarity: "", synthesisAndCommunication: "", argumentationAndResponse: "", innovationAndImpact: "", professionalPresentation: "" },
                        proposedMention: "",
                      });
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
        const gradeNum = parseFloat(registeredEvaluation.grade);
        const isApproved = gradeNum >= 3.5;
        const decisionLabel = isApproved ? 'Aprobado' : 'Reprobado';

        let mentionLabel = '';
        if (registeredEvaluation.proposedMention === 'MERITORIOUS') mentionLabel = 'Meritorio';
        else if (registeredEvaluation.proposedMention === 'LAUREATE') mentionLabel = 'Laureado';

        let examinerTypeLabel = '';
        switch (registeredEvaluation.examinerType) {
          case 'PRIMARY_EXAMINER_1': examinerTypeLabel = 'Jurado Principal 1'; break;
          case 'PRIMARY_EXAMINER_2': examinerTypeLabel = 'Jurado Principal 2'; break;
          case 'TIEBREAKER_EXAMINER': examinerTypeLabel = 'Jurado de Desempate'; break;
          default: examinerTypeLabel = registeredEvaluation.examinerType;
        }

        // Map criteria values for display
        const criteriaLabelMap = {
          Insufficient: 'Insuficiente (I)',
          Acceptable: 'Aceptable (A)',
          Good: 'Bueno (B)',
          Excellent: 'Excelente (E)',
          INSUFFICIENT: 'Insuficiente (I)',
          ACCEPTABLE: 'Aceptable (A)',
          GOOD: 'Bueno (B)',
          EXCELLENT: 'Excelente (E)',
        };

        const getBadgeClass = (val) => {
          if (val === 'EXCELLENT' || val === 'Excellent') return 'badge-excellent';
          if (val === 'GOOD' || val === 'Good') return 'badge-good';
          if (val === 'ACCEPTABLE' || val === 'Acceptable') return 'badge-acceptable';
          return 'badge-insufficient';
        };

        const hasCriteria = registeredEvaluation.domainAndClarity || registeredEvaluation.evaluationCriteria;
        const criteria = registeredEvaluation.evaluationCriteria || registeredEvaluation;

        return (
          <section className="eval-summary-card">
            {/* Header */}
            <div className="eval-summary-header">
              <span className="eval-summary-header-icon"></span>
              <h3>Evaluación Final Registrada</h3>
            </div>

            {/* Rubric criteria display */}
            {hasCriteria && (
              <div>
                <div className="eval-summary-rubric-title">
                  <span></span> Rúbrica de Sustentación
                </div>
                <div className="eval-summary-rubric-list">
                  {DEFENSE_CRITERIA.map((c, idx) => {
                    const val = criteria[c.key];
                    return val ? (
                      <div key={c.key} className="eval-summary-criteria-row">
                        <span className="eval-summary-criteria-label">{idx + 1}. {c.label}</span>
                        <span className={`eval-summary-criteria-badge ${getBadgeClass(val)}`}>
                          {criteriaLabelMap[val] || val}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Grade + Decision + Mention */}
            <div className="eval-summary-details">
              <div className="eval-summary-detail-item">
                <span className="eval-summary-detail-label">Calificación Final</span>
                <span className={`eval-summary-grade-value ${isApproved ? 'approved' : 'failed'}`}>
                  {registeredEvaluation.grade} / 5.0
                </span>
              </div>
              <div className="eval-summary-detail-item">
                <span className="eval-summary-detail-label">Calificación Cualitativa</span>
                <span className={`eval-summary-badge ${isApproved ? 'badge-approved' : 'badge-failed'}`}>
                  {isApproved ? '✅' : '❌'} {decisionLabel}
                </span>
              </div>
              {mentionLabel && (
                <div className="eval-summary-detail-item">
                  <span className="eval-summary-detail-label">Mención Propuesta</span>
                  <span className="eval-summary-badge badge-mention">
                    🏅 {mentionLabel}
                  </span>
                </div>
              )}
              <div className={`eval-summary-detail-item ${!mentionLabel ? 'full-width' : ''}`}>
                <span className="eval-summary-detail-label">Observaciones</span>
                <div className="eval-summary-observations">
                  {registeredEvaluation.observations || '—'}
                </div>
              </div>
            </div>

            {/* Footer metadata */}
            <div className="eval-summary-footer">
              <div className="eval-summary-footer-item">
                <span className="footer-icon"></span>
                <span>Fecha:</span>
                <strong>
                  {registeredEvaluation.evaluationDate
                    ? new Date(registeredEvaluation.evaluationDate).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
                    : "—"}
                </strong>
              </div>
              <div className="eval-summary-footer-item">
                <span className="footer-icon"></span>
                <span>Tipo de Jurado:</span>
                <strong>{examinerTypeLabel}</strong>
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
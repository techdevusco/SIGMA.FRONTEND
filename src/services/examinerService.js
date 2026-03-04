// ========================================
// 🏅 OBTENER TIPO DE JURADO (ExaminerType)
// ========================================
/**
 * Obtener el tipo de jurado asignado a la modalidad para el usuario autenticado
 * Endpoint: GET /modalities/examiner-type/{studentModalityId}
 *
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Objeto con success y examinerType
 *
 * @example
 * getExaminerTypeForModality(24)
 */
export const getExaminerTypeForModality = async (studentModalityId) => {
  console.log("🏅 Obteniendo tipo de jurado para modalidad:", studentModalityId);
  const response = await axios.get(`/modalities/examiner-type/${studentModalityId}`);
  return response.data;
};
import axios from "../api/axios";

// ========================================
// 📋 OBTENER MIS ASIGNACIONES COMO JURADO
// ========================================
/**
 * Obtener lista de modalidades asignadas al jurado autenticado
 * Endpoint: GET /modalities/students/examiner
 * 
 * @param {Object} params - Parámetros opcionales de filtrado
 * @param {Array<string>} params.statuses - Estados de modalidad a filtrar (ej: ['DEFENSE_SCHEDULED', 'EXAMINERS_ASSIGNED'])
 * @param {string} params.name - Nombre del estudiante a buscar
 * @returns {Promise<Array>} Lista de modalidades
 * 
 * @example
 * // Sin filtros
 * getMyExaminerAssignments()
 * 
 * // Con filtro de estado
 * getMyExaminerAssignments({ statuses: ['DEFENSE_SCHEDULED'] })
 * 
 * // Con filtro de nombre
 * getMyExaminerAssignments({ name: 'Juan' })
 * 
 * // Con ambos filtros
 * getMyExaminerAssignments({ 
 *   statuses: ['DEFENSE_SCHEDULED', 'PROPOSAL_APPROVED'], 
 *   name: 'Perez' 
 * })
 */
export const getMyExaminerAssignments = async (params = {}) => {
  console.log("📋 Obteniendo mis asignaciones como jurado", params);
  
  const queryParams = new URLSearchParams();
  
  // Agregar estados si existen (puede ser múltiple)
  if (params.statuses && params.statuses.length > 0) {
    params.statuses.forEach(status => {
      queryParams.append('statuses', status);
    });
  }
  
  // Agregar nombre si existe
  if (params.name) {
    queryParams.append('name', params.name);
  }
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `/modalities/students/examiner?${queryString}` 
    : '/modalities/students/examiner';
  
  const response = await axios.get(url);
  return response.data;
};

// ========================================
// 👤 OBTENER PERFIL DEL ESTUDIANTE (JURADO)
// ========================================
/**
 * Obtener detalle completo de una modalidad asignada al jurado
 * Endpoint: GET /modalities/students/{studentModalityId}/examiner
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Detalle del estudiante y su modalidad
 * 
 * @example
 * getExaminerStudentProfile(24)
 */
export const getExaminerStudentProfile = async (studentModalityId) => {
  console.log("🔍 Obteniendo perfil del estudiante:", studentModalityId);
  const response = await axios.get(
    `/modalities/students/${studentModalityId}/examiner`
  );
  return response.data;
};

// ========================================
// 📄 VER DOCUMENTO (BLOB/PDF)
// ========================================
/**
 * Obtener documento como blob para visualización
 * @param {number} studentDocumentId - ID del documento del estudiante
 * @returns {Promise<string>} URL del blob para visualización
 */
export const getDocumentBlobUrl = async (studentDocumentId) => {
  console.log("🔍 Descargando documento ID:", studentDocumentId);

  try {
    const response = await axios.get(
      `/modalities/student/${studentDocumentId}/view`,
      {
        responseType: "blob",
      }
    );

    console.log("✅ PDF recibido, tamaño:", response.data.size);

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);

    return url;
  } catch (error) {
    console.error("❌ Error al descargar:", error);
    throw error;
  }
};

// ========================================
// 📝 REVISAR DOCUMENTO (JURADO)
// ========================================
/**
 * Revisar documento como jurado (aceptar, rechazar o solicitar correcciones)
 * Endpoint: PUT /modalities/documents/{studentDocumentId}/review-examiner
 * 
 * @param {number} studentDocumentId - ID del documento del estudiante
 * @param {Object} data - Datos de la revisión
 * @param {string} data.status - Estado del documento (ACCEPTED_FOR_EXAMINER_REVIEW, REJECTED_FOR_EXAMINER_REVIEW, CORRECTIONS_REQUESTED_BY_EXAMINER)
 * @param {string} data.notes - Notas del jurado
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const reviewDocumentExaminer = async (studentDocumentId, data) => {
  console.log("📝 Revisando documento:", { studentDocumentId, data });
  const response = await axios.put(
    `/modalities/documents/${studentDocumentId}/review-examiner`,
    data
  );
  return response.data;
};

// ========================================
// 📊 REGISTRAR EVALUACIÓN FINAL
// ========================================
/**
 * Registrar evaluación final de la sustentación
 * Endpoint: POST /modalities/{studentModalityId}/final-evaluation/register
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {Object} evaluationData - Datos de la evaluación
 * @param {number} evaluationData.grade - Calificación (0.0 - 5.0)
 * @param {string} evaluationData.decision - Decisión (APPROVED_NO_DISTINCTION, APPROVED_MERITORIOUS, APPROVED_LAUREATE, REJECTED)
 * @param {string} evaluationData.observations - Observaciones del jurado
 * @returns {Promise<Object>} Respuesta con resultado (consenso, desacuerdo, etc.)
 */
export const registerEvaluation = async (studentModalityId, evaluationData) => {
  console.log("📊 Registrando evaluación:", { studentModalityId, evaluationData });
  const response = await axios.post(
    `/modalities/${studentModalityId}/final-evaluation/register`,
    evaluationData
  );
  return response.data;
};

// ========================================
// ✅ APROBAR MODALIDAD (JURADO)
// ========================================
/**
 * Aprobar modalidad como jurado (todos los docs obligatorios deben estar aceptados)
 * Endpoint: POST /modalities/{studentModalityId}/approve-examiners
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta con confirmación
 */
export const approveModalityByExaminer = async (studentModalityId) => {
  console.log("✅ Aprobando modalidad como jurado:", studentModalityId);
  const response = await axios.post(
    `/modalities/${studentModalityId}/approve-examiners`
  );
  return response.data;
};

// ========================================
// ✅ FINALIZAR REVISIÓN (JURADO)
// ========================================
/**
 * Finalizar revisión de documentos como jurado y marcar listo para sustentación
 * Endpoint: POST /modalities/{studentModalityId}/final-review-completed
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta con confirmación
 */
export const finalizeReviewAsExaminer = async (studentModalityId) => {
  console.log("✅ Finalizando revisión como jurado:", studentModalityId);
  const response = await axios.post(
    `/modalities/${studentModalityId}/final-review-completed`
  );
  return response.data;
};

// ========================================
// 🔍 UTILIDADES
// ========================================

/**
 * Estados de documentos para jurado
 */
export const EXAMINER_DOCUMENT_STATUS = {
  ACCEPTED: "ACCEPTED_FOR_EXAMINER_REVIEW",
  REJECTED: "REJECTED_FOR_EXAMINER_REVIEW",
  CORRECTIONS: "CORRECTIONS_REQUESTED_BY_EXAMINER",
};

/**
 * Decisiones de evaluación
 */
export const EXAMINER_DECISIONS = {
  REJECTED: "REJECTED",
  APPROVED_NO_DISTINCTION: "APPROVED_NO_DISTINCTION",
  APPROVED_MERITORIOUS: "APPROVED_MERITORIOUS",
  APPROVED_LAUREATE: "APPROVED_LAUREATE",
};

/**
 * Estados de modalidad relevantes para examiners
 */
export const EXAMINER_MODALITY_STATUS = {
  // Selección y revisión inicial
  MODALITY_SELECTED: "MODALITY_SELECTED",
  UNDER_REVIEW_PROGRAM_HEAD: "UNDER_REVIEW_PROGRAM_HEAD",
  CORRECTIONS_REQUESTED_PROGRAM_HEAD: "CORRECTIONS_REQUESTED_PROGRAM_HEAD",
  CORRECTIONS_SUBMITTED: "CORRECTIONS_SUBMITTED",
  CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD: "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD",
  CORRECTIONS_SUBMITTED_TO_COMMITTEE: "CORRECTIONS_SUBMITTED_TO_COMMITTEE",
  CORRECTIONS_SUBMITTED_TO_EXAMINERS: "CORRECTIONS_SUBMITTED_TO_EXAMINERS",
  CORRECTIONS_APPROVED: "CORRECTIONS_APPROVED",
  CORRECTIONS_REJECTED_FINAL: "CORRECTIONS_REJECTED_FINAL",

  // Revisión de comité
  READY_FOR_PROGRAM_CURRICULUM_COMMITTEE: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE",
  UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE",
  CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE",
  READY_FOR_DIRECTOR_ASSIGNMENT: "READY_FOR_DIRECTOR_ASSIGNMENT",
  READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE: "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE",
  PROPOSAL_APPROVED: "PROPOSAL_APPROVED",

  // Programación de sustentación
  DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR: "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR",
  DEFENSE_SCHEDULED: "DEFENSE_SCHEDULED",

  // Asignación de jurado
  EXAMINERS_ASSIGNED: "EXAMINERS_ASSIGNED",
  READY_FOR_EXAMINERS: "READY_FOR_EXAMINERS",
  DOCUMENTS_APPROVED_BY_EXAMINERS: "DOCUMENTS_APPROVED_BY_EXAMINERS",
  SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS: "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS",
  DOCUMENT_REVIEW_TIEBREAKER_REQUIRED: "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED",
  CORRECTIONS_REQUESTED_EXAMINERS: "CORRECTIONS_REQUESTED_EXAMINERS",
  READY_FOR_DEFENSE: "READY_FOR_DEFENSE",
  FINAL_REVIEW_COMPLETED: "FINAL_REVIEW_COMPLETED",

  // Sustentación y evaluación
  DEFENSE_COMPLETED: "DEFENSE_COMPLETED",
  UNDER_EVALUATION_PRIMARY_EXAMINERS: "UNDER_EVALUATION_PRIMARY_EXAMINERS",
  DISAGREEMENT_REQUIRES_TIEBREAKER: "DISAGREEMENT_REQUIRES_TIEBREAKER",
  UNDER_EVALUATION_TIEBREAKER: "UNDER_EVALUATION_TIEBREAKER",
  EVALUATION_COMPLETED: "EVALUATION_COMPLETED",

  // Resultado final
  GRADED_APPROVED: "GRADED_APPROVED",
  GRADED_FAILED: "GRADED_FAILED",
  MODALITY_CLOSED: "MODALITY_CLOSED",
  SEMINAR_CANCELED: "SEMINAR_CANCELED",

  // Cancelaciones
  MODALITY_CANCELLED: "MODALITY_CANCELLED",
  CANCELLATION_REQUESTED: "CANCELLATION_REQUESTED",
  CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR: "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR",
  CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR: "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR",
  CANCELLED_WITHOUT_REPROVAL: "CANCELLED_WITHOUT_REPROVAL",
  CANCELLATION_REJECTED: "CANCELLATION_REJECTED",
  CANCELLED_BY_CORRECTION_TIMEOUT: "CANCELLED_BY_CORRECTION_TIMEOUT",
};

/**
 * Obtener clase CSS para badge de estado
 */
export const getStatusBadgeClass = (status) => {
  if (status?.includes("ACCEPTED")) return "success";
  if (status?.includes("REJECTED")) return "error";
  if (status?.includes("CORRECTIONS")) return "warning";
  if (status === "GRADED_APPROVED") return "success";
  if (status === "GRADED_FAILED") return "error";
  return "inactive";
};

/**
 * Obtener etiqueta legible del estado
 */
export const getStatusLabel = (status) => {
  const statusMap = {
    // Selección y revisión inicial
    MODALITY_SELECTED: "Modalidad Seleccionada",
    UNDER_REVIEW_PROGRAM_HEAD: "En Revisión por Jefe de Programa",
    CORRECTIONS_REQUESTED_PROGRAM_HEAD: "Correcciones Solicitadas por Jefe",
    CORRECTIONS_SUBMITTED: "Correcciones Enviadas",
    CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD: "Correcciones Enviadas a Jefe de Programa",
    CORRECTIONS_SUBMITTED_TO_COMMITTEE: "Correcciones Enviadas a Comité",
    CORRECTIONS_SUBMITTED_TO_EXAMINERS: "Correcciones Enviadas a Jurado",
    CORRECTIONS_APPROVED: "Correcciones Aprobadas",
    CORRECTIONS_REJECTED_FINAL: "Correcciones Rechazadas (Final)",

    // Revisión de comité
    READY_FOR_PROGRAM_CURRICULUM_COMMITTEE: "Pendiente Comité de Currículo",
    UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE: "En Revisión por Comité de Currículo",
    CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE: "Correcciones Solicitadas por Comité",
    READY_FOR_DIRECTOR_ASSIGNMENT: "Listo para Asignación de Director",
    READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE: "Listo para Aprobación por Comité de Currículo",
    PROPOSAL_APPROVED: "Propuesta Aprobada",

    // Programación de sustentación
    DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR: "Sustentación Propuesta por Director",
    DEFENSE_SCHEDULED: "Sustentación Programada",

    // Asignación de jurado
    EXAMINERS_ASSIGNED: "Jurado Asignado",
    READY_FOR_EXAMINERS: "Listo para Jurado",
    DOCUMENTS_APPROVED_BY_EXAMINERS: "Documentos Aprobados por Jurado",
    SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS: "Documentos Secundarios Aprobados por Jurado",
    DOCUMENT_REVIEW_TIEBREAKER_REQUIRED: "Revisión de Documento Requiere Desempate",
    CORRECTIONS_REQUESTED_EXAMINERS: "Correcciones Solicitadas por Jurado",
    READY_FOR_DEFENSE: "Listo para Sustentación",
    FINAL_REVIEW_COMPLETED: "Revisión Final Completada",

    // Sustentación y evaluación
    DEFENSE_COMPLETED: "Sustentación Completada",
    UNDER_EVALUATION_PRIMARY_EXAMINERS: "En Evaluación - Jurado Principal",
    DISAGREEMENT_REQUIRES_TIEBREAKER: "Desacuerdo - Requiere Desempate",
    UNDER_EVALUATION_TIEBREAKER: "En Evaluación - Jurado de Desempate",
    EVALUATION_COMPLETED: "Evaluación Completada",

    // Resultado final
    GRADED_APPROVED: "Aprobado",
    GRADED_FAILED: "Reprobado",
    MODALITY_CLOSED: "Modalidad Cancelada",
    SEMINAR_CANCELED: "Diplomado Cancelado",

    // Cancelaciones
    MODALITY_CANCELLED: "Modalidad Cancelada",
    CANCELLATION_REQUESTED: "Cancelación Solicitada",
    CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR: "Cancelación Aprobada por Director",
    CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR: "Cancelación Rechazada por Director",
    CANCELLED_WITHOUT_REPROVAL: "Cancelada sin Calificación",
    CANCELLATION_REJECTED: "Cancelación Rechazada",
    CANCELLED_BY_CORRECTION_TIMEOUT: "Cancelada por Timeout de Correcciones",
  };
  return statusMap[status] || status;
};

/**
 * Obtener etiqueta legible del estado de documento para examinador
 */
export const getDocumentStatusLabel = (status) => {
  const docStatusMap = {
    ACCEPTED_FOR_EXAMINER_REVIEW: "✅ Aceptado",
    REJECTED_FOR_EXAMINER_REVIEW: "❌ Rechazado",
    CORRECTIONS_REQUESTED_BY_EXAMINER: "⚠️ Correcciones Solicitadas",
    PENDING: "⏳ Pendiente",
  };
  return docStatusMap[status] || status;
};

/**
 * Formatear fecha a formato legible en español
 */
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Obtener mensaje de error legible
 */
export const getErrorMessage = (error) => {
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
    return JSON.stringify(error.response.data);
  }
  if (error.message) {
    return error.message;
  }
  return 'Error desconocido';
};

/**
 * Validar consistencia entre calificación y decisión
 */
export const isGradeConsistentWithDecision = (grade, decision) => {
  const gradeNum = parseFloat(grade);
  
  switch (decision) {
    case EXAMINER_DECISIONS.REJECTED:
      return gradeNum < 3.0;
    case EXAMINER_DECISIONS.APPROVED_NO_DISTINCTION:
      return gradeNum >= 3.0 && gradeNum < 4.0;
    case EXAMINER_DECISIONS.APPROVED_MERITORIOUS:
      return gradeNum >= 4.0 && gradeNum < 4.5;
    case EXAMINER_DECISIONS.APPROVED_LAUREATE:
      return gradeNum >= 4.5 && gradeNum <= 5.0;
    default:
      return false;
  }
};

/**
 * Obtener sugerencia de decisión según calificación
 */
export const getSuggestedDecision = (grade) => {
  const gradeNum = parseFloat(grade);
  
  if (gradeNum < 3.0) return EXAMINER_DECISIONS.REJECTED;
  if (gradeNum < 4.0) return EXAMINER_DECISIONS.APPROVED_NO_DISTINCTION;
  if (gradeNum < 4.5) return EXAMINER_DECISIONS.APPROVED_MERITORIOUS;
  return EXAMINER_DECISIONS.APPROVED_LAUREATE;
};

// ========================================
// 📊 OBTENER EVALUACIÓN FINAL REGISTRADA (JURADO)
// ========================================
/**
 * Obtener la evaluación final registrada por el jurado autenticado para una modalidad
 * Endpoint: GET /modalities/{studentModalityId}/examiner-evaluation
 *
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Objeto con la evaluación registrada o success: false si no existe
 *
 * @example
 * getExaminerEvaluation(24)
 */
export const getExaminerEvaluation = async (studentModalityId) => {
  console.log("📊 Obteniendo evaluación registrada para modalidad:", studentModalityId);
  const response = await axios.get(`/modalities/${studentModalityId}/examiner-evaluation`);
  return response.data;
};
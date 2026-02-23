import axios from "../api/axios";

// ========================================
// 📋 OBTENER MIS ASIGNACIONES COMO JUEZ
// ========================================
/**
 * Obtener lista de modalidades asignadas al juez autenticado
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
  console.log("📋 Obteniendo mis asignaciones como juez", params);
  
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
// 👤 OBTENER PERFIL DEL ESTUDIANTE (JUEZ)
// ========================================
/**
 * Obtener detalle completo de una modalidad asignada al juez
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
// 📝 REVISAR DOCUMENTO (JUEZ)
// ========================================
/**
 * Revisar documento como juez (aceptar, rechazar o solicitar correcciones)
 * Endpoint: PUT /modalities/documents/{studentDocumentId}/review-examiner
 * 
 * @param {number} studentDocumentId - ID del documento del estudiante
 * @param {Object} data - Datos de la revisión
 * @param {string} data.status - Estado del documento (ACCEPTED_FOR_EXAMINER_REVIEW, REJECTED_FOR_EXAMINER_REVIEW, CORRECTIONS_REQUESTED_BY_EXAMINER)
 * @param {string} data.notes - Notas del juez
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
 * @param {string} evaluationData.observations - Observaciones del juez
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
// ✅ APROBAR MODALIDAD (JUEZ)
// ========================================
/**
 * Aprobar modalidad como juez (todos los docs obligatorios deben estar aceptados)
 * Endpoint: POST /modalities/{studentModalityId}/approve-examiners
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta con confirmación
 */
export const approveModalityByExaminer = async (studentModalityId) => {
  console.log("✅ Aprobando modalidad como juez:", studentModalityId);
  const response = await axios.post(
    `/modalities/${studentModalityId}/approve-examiners`
  );
  return response.data;
};

// ========================================
// ✅ FINALIZAR REVISIÓN (JUEZ)
// ========================================
/**
 * Finalizar revisión de documentos como juez y marcar listo para sustentación
 * Endpoint: POST /modalities/{studentModalityId}/final-review-completed
 * 
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta con confirmación
 */
export const finalizeReviewAsExaminer = async (studentModalityId) => {
  console.log("✅ Finalizando revisión como juez:", studentModalityId);
  const response = await axios.post(
    `/modalities/${studentModalityId}/final-review-completed`
  );
  return response.data;
};

// ========================================
// 🔍 UTILIDADES
// ========================================

/**
 * Estados de documentos para jueces
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
  EXAMINERS_ASSIGNED: "EXAMINERS_ASSIGNED",
  READY_FOR_DEFENSE: "READY_FOR_DEFENSE",
  FINAL_REVIEW_COMPLETED: "FINAL_REVIEW_COMPLETED",
  DEFENSE_COMPLETED: "DEFENSE_COMPLETED",
  UNDER_EVALUATION_PRIMARY_EXAMINERS: "UNDER_EVALUATION_PRIMARY_EXAMINERS",
  UNDER_EVALUATION_TIEBREAKER: "UNDER_EVALUATION_TIEBREAKER",
  DISAGREEMENT_REQUIRES_TIEBREAKER: "DISAGREEMENT_REQUIRES_TIEBREAKER",
  GRADED_APPROVED: "GRADED_APPROVED",
  GRADED_FAILED: "GRADED_FAILED",
  CORRECTIONS_REQUESTED_EXAMINERS: "CORRECTIONS_REQUESTED_EXAMINERS",
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
    EXAMINERS_ASSIGNED: "Jueces Asignados",
    READY_FOR_DEFENSE: "Listo para Sustentación",
    DEFENSE_COMPLETED: "Sustentación Completada",
    UNDER_EVALUATION_PRIMARY_EXAMINERS: "En Evaluación - Jueces Principales",
    UNDER_EVALUATION_TIEBREAKER: "En Evaluación - Juez de Desempate",
    DISAGREEMENT_REQUIRES_TIEBREAKER: "Desacuerdo - Requiere Desempate",
    GRADED_APPROVED: "Aprobado",
    GRADED_FAILED: "Reprobado",
    CORRECTIONS_REQUESTED_EXAMINERS: "Correcciones Solicitadas por Jueces",
    PROPOSAL_APPROVED: "Propuesta Aprobada",
    FINAL_REVIEW_COMPLETED: "Revisión Final Completada",
    DEFENSE_SCHEDULED: "Sustentación Programada",
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
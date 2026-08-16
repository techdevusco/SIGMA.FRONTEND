//directorService.js
import axios from "../api/axios";

// Función helper para extraer datos de respuestas del backend
const extractData = (response, fallback = []) => {
  const data = response;
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.students)) return data.students;
    
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      return data[keys[0]];
    }
  }
  
  console.warn("No se pudo extraer array de la respuesta:", data);
  return fallback;
};

// ==================== LISTAR ESTUDIANTES ====================
/**
 * Obtener lista de estudiantes asignados al director
 * @param {Object} filters - Filtros opcionales
 * @param {Array<string>} filters.statuses - Array de estados para filtrar
 * @param {string} filters.name - Nombre del estudiante para buscar
 * @returns {Promise<Array>} Lista de estudiantes
 */
export const getDirectorStudents = async (filters = {}) => {
  let url = "/modalities/students/director";
  const params = new URLSearchParams();
  
  if (filters.statuses && filters.statuses.length > 0) {
    params.append('statuses', filters.statuses.join(','));
  }
  if (filters.name && filters.name.trim()) {
    params.append('name', filters.name.trim());
  }
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  console.log("📡 Director llamando a:", url);
  
  const response = await axios.get(url);
  return extractData(response.data);
};

// ==================== DETALLE DE ESTUDIANTE ====================
/**
 * Obtener detalle completo de una modalidad de un estudiante
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Detalle del estudiante y su modalidad
 */
export const getDirectorStudentDetail = async (studentModalityId) => {
  console.log("🔍 Obteniendo detalle del estudiante:", studentModalityId);
  
  const response = await axios.get(
    `/modalities/students/${studentModalityId}/director`
  );

  console.log("📥 Respuesta detalle director:", response.data);
  
  return response.data;
};

/**
 * Obtener documentos requeridos de una modalidad.
 * Se usa como fallback cuando el detalle del director no expone requiredDocumentId.
 * @param {number} modalityId
 * @returns {Promise<Array>}
 */
export const getRequiredDocumentsForModality = async (modalityId) => {
  console.log("📚 Obteniendo documentos requeridos para modalidad:", modalityId);
  const response = await axios.get(`/required-documents/modality/${modalityId}`);
  console.log("📥 Documentos requeridos de modalidad:", response.data);
  return extractData(response.data);
};

/**
 * Obtener modalidades disponibles para resolver el ID a partir del nombre.
 * @returns {Promise<Array>}
 */
export const getAvailableModalities = async () => {
  console.log("🎓 Obteniendo modalidades disponibles para fallback de carga");
  const response = await axios.get("/modalities");
  console.log("📥 Modalidades disponibles:", response.data);
  return extractData(response.data);
};

/**
 * Subir o resubir un documento asociado a una modalidad desde el perfil del director.
 * Reutiliza el mismo endpoint de carga usado por estudiante.
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {number} requiredDocumentId - ID del documento requerido
 * @param {File} file - Archivo a subir
 * @returns {Promise<Object>} Respuesta del backend
 */
export const uploadDirectorDocument = async (
  studentModalityId,
  requiredDocumentId,
  file
) => {
  console.log("📤 [DIRECTOR] Subiendo documento:", {
    studentModalityId,
    requiredDocumentId,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `/modalities/${studentModalityId}/documents/${requiredDocumentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  console.log("✅ [DIRECTOR] Respuesta carga documento:", response.data);

  return response.data;
};

// ==================== PROPONER SUSTENTACIÓN ====================
/**
 * Proponer fecha y lugar de sustentación (como director)
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {Object} defenseData - Datos de la sustentación
 * @param {string} defenseData.defenseDate - Fecha en formato ISO (YYYY-MM-DDTHH:mm:ss)
 * @param {string} defenseData.defenseLocation - Lugar de la sustentación
 * @returns {Promise<Object>} Respuesta con detalles de la propuesta
 */
export const proposeDefenseByDirector = async (studentModalityId, defenseData) => {
  console.log("📅 Proponiendo sustentación:", { studentModalityId, defenseData });
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/propose-defense-director`,
    defenseData
  );
  
  return response.data;
};

// ==================== VER DOCUMENTO (BLOB/PDF) ====================
/**
 * Obtener documento como blob para visualización
 * @param {number} studentDocumentId - ID del documento del estudiante
 * @returns {Promise<string>} URL del blob
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

// ==================== GESTIÓN DE CANCELACIONES ====================

/**
 * Obtener solicitudes de cancelación pendientes para el director
 * @returns {Promise<Array>} Lista de solicitudes
 */
export const getDirectorCancellationRequests = async () => {
  console.log("📋 Obteniendo solicitudes de cancelación para director");
  
  const response = await axios.get("/modalities/cancellation-request");
  return extractData(response.data);
};

/**
 * Ver documento de justificación de cancelación
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Blob>} Documento en formato blob
 */
export const viewCancellationDocument = async (studentModalityId) => {
  try {
    console.log("🔍 Descargando documento de cancelación para studentModalityId:", studentModalityId);

    const response = await axios.get(
      `/modalities/cancellation/document/${studentModalityId}`,
      {
        responseType: "blob",
      }
    );

    console.log("✅ PDF recibido, tamaño:", response.data.size);
    return response.data;
  } catch (error) {
    console.error("❌ Error al ver documento de cancelación:", error);
    throw error;
  }
};

/**
 * Aprobar solicitud de cancelación de modalidad (como director)
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const approveModalityCancellationByDirector = async (studentModalityId) => {
  console.log("✅ Aprobando cancelación:", studentModalityId);
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/cancellation/director/approve`
  );
  
  return response.data;
};

/**
 * Rechazar solicitud de cancelación de modalidad (como director)
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const rejectModalityCancellationByDirector = async (studentModalityId, reason) => {
  if (!reason || reason.trim() === "") {
    throw new Error("El motivo del rechazo es obligatorio");
  }
  
  console.log("❌ Rechazando cancelación:", { studentModalityId, reason });
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/cancellation/director/reject`,
    { reason }
  );
  
  return response.data;
};

/**
 * Marcar modalidad como lista para defensa y notificar a jefatura/coordinación
 * (paso intermedio antes de notificar al jurado).
 * POST /modalities/{studentModalityId}/ready-for-defense
 * @param {number} studentModalityId
 * @returns {Promise<Object>}
 */
export const notifyReadyForDefense = async (studentModalityId) => {
  console.log("📣 Notificando a jefatura para revisión final:", studentModalityId);
  const response = await axios.post(`/modalities/${studentModalityId}/ready-for-defense`);
  return response.data;
};

// ==================== UTILIDADES ====================

/**
 * Obtener mensaje de error legible (definido en src/utils/errorUtils.js)
 * @param {Error} error - Error capturado
 * @returns {string} Mensaje de error formateado
 */
export { getErrorMessage } from "../utils/errorUtils";

/**
 * Estados disponibles para filtrado
 * Basados en el enum ModalityProcessStatus del backend
 */
export const DIRECTOR_STATUS_OPTIONS = [
  { value: "MODALITY_SELECTED", label: "Modalidad Seleccionada" },
  { value: "UNDER_REVIEW_PROGRAM_HEAD", label: "En Revisión por Jefe de Programa" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_HEAD", label: "Correcciones Solicitadas por Jefe" },
  { value: "CORRECTIONS_SUBMITTED", label: "Correcciones Enviadas" },
  { value: "CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD", label: "Correcciones Enviadas a Jefe de Programa" },
  { value: "CORRECTIONS_SUBMITTED_TO_COMMITTEE", label: "Correcciones Enviadas a Comité" },
  { value: "CORRECTIONS_SUBMITTED_TO_EXAMINERS", label: "Correcciones Enviadas a Jurado" },
  { value: "CORRECTIONS_APPROVED", label: "Correcciones Aprobadas" },
  { value: "CORRECTIONS_REJECTED_FINAL", label: "Correcciones Rechazadas (Final)" },
  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Pendiente Comité de Currículo" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión por Comité de Currículo" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas por Comité" },
  { value: "READY_FOR_DIRECTOR_ASSIGNMENT", label: "Listo para Asignación de Director" },
  { value: "READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE", label: "Listo para Aprobación por Comité de Currículo" },
  { value: "APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE", label: "Aprobado por Comité de Currículo" },
  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR", label: "Sustentación Propuesta por Director" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "EXAMINERS_ASSIGNED", label: "Jurado Asignado" },
  { value: "READY_FOR_EXAMINERS", label: "Listo para Jurado" },
  { value: "PENDING_PROGRAM_HEAD_FINAL_REVIEW", label: "Pendiente de Revisión Final por Jefatura" },
  { value: "APPROVED_BY_PROGRAM_HEAD_FINAL_REVIEW", label: "Aprobado por Revisión Final de Jefatura" },
  { value: "DOCUMENTS_APPROVED_BY_EXAMINERS", label: "Documentos Aprobados por Jurado" },
  { value: "SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS", label: "Documentos Secundarios Aprobados por Jurado" },
  { value: "DOCUMENT_REVIEW_TIEBREAKER_REQUIRED", label: "Revisión de Documento Requiere Desempate" },
  { value: "CORRECTIONS_REQUESTED_EXAMINERS", label: "Correcciones Solicitadas por Jurado" },
  { value: "READY_FOR_DEFENSE", label: "Listo para Sustentación" },
  { value: "FINAL_REVIEW_COMPLETED", label: "Revisión Final Completada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },
  { value: "UNDER_EVALUATION_PRIMARY_EXAMINERS", label: "En Evaluación por Jurado Principal" },
  { value: "DISAGREEMENT_REQUIRES_TIEBREAKER", label: "Desacuerdo - Requiere Tercer Jurado" },
  { value: "UNDER_EVALUATION_TIEBREAKER", label: "En Evaluación por Tercer Jurado" },
  { value: "EVALUATION_COMPLETED", label: "Evaluación Completada" },
  { value: "PENDING_DISTINCTION_COMMITTEE_REVIEW", label: "Pendiente de Revisión de Distinción por Comité" },
  { value: "GRADED_APPROVED", label: "Aprobado" },
  { value: "GRADED_FAILED", label: "Reprobado" },
  { value: "MODALITY_CLOSED", label: "Modalidad Cancelada" },
  { value: "SEMINAR_CANCELED", label: "Diplomado Cancelado" },
  { value: "MODALITY_CANCELLED", label: "Modalidad Cancelada" },
  { value: "CANCELLATION_REQUESTED", label: "Cancelación Solicitada" },
  { value: "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR", label: "Cancelación Aprobada por Director" },
  { value: "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR", label: "Cancelación Rechazada por Director" },
  { value: "CANCELLED_WITHOUT_REPROVAL", label: "Cancelada sin Calificación" },
  { value: "CANCELLATION_REJECTED", label: "Cancelación Rechazada" },
  { value: "CANCELLED_BY_CORRECTION_TIMEOUT", label: "Cancelada por Timeout de Correcciones" },
  { value: "EDIT_REQUESTED_BY_STUDENT", label: "Edición Solicitada por Estudiante" },
];

/**
 * Obtener clase CSS para badge de estado
 * @param {string} status - Estado de la modalidad
 * @returns {string} Clase CSS
 */
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    MODALITY_SELECTED: "info",
    UNDER_REVIEW_PROGRAM_HEAD: "warning",
    CORRECTIONS_REQUESTED_PROGRAM_HEAD: "error",
    CORRECTIONS_SUBMITTED: "info",
    CORRECTIONS_SUBMITTED_TO_PROGRAM_HEAD: "info",
    CORRECTIONS_SUBMITTED_TO_COMMITTEE: "info",
    CORRECTIONS_SUBMITTED_TO_EXAMINERS: "info",
    CORRECTIONS_APPROVED: "success",
    CORRECTIONS_REJECTED_FINAL: "error",
    READY_FOR_PROGRAM_CURRICULUM_COMMITTEE: "warning",
    UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE: "warning",
    CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE: "error",
    READY_FOR_DIRECTOR_ASSIGNMENT: "warning",
    READY_FOR_APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE: "warning",
    APPROVED_BY_PROGRAM_CURRICULUM_COMMITTEE: "success",
    PROPOSAL_APPROVED: "success",
    DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR: "info",
    DEFENSE_SCHEDULED: "success",
    EXAMINERS_ASSIGNED: "info",
    READY_FOR_EXAMINERS: "info",
    PENDING_PROGRAM_HEAD_FINAL_REVIEW: "warning",
    APPROVED_BY_PROGRAM_HEAD_FINAL_REVIEW: "success",
    DOCUMENTS_APPROVED_BY_EXAMINERS: "success",
    SECONDARY_DOCUMENTS_APPROVED_BY_EXAMINERS: "success",
    DOCUMENT_REVIEW_TIEBREAKER_REQUIRED: "warning",
    CORRECTIONS_REQUESTED_EXAMINERS: "error",
    READY_FOR_DEFENSE: "success",
    FINAL_REVIEW_COMPLETED: "info",
    DEFENSE_COMPLETED: "success",
    UNDER_EVALUATION_PRIMARY_EXAMINERS: "warning",
    DISAGREEMENT_REQUIRES_TIEBREAKER: "warning",
    UNDER_EVALUATION_TIEBREAKER: "warning",
    EVALUATION_COMPLETED: "success",
    PENDING_DISTINCTION_COMMITTEE_REVIEW: "warning",
    GRADED_APPROVED: "success",
    GRADED_FAILED: "error",
    MODALITY_CLOSED: "info",
    SEMINAR_CANCELED: "error",
    MODALITY_CANCELLED: "error",
    CANCELLATION_REQUESTED: "error",
    CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR: "warning",
    CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR: "error",
    CANCELLED_WITHOUT_REPROVAL: "error",
    CANCELLATION_REJECTED: "error",
    CANCELLED_BY_CORRECTION_TIMEOUT: "error",
  };
  return statusMap[status] || "inactive";
};

/**
 * Obtener etiqueta legible del estado
 * @param {string} status - Estado de la modalidad
 * @returns {string} Etiqueta legible
 */
export const getStatusLabel = (status) => {
  const option = DIRECTOR_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : status;
};

/**
 * Formatear fecha a formato legible en español
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
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
 * Verificar si se puede proponer/programar sustentación
 * Solo disponible cuando el jurado completo la revisión final
 * @param {string} status - Estado actual de la modalidad
 * @returns {boolean} True si se puede proponer
 */
export const canProposeDefense = (status) => {
  return status === "FINAL_REVIEW_COMPLETED";
};

/**
 * Verificar si se puede notificar al jurado (READY_FOR_DEFENSE)
 * Disponible cuando el jurado aprobo la modalidad y el estudiante cargó docs secundarios
 * @param {string} status - Estado actual
 * @returns {boolean}
 */
export const canNotifyExaminers = (status) => {
  return status === "PROPOSAL_APPROVED";
};

/**
 * Verificar si hay solicitud de cancelación pendiente
 * @param {string} status - Estado actual de la modalidad
 * @returns {boolean} True si hay solicitud pendiente
 */
export const hasCancellationRequest = (status) => {
  return status === "CANCELLATION_REQUESTED";
};

/**
 * Verificar si la modalidad está completada
 * @param {string} status - Estado actual de la modalidad
 * @returns {boolean} True si está completada
 */
export const isCompleted = (status) => {
  return status === "GRADED_APPROVED" || 
         status === "GRADED_FAILED" || 
         status === "MODALITY_CANCELLED";
};
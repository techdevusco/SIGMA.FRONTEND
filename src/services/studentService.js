import api from "../api/axios";

// ========================================
// 🔧 HELPER FUNCTION
// ========================================
const extractData = (response, fallback = []) => {
  const data = response;
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.documents)) return data.documents;
    if (Array.isArray(data.faculties)) return data.faculties;
    if (Array.isArray(data.programs)) return data.programs;
    if (Array.isArray(data.modalities)) return data.modalities;
    
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      return data[keys[0]];
    }
  }
  
  console.warn("No se pudo extraer array de la respuesta:", data);
  return fallback;
};

// ========================================
// 🔧 DOCUMENT STATUS HELPERS
// ========================================

/**
 * Verificar si un estado de modalidad permite resubir documentos
 */
export const canResubmitDocuments = (status) => {
  const resubmitStatuses = [
    "CORRECTIONS_REQUESTED_PROGRAM_HEAD",
    "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE",
    "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE",
    "CORRECTIONS_REQUESTED_BY_SECRETARY",
    "UNDER_REVIEW_PROGRAM_HEAD",
    "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE"
  ];
  return resubmitStatuses.includes(status);
};

/**
 * Verificar si un documento específico necesita correcciones
 */
export const documentNeedsCorrections = (document) => {
  if (!document) return false;
  
  const correctionStatuses = [
    "REJECTED_BY_PROGRAM_HEAD",
    "REJECTED_BY_PROGRAM_CURRICULUM_COMMITTEE",
    "CORRECTIONS_REQUESTED",
    "REJECTED_FOR_SECRETARY_REVIEW",
    "REJECTED_FOR_COUNCIL_REVIEW",
    "CORRECTIONS_REQUESTED_BY_SECRETARY",
    "CORRECTIONS_REQUESTED_BY_COUNCIL",
    "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE",
    "REJECTED_FOR_PROGRAM_HEAD_REVIEW",
    "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW",
    "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD"
  ];
  
  return correctionStatuses.includes(document.status);
};

/**
 * Verificar si un documento puede ser resubido
 */
export const canResubmitDocument = (document, modalityStatus) => {
  if (!document) return false;
  
  // Si el documento necesita correcciones
  if (documentNeedsCorrections(document)) {
    return true;
  }
  
  // Si la modalidad está en estado de correcciones solicitadas
  // y el documento ya fue subido anteriormente
  if (canResubmitDocuments(modalityStatus) && document.uploaded) {
    return true;
  }
  
  return false;
};

/**
 * Obtener mensaje de estado del documento para el usuario
 */
export const getDocumentStatusMessage = (document) => {
  if (!document) return "";
  
  const statusMessages = {
    "NOT_UPLOADED": "Documento pendiente de carga",
    "PENDING": "Pendiente de revisión",
    "PENDING_REVIEW_PROGRAM_HEAD": "En revisión por jefatura de programa",
    "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW": "Aceptado por jefatura",
    "REJECTED_BY_PROGRAM_HEAD": "⚠️ Requiere correcciones - Jefatura de programa",
    "PENDING_REVIEW_PROGRAM_CURRICULUM_COMMITTEE": "En revisión por comité",
    "ACCEPTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "Aceptado por comité",
    "REJECTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "⚠️ Requiere correcciones - Comité de currículo",
    "CORRECTIONS_REQUESTED": "⚠️ Se solicitaron correcciones",
    "ACCEPTED_FOR_SECRETARY_REVIEW": "Aceptado por Jefe de Programa",
    "REJECTED_FOR_SECRETARY_REVIEW": "⚠️ Requiere correcciones - Jefe de Programa",
    "CORRECTIONS_REQUESTED_BY_SECRETARY": "⚠️ Correcciones solicitadas - Jefe de Programa",
    "ACCEPTED_FOR_COUNCIL_REVIEW": "Aceptado por comité de currículo de programa",
    "REJECTED_FOR_COUNCIL_REVIEW": "⚠️ Requiere correcciones - Comité de currículo de programa",
    "CORRECTIONS_REQUESTED_BY_COUNCIL": "⚠️ Correcciones solicitadas por comité de currículo de programa",
    "CORRECTIONS_REQUESTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "⚠️ Correcciones solicitadas - Comité de currículo",
    "REJECTED_FOR_PROGRAM_HEAD_REVIEW": "⚠️ Rechazado - Jefe de Programa",
    "REJECTED_FOR_PROGRAM_CURRICULUM_COMMITTEE_REVIEW": "⚠️ Rechazado - Comité",
    "CORRECTIONS_REQUESTED_BY_PROGRAM_HEAD": "⚠️ Correcciones - Jefatura",
  };
  
  return statusMessages[document.status] || document.statusDescription || document.status;
};

/**
 * Obtener clase CSS para el badge de estado del documento
 */
export const getDocumentStatusBadgeClass = (document) => {
  if (!document || !document.uploaded) return "inactive";
  
  if (documentNeedsCorrections(document)) return "error";
  
  const statusMap = {
    "PENDING": "warning",
    "PENDING_REVIEW_PROGRAM_HEAD": "warning",
    "ACCEPTED_FOR_PROGRAM_HEAD_REVIEW": "success",
    "PENDING_REVIEW_PROGRAM_CURRICULUM_COMMITTEE": "warning",
    "ACCEPTED_BY_PROGRAM_CURRICULUM_COMMITTEE": "success",
    "ACCEPTED_FOR_SECRETARY_REVIEW": "success",
    "ACCEPTED_FOR_COUNCIL_REVIEW": "success",
  };
  
  return statusMap[document.status] || "info";
};

// ========================================
// 📊 DASHBOARD
// ========================================
export const getStudentDashboard = async () => {
  const response = await api.get("/student/dashboard");
  return response.data;
};

// ========================================
// 📋 ESTADO DE LA MODALIDAD
// ========================================
export const getStudentStatus = async () => {
  const response = await api.get("/student/status");
  return response.data;
};

export const getCurrentModalityStatus = async () => {
  const res = await api.get("/students/modality/current");
  return res.data;
};

/**
 * Obtener el historial de modalidades completadas del estudiante
 */
export const getCompletedModalitiesHistory = async () => {
  try {
    const res = await api.get("/students/modalities/history");
    return res.data;
  } catch (error) {
    console.warn("⚠️ No se pudo cargar el historial de modalidades:", error);
    return [];
  }
};

// ========================================
// 🎓 MODALIDADES
// ========================================
export const getModalidades = async () => {
  const response = await api.get("/modalities");
  return extractData(response.data);
};

export const getModalityById = async (id) => {
  const res = await api.get(`/modalities/${id}`);
  return res.data;
};

export const startModality = async (modalityId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    `/modalities/${modalityId}/start`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

// ========================================
// 👤 PERFIL DEL ESTUDIANTE
// ========================================
export const getStudentProfile = async () => {
  const res = await api.get("/students/profile");
  return res.data;
};

export const saveStudentProfile = async (profile) => {
  const res = await api.post("/students/profile", profile);
  return res.data;
};

// ========================================
// 📄 DOCUMENTOS - MY DOCUMENTS 2.0
// ========================================

/**
 * ⭐ NUEVO ENDPOINT - MY DOCUMENTS 2.0
 * Obtener todos los documentos disponibles (MANDATORY y SECONDARY)
 * Solo muestra SECONDARY si todos los MANDATORY están subidos
 */
export const getMyAvailableDocuments = async () => {
  console.log("📡 Llamando a MY DOCUMENTS 2.0");
  const res = await api.get("/modalities/my-available-documents");
  console.log("✅ Respuesta MY DOCUMENTS 2.0:", res.data);
  return res.data;
};

/**
 * @deprecated - Usar getMyAvailableDocuments() en su lugar
 * Mantenido por compatibilidad
 */
export const getMyDocuments = async () => {
  console.warn("⚠️ getMyDocuments() está deprecado. Usa getMyAvailableDocuments()");
  const res = await api.get("/students/my-documents");
  return res.data;
};

/**
 * Subir o resubir un documento del estudiante
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {number} requiredDocumentId - ID del documento requerido (NO studentDocumentId)
 * @param {File} file - Archivo a subir
 */
export const uploadStudentDocument = async (
  studentModalityId,
  requiredDocumentId,
  file
) => {
  console.log("📤 Subiendo documento:", {
    studentModalityId,
    requiredDocumentId,
    fileName: file.name
  });

  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/modalities/${studentModalityId}/documents/${requiredDocumentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

/**
 * Resubir un documento que necesita correcciones
 * (Alias semántico de uploadStudentDocument)
 */
export const resubmitStudentDocument = async (
  studentModalityId,
  requiredDocumentId,
  file
) => {
  console.log("📤 Resubiendo documento corregido:", { studentModalityId, requiredDocumentId });
  return uploadStudentDocument(studentModalityId, requiredDocumentId, file);
};

/**
 * Ver documento como blob (para preview en navegador)
 * @param {number} studentDocumentId - ID del documento del estudiante ya subido
 */
export const getStudentDocumentBlob = async (studentDocumentId) => {
  console.log("🔍 [ESTUDIANTE] Descargando documento ID:", studentDocumentId);

  try {
    const response = await api.get(
      `/students/documents/${studentDocumentId}/view`,
      {
        responseType: "blob",
      }
    );

    console.log("✅ PDF recibido, tamaño:", response.data.size);

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);

    return url;
  } catch (error) {
    console.error("❌ Error al descargar documento:", error);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Mensaje:", error.response?.data);
    
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para ver este documento");
    } else if (error.response?.status === 404) {
      throw new Error("Documento no encontrado");
    } else {
      throw new Error("Error al cargar el documento. Intenta nuevamente.");
    }
  }
};

// ========================================
// 🚫 CANCELACIÓN DE MODALIDAD
// ========================================
export const requestCancellation = async (studentId) => {
  const res = await api.post(`/students/${studentId}/request-cancellation`);
  return res.data;
};

export const requestCancellationModality = async (studentModalityId) => {
  const res = await api.post(
    `/students/${studentModalityId}/request-cancellation`
  );
  return res.data;
};

export const uploadCancellationDocument = async (studentModalityId, formData) => {
  const response = await api.post(
    `/students/cancellation-document/${studentModalityId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// ========================================
// 🎓 FACULTADES Y PROGRAMAS (ESTUDIANTE)
// ========================================
export const getActiveFacultiesStudent = async () => {
  const res = await api.get("/faculties/active");
  return extractData(res.data);
};

export const getActiveProgramsStudent = async () => {
  const res = await api.get("/academic-programs/active");
  return extractData(res.data);
};

// ========================================
// 🔧 UTILIDADES
// ========================================

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

// ========================================
// Traducciones de Estados de Modalidades
// ========================================

export const MODALITY_STATUS_OPTIONS = [
  { value: "MODALITY_SELECTED", label: "Modalidad Seleccionada" },
  { value: "UNDER_REVIEW_PROGRAM_HEAD", label: "En Revisión por Jefe de Programa" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_HEAD", label: "Correcciones Solicitadas por Jefe" },
  { value: "CORRECTIONS_SUBMITTED", label: "Correcciones Enviadas" },
  { value: "CORRECTIONS_APPROVED", label: "Correcciones Aprobadas" },
  { value: "CORRECTIONS_REJECTED_FINAL", label: "Correcciones Rechazadas (Final)" },
  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Pendiente Comité de Currículo" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión por Comité de Currículo" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas por Comité" },
  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR", label: "Sustentación Propuesta por Director" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "EXAMINERS_ASSIGNED", label: "Jueces Asignados" },
  { value: "READY_FOR_EXAMINERS", label: "Listo para Jueces" },
  { value: "CORRECTIONS_REQUESTED_EXAMINERS", label: "Correcciones Solicitadas por Jueces" },
  { value: "READY_FOR_DEFENSE", label: "Listo para Sustentación" },
  { value: "FINAL_REVIEW_COMPLETED", label: "Revisión Final Completada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },
  { value: "UNDER_EVALUATION_PRIMARY_EXAMINERS", label: "En Evaluación por Jueces Principales" },
  { value: "DISAGREEMENT_REQUIRES_TIEBREAKER", label: "Desacuerdo - Requiere Tercer Juez" },
  { value: "UNDER_EVALUATION_TIEBREAKER", label: "En Evaluación por Tercer Juez" },
  { value: "EVALUATION_COMPLETED", label: "Evaluación Completada" },
  { value: "GRADED_APPROVED", label: "Aprobado" },
  { value: "GRADED_FAILED", label: "Reprobado" },
  { value: "MODALITY_CLOSED", label: "Modalidad Cerrada" },
  { value: "SEMINAR_CANCELED", label: "Seminario Cancelado" },
  { value: "MODALITY_CANCELLED", label: "Modalidad Cancelada" },
  { value: "CANCELLATION_REQUESTED", label: "Cancelación Solicitada" },
  { value: "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR", label: "Cancelación Aprobada por Director" },
  { value: "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR", label: "Cancelación Rechazada por Director" },
  { value: "CANCELLED_WITHOUT_REPROVAL", label: "Cancelada sin Calificación" },
  { value: "CANCELLATION_REJECTED", label: "Cancelación Rechazada" },
  { value: "CANCELLED_BY_CORRECTION_TIMEOUT", label: "Cancelada por Timeout de Correcciones" },
];

/**
 * Obtener etiqueta legible del estado
 * @param {string} status - Estado de la modalidad
 * @returns {string} Etiqueta legible
 */
export const getStatusLabel = (status) => {
  const option = MODALITY_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : status;
};

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
    CORRECTIONS_APPROVED: "success",
    CORRECTIONS_REJECTED_FINAL: "error",
    READY_FOR_PROGRAM_CURRICULUM_COMMITTEE: "warning",
    UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE: "warning",
    CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE: "error",
    PROPOSAL_APPROVED: "success",
    DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR: "info",
    DEFENSE_SCHEDULED: "success",
    EXAMINERS_ASSIGNED: "info",
    READY_FOR_EXAMINERS: "info",
    CORRECTIONS_REQUESTED_EXAMINERS: "error",
    READY_FOR_DEFENSE: "success",
    FINAL_REVIEW_COMPLETED: "info",
    DEFENSE_COMPLETED: "success",
    UNDER_EVALUATION_PRIMARY_EXAMINERS: "warning",
    DISAGREEMENT_REQUIRES_TIEBREAKER: "warning",
    UNDER_EVALUATION_TIEBREAKER: "warning",
    EVALUATION_COMPLETED: "success",
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

// ========================================
// 📚 SEMINARIOS
// ========================================

// Obtener seminarios disponibles para el estudiante
export const getAvailableSeminars = async () => {
  const res = await api.get("/modalities/seminar/available");
  return res.data;
};

// Inscribirse en un seminario específico
export const enrollInSeminar = async (seminarId) => {
  const res = await api.post(`/modalities/seminar/${seminarId}/enroll`);
  return res.data;
};
import axios from "../api/axios";

// ========================================
// 🔄 CAMBIAR DIRECTOR DE PROYECTO (COMITÉ)
// ========================================
/**
 * Cambia el director de proyecto de una modalidad
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {number} newDirectorId - ID del nuevo director
 * @param {string} reason - Razón del cambio
 * @returns {Promise<Object>} Respuesta del backend
 */
export const changeProjectDirector = async (studentModalityId, newDirectorId, reason) => {
  if (!newDirectorId) throw new Error("El ID del nuevo director es obligatorio");
  if (!reason || reason.trim() === "") throw new Error("La razón del cambio es obligatoria");
  const response = await axios.put(
    `/modalities/${studentModalityId}/change-director`,
    { newDirectorId, reason }
  );
  return response.data;
};
// ========================================
// 📋 OBTENER ESTUDIANTES PENDIENTES
// ========================================
export const getStudentsPendingModalities = async (statuses = [], searchName = "") => {
  let url = "/modalities/students/committee";
  const params = new URLSearchParams();
  
  // Agregar filtro de estados
  if (statuses && statuses.length > 0) {
    params.append("statuses", statuses.join(","));
  }
  
  // Agregar filtro de nombre
  if (searchName && searchName.trim()) {
    params.append("name", searchName.trim());
  }
  
  // Solo agregar ? si hay parámetros
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  console.log("📡 Comité llamando a:", url);
  
  const response = await axios.get(url);
  return response.data;
};

// ========================================
// 👤 OBTENER PERFIL DEL ESTUDIANTE (COMITÉ)
// ========================================
export const getStudentModalityProfile = async (studentModalityId) => {
  const response = await axios.get(
    `/modalities/students/${studentModalityId}/committee`
  );
  return response.data;
};

// ========================================
// 📄 VER DOCUMENTO (BLOB/PDF)
// ========================================
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
// 📝 REVISAR DOCUMENTO (COMITÉ) ✅ REAL
// ========================================
export const reviewDocumentCommittee = async (studentDocumentId, data) => {
  return (
    await axios.post(
      `/modalities/documents/${studentDocumentId}/review-committee`,
      data
    )
  ).data;
};

// ========================================
// ✅ APROBAR MODALIDAD (COMITÉ)
// ========================================
export const approveCommittee = async (studentModalityId) => {
  return (
    await axios.post(`/modalities/${studentModalityId}/approve-committee`)
  ).data;
};

// ========================================
// ❌ RECHAZAR MODALIDAD (COMITÉ)
// ========================================
export const rejectCommittee = async (studentModalityId, reason) => {
  return (
    await axios.post(
      `/modalities/${studentModalityId}/reject-committee`,
      { reason }
    )
  ).data;
};

// ========================================
// 👨‍🏫 ASIGNAR DIRECTOR DE PROYECTO
// ========================================
export const assignProjectDirector = async (studentModalityId, directorId) => {
  const response = await axios.post(
    `/modalities/${studentModalityId}/assign-director/${directorId}`
  );
  return response.data;
};

// ========================================
// 📅 PROGRAMAR SUSTENTACIÓN
// ========================================
export const scheduleDefense = async (studentModalityId, data) => {
  const response = await axios.post(
    `/modalities/${studentModalityId}/schedule-defense`,
    data
  );
  return response.data;
};

// ========================================
// 📊 EVALUACIÓN FINAL DEL JURADO
// ========================================
export const registerFinalEvaluation = async (studentModalityId, data) => {
  const response = await axios.post(
    `/modalities/${studentModalityId}/final-evaluation`,
    data
  );
  return response.data;
};

// ========================================
// 🔍 OBTENER DETALLES DE LA MODALIDAD
// ========================================
export const getModalityDetails = async (modalityId) => {
  const response = await axios.get(`/modalities/${modalityId}`);
  return response.data;
};

// ========================================
// 📋 OBTENER LISTA DE DIRECTORES
// ========================================
export const getProjectDirectors = async () => {
  const response = await axios.get("/modalities/project-directors");
  return response.data;
};

// ========================================
// 🚫 SOLICITUDES DE CANCELACIÓN
// ========================================

// Obtener todas las solicitudes de cancelación
export const getCancellationRequests = async () => {
  const response = await axios.get("/modalities/cancellation-request");
  return response.data;
};

// Aprobar cancelación
export const approveCancellation = async (studentModalityId) => {
  const response = await axios.post(
    `/modalities/${studentModalityId}/cancellation/approve`
  );
  return response.data;
};

// Rechazar cancelación
export const rejectCancellation = async (studentModalityId, reason) => {
  const response = await axios.post(
    `/modalities/${studentModalityId}/cancellation/reject`,
    { reason }
  );
  return response.data;
};

// Ver documento de justificación de cancelación
// ========================================
// 🚫 VER DOCUMENTO DE CANCELACIÓN (ACTUALIZADO)
// ========================================
// Reemplaza la función viewCancellationDocument existente en tu committeeService.js con esta:

export const viewCancellationDocument = async (studentModalityId) => {
  try {
    // Primero obtenemos la información del documento de cancelación
    console.log("🔍 [1/2] Obteniendo ID del documento de cancelación para studentModalityId:", studentModalityId);
    
    const profileResponse = await axios.get(
      `/modalities/students/${studentModalityId}/committee`
    );
    
    console.log("📦 [1/2] Perfil recibido:", profileResponse.data);
    
    // Buscar el documento con nombre "Justificación de cancelación de modalidad de grado"
    const cancellationDoc = profileResponse.data.documents?.find(
      doc => doc.documentName === "Justificación de cancelación de modalidad de grado"
    );
    
    if (!cancellationDoc) {
      throw new Error("No se encontró el documento de justificación de cancelación");
    }
    
    if (!cancellationDoc.uploaded) {
      throw new Error("El estudiante aún no ha subido el documento de cancelación");
    }
    
    const studentDocumentId = cancellationDoc.studentDocumentId;
    console.log("✅ [1/2] Documento encontrado, ID:", studentDocumentId);
    
    // Ahora descargamos el documento usando el endpoint normal
    console.log("🔍 [2/2] Descargando documento ID:", studentDocumentId);
    
    const response = await axios.get(
      `/modalities/student/${studentDocumentId}/view`,
      {
        responseType: "blob",
      }
    );

    console.log("✅ [2/2] PDF recibido, tamaño:", response.data.size);
    return response.data;
    
  } catch (error) {
    console.error("❌ Error al ver documento de cancelación:", error);
    throw error;
  }
};

// ==========================================
// 🆕 NUEVAS FUNCIONES PARA PROPUESTAS DE DEFENSA
// ==========================================

/**
 * Obtener propuestas de defensa pendientes de aprobación
 * @returns {Promise<Object>} Objeto con lista de propuestas
 */
export const getPendingDefenseProposals = async () => {
  console.log("📋 Obteniendo propuestas de defensa pendientes");
  const response = await axios.get("/modalities/defense-proposals/pending");
  return response.data;
};

/**
 * Aprobar propuesta de defensa del director
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const approveDefenseProposal = async (studentModalityId) => {
  console.log("✅ Aprobando propuesta de defensa:", studentModalityId);
  const response = await axios.post(
    `/modalities/${studentModalityId}/defense-proposals/approve`
  );
  return response.data;
};

/**
 * Reprogramar defensa (rechazar propuesta y poner nueva fecha)
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {Object} defenseData - Nueva fecha y lugar
 * @param {string} defenseData.defenseDate - Fecha en formato ISO
 * @param {string} defenseData.defenseLocation - Lugar de la sustentación
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const rescheduleDefense = async (studentModalityId, defenseData) => {
  console.log("📝 Reprogramando defensa:", { studentModalityId, defenseData });
  const response = await axios.post(
    `/modalities/${studentModalityId}/defense-proposals/reschedule`,
    defenseData
  );
  return response.data;
};

// ==========================================
// 👨‍⚖️ FUNCIONES PARA JURADO/EXAMINERS
// ==========================================

/**
 * Obtener lista de jurado disponible para el comité
 * Solo muestra jurado del programa académico del comité
 * @returns {Promise<Array>} Lista de jurado
 */
export const getExaminersForCommittee = async () => {
  console.log("👨‍⚖️ Obteniendo jurado disponible para el comité");
  const response = await axios.get("/modalities/examiners/for-committee");
  return response.data;
};

/**
 * Obtener el jurado asignado a una modalidad específica
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @returns {Promise<Array>} Lista de jurado asignado con nombre, email y rol
 */
export const getAssignedExaminers = async (studentModalityId) => {
  console.log("👨‍⚖️ Obteniendo jurado asignado para modalidad:", studentModalityId);
  try {
    const response = await axios.get(`/modalities/${studentModalityId}/examiners`);
    return response.data;
  } catch (error) {
    // Si el endpoint no existe o no hay jurado asignado, retornar array vacío
    if (error.response?.status === 404 || error.response?.status === 400) {
      console.log("ℹ️ No hay jurado asignado o endpoint no disponible");
      return [];
    }
    throw error;
  }
};

/**
 * Asignar jurado a una modalidad
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {Object} examinersData - Datos del jurado
 * @param {number} examinersData.primaryExaminer1Id - ID del jurado principal 1
 * @param {number} examinersData.primaryExaminer2Id - ID del jurado principal 2
 * @param {number|null} examinersData.tiebreakerExaminerId - ID del jurado de desempate (opcional)
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const assignExaminers = async (studentModalityId, examinersData) => {
  console.log("👨‍⚖️ Asignando jurado:", { studentModalityId, examinersData });
  const response = await axios.post(
    `/modalities/${studentModalityId}/examiners/assign`,
    examinersData
  );
  return response.data;
};

// ==========================================
// 🔒 CANCELAR MODALIDAD (COMITÉ)
// =========================================

export const closeModalityByCommittee = async (studentModalityId, reason) => {
  if (!reason || reason.trim() === "") {
    throw new Error("El motivo de la cancelaci");
  }
  
  console.log("🔒 Cancelando modalidad por decisión del comité:", { 
    studentModalityId, 
    reason: reason.substring(0, 50) + "..." 
  });
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/close-by-committee`,
    { reason: reason.trim() }
  );
  
  console.log("✅ Modalidad cancelada:", response.data);
  return response.data;
};

// ==========================================
// ✅ APROBAR MODALIDAD FINAL (COMITÉ)
// Para modalidades simplificadas sin director/jurado
// ==========================================

/**
 * Aprobar modalidad de forma final (sin proceso de director/jurado)
 * Aplica para: Pasantía, Posgrado, Diplomado, Producción Académica, etc.
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {string} observations - Observaciones opcionales del comité
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const approveFinalModalityByCommittee = async (studentModalityId, observations = "") => {
  console.log("✅ Aprobando modalidad de forma final:", { 
    studentModalityId, 
    observations 
  });
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/approve-final-by-committee`,
    { observations: observations.trim() || undefined }
  );
  
  console.log("✅ Modalidad aprobada definitivamente:", response.data);
  return response.data;
};

// ==========================================
// ❌ RECHAZAR MODALIDAD FINAL (COMITÉ)
// Para modalidades simplificadas sin director/jurado
// ==========================================

/**
 * Rechazar modalidad de forma final (sin proceso de director/jurado)
 * Aplica para: Pasantía, Posgrado, Diplomado, Producción Académica, etc.
 * @param {number} studentModalityId - ID de la modalidad del estudiante
 * @param {string} reason - Razón del rechazo (obligatorio)
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export const rejectFinalModalityByCommittee = async (studentModalityId, reason) => {
  if (!reason || reason.trim() === "") {
    throw new Error("La razón del rechazo es obligatoria");
  }
  
  console.log("❌ Rechazando modalidad de forma final:", { 
    studentModalityId, 
    reason: reason.substring(0, 50) + "..." 
  });
  
  const response = await axios.post(
    `/modalities/${studentModalityId}/reject-final-by-committee`,
    { reason: reason.trim() }
  );
  
  console.log("❌ Modalidad rechazada definitivamente:", response.data);
  return response.data;
};

// ==========================================
// 🎯 HELPER: Detectar si modalidad es simplificada
// ==========================================

/**
 * Determina si una modalidad usa el proceso simplificado
 * (sin director/jurado/sustentación)
 * @param {string} modalityName - Nombre de la modalidad
 * @returns {boolean} true si es modalidad simplificada
 */
export const isSimplifiedModality = (modalityName) => {
  if (!modalityName) return false;
  
  const simplifiedModalities = [
    "PASANTIA",
    "PASANTÍA",
    "PLAN COMPLEMENTARIO POSGRADO",
    "POSGRADO",
    "SEMINARIO DE GRADO",
    "SEMINARIO",
    "PRODUCCION ACADEMICA DE ALTO NIVEL",
    "PRODUCCIÓN ACADÉMICA DE ALTO NIVEL",
    "PORTAFOLIO PROFESIONAL",
    "PRACTICA PROFESIONAL",
    "PRÁCTICA PROFESIONAL",
    "SEMILLERO DE INVESTIGACION",
    "SEMILLERO DE INVESTIGACIÓN",
  ];
  
  const normalizedName = modalityName.toUpperCase().trim();
  
  return simplifiedModalities.some(simplified => 
    normalizedName.includes(simplified) || simplified.includes(normalizedName)
  );
};
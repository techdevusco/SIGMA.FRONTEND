// src/services/reportsService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// ========================================
// CONSTANTES DEL BACKEND (EXACTAS)
// ========================================

// Estados de proceso reales del enum ModalityProcessStatus
export const PROCESS_STATUSES = [
  // ========== SELECCIÓN Y REVISIÓN INICIAL ========== 
  { value: 'MODALITY_SELECTED', label: 'Modalidad Seleccionada' },
  { value: 'UNDER_REVIEW_PROGRAM_HEAD', label: 'Bajo Revisión de Jefatura de Programa' },
  { value: 'CORRECTIONS_REQUESTED_PROGRAM_HEAD', label: 'Correcciones Solicitadas por Jefatura de Programa' },
  { value: 'CORRECTIONS_SUBMITTED', label: 'Correcciones Enviadas' },
  { value: 'CORRECTIONS_APPROVED', label: 'Correcciones Aprobadas' },
  { value: 'CORRECTIONS_REJECTED_FINAL', label: 'Correcciones Rechazadas (Final)' },

  // ========== REVISIÓN DE COMITÉ ========== 
  { value: 'READY_FOR_PROGRAM_CURRICULUM_COMMITTEE', label: 'Listo para Comité' },
  { value: 'UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE', label: 'Revisión Comité' },
  { value: 'CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE', label: 'Correcciones Solicitadas por Comité' },
  { value: 'PROPOSAL_APPROVED', label: 'Propuesta Aprobada' },

  // ========== PROGRAMACIÓN DE SUSTENTACIÓN ========== 
  { value: 'DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR', label: 'Sustentación Solicitada por Director de Proyecto' },
  { value: 'DEFENSE_SCHEDULED', label: 'Sustentación Programada' },

  // ========== ASIGNACIÓN DE JUECES (NUEVO) ========== 
  { value: 'EXAMINERS_ASSIGNED', label: 'Jurados Asignados' },
  { value: 'READY_FOR_EXAMINERS', label: 'Listo para Jurados' },
  { value: 'CORRECTIONS_REQUESTED_EXAMINERS', label: 'Correcciones Solicitadas por Jurados' },
  { value: 'READY_FOR_DEFENSE', label: 'Listo para Sustentación' },
  { value: 'FINAL_REVIEW_COMPLETED', label: 'Revisión Final Completada' },

  // ========== SUSTENTACIÓN Y EVALUACIÓN ========== 
  { value: 'DEFENSE_COMPLETED', label: 'Sustentación Completada' },
  { value: 'UNDER_EVALUATION_PRIMARY_EXAMINERS', label: 'Evaluación Jurados Principales' },
  { value: 'DISAGREEMENT_REQUIRES_TIEBREAKER', label: 'Desacuerdo - Requiere Desempate' },
  { value: 'UNDER_EVALUATION_TIEBREAKER', label: 'Evaluación Juez de Desempate' },
  { value: 'EVALUATION_COMPLETED', label: 'Evaluación Completada' },

  // ========== RESULTADO FINAL ========== 
  { value: 'GRADED_APPROVED', label: 'Calificado - Aprobado' },
  { value: 'GRADED_FAILED', label: 'Calificado - Reprobado' },
  { value: 'MODALITY_CLOSED', label: 'Modalidad Cerrada' },
  { value: 'SEMINAR_CANCELED', label: 'Seminario Cancelado' },

  // ========== CANCELACIONES ========== 
  { value: 'MODALITY_CANCELLED', label: 'Modalidad Cancelada' },
  { value: 'CANCELLATION_REQUESTED', label: 'Cancelación Solicitada' },
  { value: 'CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR', label: 'Cancelación Aprobada por Director de Proyecto' },
  { value: 'CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR', label: 'Cancelación Rechazada por Director de Proyecto' },
  { value: 'CANCELLED_WITHOUT_REPROVAL', label: 'Cancelada sin Reprobación' },
  { value: 'CANCELLATION_REJECTED', label: 'Cancelación Rechazada' },
  { value: 'CANCELLED_BY_CORRECTION_TIMEOUT', label: 'Cancelada por Tiempo de Corrección' }
];

// Resultados de modalidades completadas
export const RESULT_TYPES = [
  { value: 'SUCCESS', label: 'Exitosa' },
  { value: 'FAILED', label: 'Fallida' }
];

// Tipos de distinción académica reales del enum
export const DISTINCTION_TYPES = [
  { value: 'AGREED_MERITORIOUS', label: 'Meritorio (Por Acuerdo)' },
  { value: 'TIEBREAKER_MERITORIOUS', label: 'Meritorio (Por Desempate)' },
  { value: 'AGREED_LAUREATE', label: 'Laureado (Por Acuerdo)' },
  { value: 'TIEBREAKER_LAUREATE', label: 'Laureado (Por Desempate)' }
];

// Estados de línea temporal
export const TIMELINE_STATUSES = [
  { value: 'ON_TIME', label: 'A Tiempo' },
  { value: 'DELAYED', label: 'Retrasado' },
  { value: 'AT_RISK', label: 'En Riesgo' }
];

// Tipos de modalidad (Individual/Grupal)
export const MODALITY_TYPE_FILTERS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'GROUP', label: 'Grupal' }
];

// Opciones de ordenamiento
export const SORT_OPTIONS = {
  student: [
    { value: 'NAME', label: 'Nombre' },
    { value: 'DATE', label: 'Fecha' },
    { value: 'STATUS', label: 'Estado' },
    { value: 'MODALITY', label: 'Modalidad' },
    { value: 'PROGRESS', label: 'Progreso' }
  ],
  completed: [
    { value: 'DATE', label: 'Fecha' },
    { value: 'GRADE', label: 'Calificación' },
    { value: 'TYPE', label: 'Tipo' },
    { value: 'DURATION', label: 'Duración' }
  ]
};

// ========================================
// HELPERS
// ========================================

// Obtener periodo actual
export const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const semester = month <= 6 ? 1 : 2;
  return { year, semester };
};

// Formatear fecha para el backend (LocalDateTime sin timezone)
const formatDateForBackend = (dateString) => {
  if (!dateString) return null;
  
  // Si ya viene en formato correcto, retornar
  if (dateString.includes('T') && !dateString.includes('Z')) {
    return dateString;
  }
  
  // Crear fecha y formatear como YYYY-MM-DDTHH:mm:ss
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Limpiar filtros (convertir arrays vacíos y strings vacíos en null)
const cleanFilters = (filters) => {
  const cleaned = {};
  
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    
    // Arrays vacíos -> null
    if (Array.isArray(value)) {
      cleaned[key] = value.length > 0 ? value : null;
    }
    // Strings vacíos -> null
    else if (typeof value === 'string' && value.trim() === '') {
      cleaned[key] = null;
    }
    // Números 0 o negativos en campos opcionales -> null
    else if (typeof value === 'number' && key.includes('Grade') && value <= 0) {
      cleaned[key] = null;
    }
    // Mantener valor
    else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

// ========================================
// FUNCIÓN GENÉRICA PARA DESCARGAR PDFs
// ========================================

const downloadPDF = async (url, method = 'GET', data = null, filename = 'reporte.pdf') => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    console.log(`🚀 Descargando: ${method} ${url}`);
    if (data) {
      console.log('📦 Data enviada:', JSON.stringify(data, null, 2));
    }

    const config = {
      url: `${API_URL}${url}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
      timeout: 120000, // 2 minutos de timeout
    };

    if (data && method === 'POST') {
      config.data = data;
    }

    const response = await axios(config);

    // Verificar que la respuesta sea un PDF válido
    if (response.data.type !== 'application/pdf') {
      console.error('❌ Respuesta no es un PDF:', response.data.type);
      throw new Error('La respuesta del servidor no es un PDF válido');
    }

    // Crear blob y descargar
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Obtener nombre del archivo del header si existe
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    console.log('✅ Reporte descargado exitosamente:', filename);
    console.log('📊 Total records:', response.headers['x-total-records'] || 'N/A');
    
    return {
      success: true,
      filename,
      totalRecords: response.headers['x-total-records']
    };
  } catch (error) {
    console.error('❌ Error al descargar reporte:', error);
    
    // Manejar errores específicos
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('📛 Status:', status);
      console.error('📛 Response:', data);
      
      // Si el servidor devolvió JSON de error, intentar parsearlo
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        try {
          const errorJson = JSON.parse(text);
          throw new Error(errorJson.error || errorJson.message || `Error del servidor (${status})`);
        } catch (e) {
          throw new Error(`Error del servidor: ${status}`);
        }
      }
      
      if (status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      } else if (status === 403) {
        throw new Error('No tienes permisos para generar este reporte.');
      } else if (status === 404) {
        throw new Error('Reporte no encontrado o recurso no existe.');
      } else if (status === 400) {
        throw new Error('Datos inválidos. Revisa los filtros aplicados.');
      } else {
        throw new Error(`Error del servidor (${status}). Intenta nuevamente.`);
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    } else {
      throw new Error(error.message || 'Error desconocido al descargar el reporte');
    }
  }
};

// ========================================
// OBTENER DATOS AUXILIARES
// ========================================

/**
 * Obtiene los tipos de modalidad disponibles desde el backend
 */
export const getAvailableModalityTypes = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/reports/modalities/types`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener tipos de modalidad: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Tipos de modalidad obtenidos:', result.data);
    
    return result.data?.availableTypes || [];
  } catch (error) {
    console.error('❌ Error al obtener tipos de modalidad:', error);
    return [];
  }
};

/**
 * Obtiene la lista de directores del programa
 */
export const getDirectors = async () => {
  try {
    const token = localStorage.getItem('token');
    // Nuevo endpoint según backend
    const response = await fetch(`${API_URL}/modalities/project-directors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('⚠️ No se pudo obtener lista de directores');
      return [];
    }

    const directors = await response.json();
    // El backend retorna un array de ProjectDirectorResponse
    // Adaptar a formato esperado por el frontend
    const mapped = directors.map(d => ({
      id: d.id,
      name: d.name ? `${d.name} ${d.lastName || ''}`.trim() : d.email,
      email: d.email
    }));
    console.log('✅ Directores obtenidos:', mapped.length);
    return mapped;
  } catch (error) {
    console.error('❌ Error al obtener directores:', error);
    return [];
  }
};

// ========================================
// ENDPOINTS DE REPORTES
// ========================================

/**
 * 1. REPORTE GLOBAL DE MODALIDADES ACTIVAS
 * GET /reports/global/modalities/pdf
 */
export const downloadGlobalModalitiesPDF = async () => {
  return downloadPDF(
    '/reports/global/modalities/pdf',
    'GET',
    null,
    'Reporte_Global_Modalidades.pdf'
  );
};

/**
 * 2. REPORTE FILTRADO (RF-46)
 * POST /reports/modalities/filtered/pdf
 */
export const downloadFilteredModalitiesPDF = async (filters = {}) => {
  console.log('📤 Filtros originales:', filters);
  
  const cleanedFilters = cleanFilters({
    degreeModalityIds: filters.degreeModalityIds || null,
    degreeModalityNames: filters.degreeModalityNames || null,
    processStatuses: filters.processStatuses || null,
    startDate: formatDateForBackend(filters.startDate),
    endDate: formatDateForBackend(filters.endDate),
    includeWithoutDirector: filters.includeWithoutDirector || false,
    onlyWithDirector: filters.onlyWithDirector || false
  });

  return downloadPDF(
    '/reports/modalities/filtered/pdf',
    'POST',
    cleanedFilters,
    'Reporte_Modalidades_Filtradas.pdf'
  );
};

/**
 * 3. REPORTE COMPARATIVO (RF-48)
 * POST /reports/modalities/comparison/pdf
 */
export const downloadModalityComparisonPDF = async (filters = {}) => {
  const currentPeriod = getCurrentPeriod();
  
  const cleanedFilters = cleanFilters({
    year: filters.year || currentPeriod.year,
    semester: filters.semester || currentPeriod.semester,
    includeHistoricalComparison: filters.includeHistoricalComparison !== false,
    historicalPeriodsCount: filters.historicalPeriodsCount || 4,
    includeTrendsAnalysis: filters.includeTrendsAnalysis !== false,
    onlyActiveModalities: filters.onlyActiveModalities || false
  });

  console.log('📦 Filtros de comparación:', cleanedFilters);

  return downloadPDF(
    '/reports/modalities/comparison/pdf',
    'POST',
    cleanedFilters,
    'Reporte_Comparativo_Modalidades.pdf'
  );
};

/**
 * 4. REPORTE HISTÓRICO DE MODALIDAD ESPECÍFICA
 * GET /reports/modalities/{modalityTypeId}/historical/pdf?periods={periods}
 */
export const downloadModalityHistoricalPDF = async (modalityTypeId, periods = 8) => {
  if (!modalityTypeId) {
    throw new Error('Debe seleccionar un tipo de modalidad');
  }

  console.log(`📤 Reporte histórico: modalidad=${modalityTypeId}, periodos=${periods}`);

  return downloadPDF(
    `/reports/modalities/${modalityTypeId}/historical/pdf?periods=${periods}`,
    'GET',
    null,
    `Reporte_Historico_Modalidad_${modalityTypeId}.pdf`
  );
};

/**
 * 5. REPORTE DE DIRECTORES Y MODALIDADES ASIGNADAS (RF-49)
 * POST /reports/directors/assigned-modalities/pdf
 */
export const downloadDirectorPerformancePDF = async (filters = {}) => {
  console.log('📤 Filtros de directores:', filters);

  // Solo enviar el valor si el usuario lo marca (true), si no, dejarlo como null para que el backend no filtre solo activas
  const onlyActiveModalities =
    typeof filters.onlyActiveModalities === 'boolean'
      ? filters.onlyActiveModalities
      : null;

  const cleanedFilters = cleanFilters({
    directorId: filters.directorId || null,
    processStatuses: filters.processStatuses || null,
    modalityTypes: filters.modalityTypes || null,
    onlyOverloaded: filters.onlyOverloaded || false,
    onlyAvailable: filters.onlyAvailable || false,
    onlyActiveModalities,
    includeWorkloadAnalysis: typeof filters.includeWorkloadAnalysis === 'boolean' ? filters.includeWorkloadAnalysis : true
  });

  console.log('📦 Filtros limpiados:', cleanedFilters);

  return downloadPDF(
    '/reports/directors/assigned-modalities/pdf',
    'POST',
    cleanedFilters,
    'Reporte_Directores_Modalidades.pdf'
  );
};

/**
 * 6. REPORTE INDIVIDUAL DE UN DIRECTOR ESPECÍFICO
 * GET /reports/directors/{directorId}/modalities/pdf
 */
export const downloadIndividualDirectorPDF = async (directorId) => {
  if (!directorId) {
    throw new Error('Debe seleccionar un director');
  }

  console.log(`📤 Reporte individual del director: ${directorId}`);

  return downloadPDF(
    `/reports/directors/${directorId}/modalities/pdf`,
    'GET',
    null,
    `Reporte_Director_${directorId}.pdf`
  );
};

/**
 * 7. LISTADO DE ESTUDIANTES CON FILTROS AVANZADOS
 * POST /reports/students/listing/pdf
 */
export const downloadStudentListingPDF = async (filters = {}) => {
  console.log('📤 Filtros de estudiantes:', filters);
  
  const cleanedFilters = cleanFilters({
    statuses: filters.statuses || null,
    modalityTypes: filters.modalityTypes || null,
    semesters: filters.semesters || null,
    year: filters.year || null,
    timelineStatus: filters.timelineStatus || null,
    modalityTypeFilter: filters.modalityTypeFilter || null,
    hasDirector: filters.hasDirector,
    sortBy: filters.sortBy || 'NAME',
    sortDirection: filters.sortDirection || 'ASC',
    includeInactive: filters.includeInactive || false
  });

  console.log('📦 Filtros limpiados:', cleanedFilters);

  return downloadPDF(
    '/reports/students/listing/pdf',
    'POST',
    cleanedFilters,
    'Reporte_Listado_Estudiantes.pdf'
  );
};

/**
 * 8. REPORTE DE MODALIDADES COMPLETADAS
 * POST /reports/modalities/completed/pdf
 */
export const downloadCompletedModalitiesPDF = async (filters = {}) => {
  console.log('📤 Filtros de completadas:', filters);
  
  const cleanedFilters = cleanFilters({
    modalityTypes: filters.modalityTypes || null,
    results: filters.results || null,
    year: filters.year || null,
    semester: filters.semester || null,
    startDate: filters.startDate || null, // Backend usa updatedAt, no necesita hora
    endDate: filters.endDate || null,
    onlyWithDistinction: filters.onlyWithDistinction || false,
    distinctionType: filters.distinctionType || null,
    directorId: filters.directorId || null,
    minGrade: filters.minGrade || null,
    maxGrade: filters.maxGrade || null,
    modalityTypeFilter: filters.modalityTypeFilter || null,
    sortBy: filters.sortBy || 'DATE',
    sortDirection: filters.sortDirection || 'DESC'
  });

  console.log('📦 Filtros limpiados:', cleanedFilters);

  return downloadPDF(
    '/reports/modalities/completed/pdf',
    'POST',
    cleanedFilters,
    'Reporte_Modalidades_Completadas.pdf'
  );
};

/**
 * 9. CALENDARIO DE SUSTENTACIONES
 * GET /reports/defense-calendar/pdf?startDate={}&endDate={}&includeCompleted={}
 */
export const downloadDefenseCalendarPDF = async (params = {}) => {
  console.log('📤 Parámetros de calendario:', params);
  
  // Construir query params
  const queryParams = new URLSearchParams();
  
  if (params.startDate) {
    queryParams.append('startDate', formatDateForBackend(params.startDate));
  }
  
  if (params.endDate) {
    queryParams.append('endDate', formatDateForBackend(params.endDate));
  }
  
  if (params.includeCompleted) {
    queryParams.append('includeCompleted', 'true');
  }

  const queryString = queryParams.toString();
  const url = queryString 
    ? `/reports/defense-calendar/pdf?${queryString}`
    : '/reports/defense-calendar/pdf';

  console.log('📦 URL final:', url);

  return downloadPDF(
    url,
    'GET',
    null,
    'Calendario_Sustentaciones.pdf'
  );
};

// ========================================
// FUNCIÓN DE PRUEBA
// ========================================

/**
 * Prueba la conexión con el backend
 */
export const testConnection = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/reports/health`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión exitosa:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
};
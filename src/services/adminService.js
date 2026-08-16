import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.modalidad.grado.fac-ingenieria-usco.com";
const API_URL = `${API_BASE_URL}/admin`;
const MODALITY_URL = `${API_BASE_URL}/modalities`;
const DOCUMENT_URL = `${API_BASE_URL}/required-documents`;
const FACULTY_URL = `${API_BASE_URL}/faculties`;
const PROGRAM_URL = `${API_BASE_URL}/academic-programs`;
const PROGRAM_DEGREE_URL = `${API_BASE_URL}/program-degree-modalities`;

// Función helper para extraer datos de respuestas del backend
const extractData = (response, fallback = []) => {
  const data = response.data;

  // Si ya es un array, retornarlo directamente
  if (Array.isArray(data)) {
    return data;
  }

  // Si es un objeto, buscar el array en propiedades comunes
  if (typeof data === 'object' && data !== null) {
    // Intentar propiedades comunes
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.faculties)) return data.faculties;
    if (Array.isArray(data.programs)) return data.programs;
    if (Array.isArray(data.modalities)) return data.modalities;
    if (Array.isArray(data.users)) return data.users;
    if (Array.isArray(data.roles)) return data.roles;
    if (Array.isArray(data.permissions)) return data.permissions;

    // Si tiene solo una propiedad y es un array, retornarla
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      return data[keys[0]];
    }
  }

  console.warn("No se pudo extraer array de la respuesta:", data);
  return fallback;
};

// ==================== ROLES ====================
export const getAllRoles = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/getRoles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const createRole = async (roleData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/createRole`, roleData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRole = async (id, roleData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_URL}/updateRole/${id}`, roleData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignRoleToUser = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/assignRole`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== PERMISSIONS ====================
export const getAllPermissions = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/getPermissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const createPermission = async (permissionData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/createPermission`, permissionData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== USERS ====================
export const getAllUsers = async (filters = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.role) params.append('role', filters.role);
  if (filters.facultyId) params.append('facultyId', filters.facultyId);
  if (filters.programId) params.append('programId', filters.programId);
  if (filters.search) params.append('name', filters.search);
  params.append('size', filters.size || 1000);

  const url = `${API_URL}/getUsers?${params.toString()}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const changeUserStatus = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/changeUserStatus`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const registerUserByAdmin = async (userData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/register-user`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== FACULTIES ====================
export const getAllFaculties = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${FACULTY_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const getActiveFaculties = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${FACULTY_URL}/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const getFacultyDetail = async (facultyId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${FACULTY_URL}/detail/${facultyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createFaculty = async (facultyData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${FACULTY_URL}/create`, facultyData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateFaculty = async (facultyId, facultyData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${FACULTY_URL}/update/${facultyId}`, facultyData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deactivateFaculty = async (facultyId) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${FACULTY_URL}/desactive/${facultyId}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== ACADEMIC PROGRAMS ====================
export const getAllAcademicPrograms = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${PROGRAM_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const getAcademicProgram = async (programId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${PROGRAM_URL}/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createAcademicProgram = async (programData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${PROGRAM_URL}/create`, programData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateAcademicProgram = async (programId, programData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${PROGRAM_URL}/update/${programId}`, programData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== PROGRAM DEGREE MODALITIES ====================
export const getProgramDegreeModalities = async (filters = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  if (filters.active !== undefined) params.append('active', filters.active);
  if (filters.degreeModalityId) params.append('degreeModalityId', filters.degreeModalityId);
  if (filters.facultyId) params.append('facultyId', filters.facultyId);
  if (filters.academicProgramId) params.append('academicProgramId', filters.academicProgramId);

  const response = await axios.get(`${PROGRAM_DEGREE_URL}/all?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const createProgramDegreeModality = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${PROGRAM_DEGREE_URL}/create`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateProgramDegreeModality = async (id, data) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${PROGRAM_DEGREE_URL}/update/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== ADMIN ASSIGNMENTS ====================
export const assignProgramHead = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/assign-program-head`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignProjectDirector = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/assign-project-director`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignExaminer = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/assign-examiner`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignCommitteeMember = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_URL}/assign-committee-member`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== VIEW ASSIGNMENTS ====================
export const getProgramHeads = async () => {
  const token = localStorage.getItem("token");
  // TODO: Confirmar endpoint correcto para program heads
  // Por ahora comentado hasta tener el endpoint correcto
  return [];
  /*
  const response = await axios.get(`${API_URL}/program-heads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
  */
};

// ==================== VIEW ASSIGNMENTS ====================
export const getCommitteeMembers = async (filters = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  // Solo agregar parámetros si tienen valor
  if (filters.academicProgramId) {
    params.append('academicProgramId', parseInt(filters.academicProgramId));
  }
  if (filters.facultyId) {
    params.append('facultyId', parseInt(filters.facultyId));
  }

  // ✅ CORRECTO: /modalities/committee
  const url = params.toString()
    ? `${MODALITY_URL}/committee?${params.toString()}`
    : `${MODALITY_URL}/committee`;

  console.log("🔍 Fetching committee members from:", url);

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("✅ Committee members response:", response.data);

  return extractData(response);
};
// ==================== MODALITIES ====================
export const getAllModalities = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${MODALITY_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const getModalitiesAdmin = async (status = null) => {
  const token = localStorage.getItem("token");
  let url = `${API_URL}/modalities`;

  if (status) {
    url += `?status=${status}`;
  }

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const createModality = async (modalityData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${MODALITY_URL}/create`, modalityData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateModality = async (modalityId, modalityData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${MODALITY_URL}/update/${modalityId}`, modalityData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteModality = async (modalityId) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${MODALITY_URL}/delete/${modalityId}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getModalityRequirements = async (modalityId, active = null) => {
  const token = localStorage.getItem("token");
  let url = `${MODALITY_URL}/${modalityId}/requirements`;

  if (active !== null) {
    url += `?active=${active}`;
  }

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const createModalityRequirements = async (modalityId, requirements) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${MODALITY_URL}/requirements/create/${modalityId}`,
    requirements,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateModalityRequirement = async (modalityId, requirementId, requirementData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(
    `${MODALITY_URL}/requirements/${modalityId}/update/${requirementId}`,
    requirementData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteModalityRequirement = async (requirementId) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(
    `${MODALITY_URL}/requirements/delete/${requirementId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const activateModalityRequirement = async (requirementId) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(
    `${MODALITY_URL}/requirements/active/${requirementId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// ==================== DOCUMENTS ====================
export const createRequiredDocument = async (documentData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${DOCUMENT_URL}/create`, documentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRequiredDocument = async (documentId, documentData) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${DOCUMENT_URL}/update/${documentId}`, documentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const viewRequiredDocuments = async (modalityId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${DOCUMENT_URL}/view/${modalityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const getRequiredDocumentsByModalityAndStatus = async (modalityId, active = null) => {
  const token = localStorage.getItem("token");
  let url = `${DOCUMENT_URL}/modality/${modalityId}`;

  if (active !== null) {
    url += `/filter?active=${active}`;
  }

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};

export const deleteRequiredDocument = async (documentId) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${DOCUMENT_URL}/delete/${documentId}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ==================== SECRETARY - FILTERS ====================
export const getStudentsByFilters = async (statuses = [], searchName = "") => {
  const token = localStorage.getItem("token");

  let url = `${MODALITY_URL}/students?`;

  if (statuses.length > 0) {
    url += `statuses=${statuses.join(",")}&`;
  }

  if (searchName) {
    url += `name=${encodeURIComponent(searchName)}&`;
  }

  url = url.replace(/[&?]$/, "");

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractData(response);
};
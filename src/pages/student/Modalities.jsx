import { useEffect, useState, useRef } from "react";
import {
  getModalidades,
  startModality,
  getStudentProfile,
  getCurrentModalityStatus,
  getModalityById,
  getCompletedModalitiesHistory,
  getAvailableSeminars,
  enrollInSeminar,
} from "../../services/studentService";
import {
  startGroupModality,
  getEligibleStudents,
  inviteStudent,
} from "../../services/ModalitiesGroupService";
import "../../styles/student/modalities.css";
import "../../styles/student/seminars-modal.css";

export default function Modalities() {
  const [modalities, setModalities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalMessage, setGlobalMessage] = useState("");
  const [modalityMessages, setModalityMessages] = useState({});
  const [sendingId, setSendingId] = useState(null);

  const [studentModalityId, setStudentModalityId] = useState(null);
  const [selectedModalityId, setSelectedModalityId] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalityDetail, setModalityDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [modalityHistory, setModalityHistory] = useState([]);

  const [showModalityTypeModal, setShowModalityTypeModal] = useState(false);
  const [showGroupFormModal, setShowGroupFormModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingModalityId, setPendingModalityId] = useState(null);
  const [modalityType, setModalityType] = useState(null);
  
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [groupStudentModalityId, setGroupStudentModalityId] = useState(null);

  // ✅ NUEVO: Estados para el modal de seminarios
  const [showSeminarModal, setShowSeminarModal] = useState(false);
  const [seminars, setSeminars] = useState([]);
  const [loadingSeminars, setLoadingSeminars] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [showSeminarConfirmModal, setShowSeminarConfirmModal] = useState(false);
  const [enrollingSeminar, setEnrollingSeminar] = useState(null);
  const [isSeminarioSelection, setIsSeminarioSelection] = useState(false);

  const modalityRefs = useRef({});

  const modalityAllowsGroup = (modality) => {
    if (!modality) return false;
    
    if (modality.hasOwnProperty('allowsGroup')) {
      return modality.allowsGroup === true;
    }
    
    if (modality.allowedTypes && Array.isArray(modality.allowedTypes)) {
      return modality.allowedTypes.includes('GROUP') || modality.allowedTypes.includes('BOTH');
    }
    
    const modalityName = modality.name?.toUpperCase() || '';
    
    const allowsGroupKeywords = [
      'PROYECTO DE GRADO',
      'EMPRENDIMIENTO',
      'FORTALECIMIENTO DE EMPRESA',
      'PRODUCCION ACADEMICA',
      'PRODUCCIÓN ACADÉMICA'
    ];
    
    const individualOnlyKeywords = [
      'PASANTIA',
      'PASANTÍA',
      'PLAN COMPLEMENTARIO',
      'POSGRADO',
      'SEMILLERO',
      'SEMINARIO',
      'PORTAFOLIO',
      'PRACTICA PROFESIONAL',
      'PRÁCTICA PROFESIONAL'
    ];
    
    for (const keyword of individualOnlyKeywords) {
      if (modalityName.includes(keyword)) {
        return false;
      }
    }
    
    for (const keyword of allowsGroupKeywords) {
      if (modalityName.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modalitiesRes = await getModalidades();
        setModalities(modalitiesRes);

        try {
          const profileRes = await getStudentProfile();
          setProfile(profileRes);
        } catch (profileErr) {
          console.warn("⚠️ No se pudo cargar el perfil:", profileErr);
          setProfile(null);
        }

        try {
          const currentModality = await getCurrentModalityStatus();
          if (currentModality && isModalityActive(currentModality.currentStatus)) {
            const smId = currentModality.studentModalityId || currentModality.id;
            setStudentModalityId(smId);
            setSelectedModalityId(currentModality.modalityId);
          }
        } catch {
          // No modalidad activa
        }

        try {
          const history = await getCompletedModalitiesHistory();
          setModalityHistory(history || []);
        } catch (historyErr) {
          console.warn("⚠️ No se pudo cargar el historial de modalidades:", historyErr);
          setModalityHistory([]);
        }
      } catch (err) {
        console.error(" Error al cargar modalidades:", err);
        setGlobalMessage("Error al cargar las modalidades");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isProfileComplete = () => {
    if (!profile) return false;

    const {
      approvedCredits,
      gpa,
      semester,
      studentCode,
      facultyId,
      academicProgramId,
      faculty,
      academicProgram
    } = profile;

    const hasFaculty = facultyId || faculty;
    const hasProgram = academicProgramId || academicProgram;
    const hasBasicInfo = approvedCredits && gpa && semester && studentCode;

    return hasBasicInfo && hasFaculty && hasProgram;
  };

  const isModalityActive = (modalityStatus) => {
    if (!modalityStatus) return false;

    const finalStates = [
      "MODALITY_CANCELLED",
      "MODALITY_CLOSED",
      "GRADED_APPROVED",
      "GRADED_FAILED",
      "CANCELLATION_REQUESTED",
      "CANCELLATION_REJECTED",
      "CANCELLED_WITHOUT_REPROVAL"
    ];

    return !finalStates.includes(modalityStatus);
  };

  const getPreviousModalityInfo = (modalityId) => {
    return modalityHistory.find(m => m.modalityId === modalityId);
  };

  const validateModalityStatus = (modalityId) => {
    const previousModality = getPreviousModalityInfo(modalityId);

    if (!previousModality) {
      return {
        canStart: true,
        canRestart: false,
        message: ""
      };
    }

    const status = previousModality.currentStatus;

    if (status === "MODALITY_CLOSED") {
  return {
    canStart: false,
    canRestart: false,
    message: "Esta modalidad ha sido cerrada y no puede reiniciarse. Puedes revisar otras modalidades disponibles que se ajusten a tu perfil académico."
  };
}

if (status === "MODALITY_CANCELLED") {
  return {
    canStart: true,
    canRestart: true,
    message: "Esta modalidad fue cancelada previamente. Puedes iniciar nuevamente esta modalidad o elegir otra modalidad disponible según tu avance académico."
  };
}

if (status === "GRADED_APPROVED") {
  return {
    canStart: false,
    canRestart: false,
    message: "Has aprobado esta modalidad. No es posible reiniciarla ni iniciar otra modalidad equivalente. Te sugerimos revisar las siguientes opciones para continuar tu proceso académico."
  };
}

if (status === "GRADED_FAILED") {
  return {
    canStart: true,
    canRestart: true,
    message: "No aprobaste esta modalidad. Puedes reiniciarla o iniciar otra modalidad disponible para cumplir con los requisitos de tu plan académico."
  };
}

return {
  canStart: false,
  canRestart: false,
  message: "⏳ Esta modalidad se encuentra en proceso. No puedes reiniciarla ni iniciar una nueva mientras tengas una modalidad activa. Espera a que se complete el proceso actual para continuar."
};
  };

  // ✅ NUEVA FUNCIÓN: Detectar si es Seminario
  const isSeminarioModality = (modality) => {
    if (!modality) return false;
    return modality.name?.toUpperCase().includes("SEMINARIO");
  };

  // ✅ NUEVA FUNCIÓN: Cargar seminarios disponibles
  const loadAvailableSeminars = async () => {
    try {
      setLoadingSeminars(true);
      const response = await getAvailableSeminars();
      
      if (response.success) {
        setSeminars(response.seminars || []);
      } else {
        setGlobalMessage("No se pudieron cargar los seminarios disponibles");
      }
    } catch (err) {
      console.error("❌ Error al cargar seminarios:", err);
      
      if (err.response?.status === 400) {
        setGlobalMessage(
          err.response?.data?.error || 
          "Para ver seminarios, debes tener iniciada la modalidad 'SEMINARIO DE GRADO'."
        );
      } else {
        setGlobalMessage("Error al cargar los seminarios disponibles");
      }
    } finally {
      setLoadingSeminars(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Inscribirse en seminario
  const handleEnrollInSeminar = async () => {
    if (!selectedSeminar) return;

    try {
      setEnrollingSeminar(selectedSeminar.id);

      const response = await enrollInSeminar(selectedSeminar.id);

      if (response.success) {
        setModalityMessages({
          [pendingModalityId]: {
            type: 'success',
            text: `🎉 ${response.message || "Te has inscrito exitosamente en el seminario"}`
          }
        });

        setShowSeminarConfirmModal(false);
        setShowSeminarModal(false);
        setShowDetailModal(false);

        // Recargar seminarios
        await loadAvailableSeminars();
      } else {
        setGlobalMessage(response.error || "Error al inscribirse en el seminario");
      }
    } catch (err) {
      console.error("❌ Error al inscribirse:", err);
      
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.message ||
                       "Error al inscribirse en el seminario";
      
      setGlobalMessage(errorMsg);
    } finally {
      setEnrollingSeminar(null);
    }
  };

  const handleStartModalitySelection = (modalityId) => {
    if (!isProfileComplete()) {
      setModalityMessages({
        [modalityId]: {
          type: 'error',
          text: 'Debes completar tu perfil antes de seleccionar una modalidad'
        }
      });
      return;
    }

    if (studentModalityId) {
      setModalityMessages({
        [modalityId]: {
          type: 'error',
          text: '⏳ Ya tienes una modalidad activa. No puedes iniciar una nueva mientras esté en proceso.'
        }
      });
      return;
    }

    const validation = validateModalityStatus(modalityId);
    
    if (!validation.canStart) {
      setModalityMessages({
        [modalityId]: {
          type: 'error',
          text: validation.message
        }
      });
      return;
    }

    setPendingModalityId(modalityId);
    setShowDetailModal(false);

    // ✅ NUEVO: Verificar si es Seminario - ahora también pasa por confirmación
    if (isSeminarioModality(modalityDetail)) {
      setIsSeminarioSelection(true);
      setModalityType("INDIVIDUAL");
      setShowConfirmModal(true);
      return;
    }
    
    // Verificar si permite grupos
    if (modalityAllowsGroup(modalityDetail)) {
      setShowModalityTypeModal(true);
    } else {
      setModalityType("INDIVIDUAL");
      setShowConfirmModal(true);
    }
  };

  const handleSelectIndividual = () => {
    setModalityType("INDIVIDUAL");
    setShowModalityTypeModal(false);
    setShowConfirmModal(true);
  };

  const handleSelectGroup = async () => {
    setModalityType("GROUP");
    setShowModalityTypeModal(false);
    
    setEligibleStudents([]);
    setSearchFilter("");
    setSelectedStudents([]);
    
    setShowGroupFormModal(true);
  };

  const loadEligibleStudents = async (filter = "") => {
    try {
      setLoadingStudents(true);
      const students = await getEligibleStudents(filter);
      setEligibleStudents(students);
    } catch (err) {
      console.error("❌ Error al cargar estudiantes:", err);
      setEligibleStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSearchStudents = (e) => {
    const value = e.target.value;
    setSearchFilter(value);
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      loadEligibleStudents(value);
    }, 300);
  };

  const handleToggleStudent = (student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.find(s => s.userId === student.userId);
      if (isSelected) {
        return prev.filter(s => s.userId !== student.userId);
      } else {
        if (prev.length >= 2) {
          alert("Máximo 2 estudiantes adicionales");
          return prev;
        }
        return [...prev, student];
      }
    });
  };

  const handleSendInvitations = async () => {
    if (selectedStudents.length === 0) {
      alert("Debes seleccionar al menos 1 estudiante");
      return;
    }

    setShowGroupFormModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    // ✅ NUEVO: Si es Seminario, primero confirma la modalidad y luego abre los seminarios
    if (isSeminarioSelection) {
      try {
        setSendingId(pendingModalityId);
        const res = await startModality(pendingModalityId);

        setStudentModalityId(res.studentModalityId);
        setSelectedModalityId(pendingModalityId);
        
        // Cerrar modal de confirmación y abrir modal de seminarios
        setShowConfirmModal(false);
        setIsSeminarioSelection(false);
        setModalityType(null);
        
        // Abrir modal de seminarios después de confirmar
        setShowSeminarModal(true);
        await loadAvailableSeminars();
        
      } catch (err) {
        console.error("❌ Error al iniciar modalidad seminario:", err);
        handleModalityError(pendingModalityId, err);
        setShowConfirmModal(false);
      } finally {
        setSendingId(null);
      }
      return;
    }
    
    if (modalityType === "INDIVIDUAL") {
      await handleSelectIndividualModality(pendingModalityId);
    } else {
      try {
        setSendingId(pendingModalityId);
        
        const res = await startGroupModality(pendingModalityId);
        const studentModalityId = res.studentModalityId;
        
        for (const student of selectedStudents) {
          await inviteStudent(studentModalityId, student.userId);
        }
        
        setStudentModalityId(studentModalityId);
        setSelectedModalityId(pendingModalityId);
        
        setModalityMessages({
          [pendingModalityId]: {
            type: 'success',
            text: `Modalidad grupal iniciada. Invitaciones enviadas a ${selectedStudents.length} estudiante(s). Esperando sus respuestas.`,
            fade: true // Indicador para fade automático
          }
        });
        
        setShowConfirmModal(false);
        resetGroupFlow();
        
      } catch (err) {
        console.error("❌ Error al iniciar modalidad grupal:", err);
        handleModalityError(pendingModalityId, err);
        setShowConfirmModal(false);
      } finally {
        setSendingId(null);
      }
    }
  };

  const handleSelectIndividualModality = async (modalityId) => {
    try {
      setSendingId(modalityId);
      const res = await startModality(modalityId);

      setStudentModalityId(res.studentModalityId);
      setSelectedModalityId(modalityId);
     
      setModalityMessages({
        [modalityId]: {
          type: 'success',
          text: res.message || "Modalidad seleccionada correctamente."
        }
      });

      setShowConfirmModal(false);
    } catch (err) {
      console.error("❌ Error al iniciar modalidad:", err);
      handleModalityError(modalityId, err);
    } finally {
      setSendingId(null);
    }
  };

  // ✅ NUEVO: Abrir modal de seminarios si la modalidad está activa (acceso desde página principal)
  const openSeminarModalIfActive = async () => {
    const hasSeminarioModality = modalityHistory.some(m => 
      m.name && m.name.toUpperCase().includes('SEMINARIO DE GRADO') && 
      isModalityActive(m.currentStatus)
    );
    
    if (hasSeminarioModality) {
      setShowSeminarModal(true);
      await loadAvailableSeminars();
    } else {
      setModalityMessages({
        general: {
          type: 'error',
          text: 'Para acceder a seminarios, debes tener iniciada la modalidad "SEMINARIO DE GRADO".'
        }
      });
    }
  };

  const handleModalityError = (modalityId, err) => {
    let errorContent = null;
     
    if (err.response?.data) {
      const errorData = err.response.data;
     
      if (typeof errorData === 'object' && errorData.eligible === false) {
        const validationResults = errorData.results;
       
        if (validationResults && Array.isArray(validationResults)) {
          const failedRequirements = validationResults.filter(r => !r.fulfilled);
         
          if (failedRequirements.length > 0) {
            errorContent = (
              <div className="validation-error-details">
                <div className="validation-error-header">
                  {errorData.message || "No cumples los requisitos académicos"}
                </div>
                <ul className="validation-error-list">
                  {failedRequirements.map((req, idx) => (
                    <li key={idx} className="validation-error-item">
                      <strong>{req.requirementName}:</strong>
                      <div className="validation-values">
                        <span>Tu valor: {req.studentValue}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          } else {
            errorContent = errorData.message;
          }
        } else {
          errorContent = errorData.message;
        }
      } else if (typeof errorData === 'string') {
        errorContent = errorData;
      } else if (errorData.message) {
        errorContent = errorData.message;
      } else {
        errorContent = "No se pudo iniciar la modalidad";
      }
    } else {
      errorContent = err.message || "No se pudo iniciar la modalidad";
    }
   
    setModalityMessages({
      [modalityId]: {
        type: 'error',
        text: errorContent
      }
    });
   
    setShowConfirmModal(false);
    setShowModalityTypeModal(false);
    setShowGroupFormModal(false);
  };

  const resetGroupFlow = () => {
    setModalityType(null);
    setSelectedStudents([]);
    setEligibleStudents([]);
    setSearchFilter("");
    setGroupStudentModalityId(null);
  };

  const handleViewDetails = async (modalityId) => {
    try {
      setLoadingDetail(true);
      const detail = await getModalityById(modalityId);
      setModalityDetail(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error("❌ Error al cargar detalles:", err);
      setModalityMessages({
        [modalityId]: {
          type: 'error',
          text: "Error al cargar los detalles de la modalidad"
        }
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: { text: "Abierto", class: "open" },
      CLOSED: { text: "Cerrado", class: "closed" },
      IN_PROGRESS: { text: "En Curso", class: "in-progress" },
      COMPLETED: { text: "Completado", class: "completed" },
    };

    const badge = badges[status] || { text: status, class: "default" };

    return (
      <span className={`seminar-status-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="modalities-loading">Cargando modalidades...</div>
    );
  }

  const profileComplete = isProfileComplete();

  return (
    <div className="modalities-container">
      <div className="modalities-header">
        <h2 className="modalities-title">Modalidades de Grado</h2>
        <p className="modalities-subtitle">
          Elija la modalidad que se adecúe a sus objetivos y plan de formación universitaria.
        </p>
      </div>

      {globalMessage && (
        <div className="modalities-message error">{globalMessage}</div>
      )}

      {!profileComplete && (
        <div className="profile-warning">
          <div className="profile-warning-title">
            <span className="profile-warning-icon">⚠️</span>
            Perfil incompleto
          </div>
          <p className="profile-warning-text">
            Debes completar tu perfil antes de poder seleccionar una modalidad de grado.{' '}
            <a href="/student/profile" style={{ color: '#856404', fontWeight: '600', textDecoration: 'underline' }}>
              Ir a mi perfil
            </a>
          </p>
        </div>
      )}

      {profileComplete && !studentModalityId && (
        <div className="modalities-message success">
          Tu perfil está completo. Ahora puedes seleccionar una modalidad.
        </div>
      )}

      {studentModalityId && (
        <div className="modalities-message info" style={{
          background: 'linear-gradient(90deg, #f9f6e7 0%, #f7f7fa 100%)',
          color: '#7A1117',
          borderLeft: '4px solid #D5CBA0',
          boxShadow: '0 2px 12px #7A111733',
          fontSize: '1.08rem',
          fontWeight: 700,
          letterSpacing: '0.2px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          animation: 'fadeOut 5s linear forwards',
        }}>
          <span style={{ fontSize: '1.3rem', color: '#7A1117', fontWeight: 900 }}>ℹ️</span>
          Ya tienes una modalidad seleccionada. Puedes subir tus documentos en la sección{' '}
          <a href="/student/documents" style={{ color: '#7A1117', fontWeight: '600', textDecoration: 'underline' }}>
            Documentos
          </a>
        </div>
      )}

      <ul className="modalities-list">
        {modalities.map((m) => (
          <li
            key={m.id}
            className="modality-card"
            ref={(el) => (modalityRefs.current[m.id] = el)}
          >
            <h3 className="modality-name">{m.name}</h3>
            <p className="modality-description">{m.description}</p>

            <div className="modality-requirements">
              <span className="modality-requirements-label">
                Créditos requeridos:
              </span>
              <span className="modality-requirements-value">
                {m.requiredCredits || 'N/A'}
              </span>
            </div>

            <div className="modality-type-badge">
              {modalityAllowsGroup(m) ? (
                <span className="badge-allows-group"></span>
              ) : (
                <span className="badge-individual-only"></span>
              )}
            </div>

            {modalityMessages[m.id] && (
              <div className={`modality-specific-message ${modalityMessages[m.id].type}`}>
                {modalityMessages[m.id].text}
              </div>
            )}

            <button
              className="modality-button secondary"
              onClick={() => handleViewDetails(m.id)}
            >
              Ver detalles
            </button>
          </li>
        ))}
      </ul>

      {/* ✅ NUEVO: ACCESO A SEMINARIOS DESDE PÁGINA PRINCIPAL */}
      {modalityHistory.some(m => m.name && m.name.toUpperCase().includes('SEMINARIO DE GRADO') && isModalityActive(m.currentStatus)) && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#f0f4ff', 
          borderLeft: '4px solid #7A1117',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#7A1117' }}>
            📚 Selecciona tu Seminario
          </h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Ya tienes la modalidad "SEMINARIO DE GRADO" activa. Entra y selecciona el seminario que deseas.
          </p>
          <button
            className="modality-button"
            onClick={openSeminarModalIfActive}
            style={{ backgroundColor: '#7A1117' }}
          >
            Acceder a Seminarios →
          </button>
        </div>
      )}

      {/* MODAL DETALLES */}
      {showDetailModal && modalityDetail && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-detail-header">
              <h3>{modalityDetail.name}</h3>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <p>Cargando...</p>
            ) : (
              <>
                <p className="modal-detail-description">{modalityDetail.description}</p>

                <div className="modal-detail-info">
                  <strong>Créditos requeridos:</strong> {modalityDetail.requiredCredits || 'N/A'}
                </div>

                <div className="modal-detail-info">
                  <strong>Tipo:</strong>{' '}
                  {modalityAllowsGroup(modalityDetail) ? (
                    <span style={{ color: '#7A1117', fontWeight: 700 }}>Individual o Grupal (hasta 3 integrantes)</span>
                  ) : (
                    <span style={{ color: '#7A1117', fontWeight: 700 }}>Solo Individual</span>
                  )}
                </div>

                <p className="section-title-modal">Requisitos</p>
                {modalityDetail.requirements && modalityDetail.requirements.length > 0 ? (
                  <ul className="modal-detail-list">
                    {modalityDetail.requirements.map((r) => (
                      <li key={r.id}>
                        <strong>{r.requirementName}</strong>
                        <p>{r.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    No hay requisitos específicos
                  </p>
                )}

                <p className="section-title-modal">Documentos obligatorios</p>
                {modalityDetail.documents && modalityDetail.documents.length > 0 ? (
                  <ul className="modal-detail-list">
                    {modalityDetail.documents.map((d) => (
                      <li key={d.id}>
                        <strong>{d.documentName}</strong>
                        <p>{d.description}</p>
                        <small className="doc-format-info">
                          {d.allowedFormat} · Máx {d.maxFileSizeMB}MB
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    No hay documentos obligatorios
                  </p>
                )}

                {profileComplete && !studentModalityId && 
                  modalityDetail && 
                  !validateModalityStatus(modalityDetail.id).canStart && (
                  <div className="modality-warning-box">
                    <strong>⚠️ No puedes iniciar esta modalidad:</strong>
                    <p>{validateModalityStatus(modalityDetail.id).message}</p>
                  </div>
                )}

                <button
                  className="modality-button"
                  disabled={!profileComplete || studentModalityId || 
                            (profileComplete && !studentModalityId && 
                             modalityDetail && 
                             !validateModalityStatus(modalityDetail.id).canStart)}
                  onClick={() => handleStartModalitySelection(modalityDetail.id)}
                >
                  {studentModalityId 
                    ? "Ya tienes una modalidad" 
                    : validateModalityStatus(modalityDetail?.id).canStart 
                    ? "Seleccionar modalidad" 
                    : "No disponible"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ NUEVO: MODAL DE SEMINARIOS */}
      {showSeminarModal && (
        <div className="modal-overlay" onClick={() => setShowSeminarModal(false)}>
          <div className="modal-seminar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-detail-header">
              <h3>Seminarios Disponibles</h3>
              <button className="modal-close-btn" onClick={() => setShowSeminarModal(false)}>
                ✕
              </button>
            </div>

            <p className="seminar-modal-subtitle">
              Selecciona el seminario en el que deseas inscribirte
            </p>

            {loadingSeminars ? (
              <div className="seminar-modal-loading">
                <div className="spinner"></div>
                <p>Cargando seminarios disponibles...</p>
              </div>
            ) : seminars.length === 0 ? (
              <div className="seminar-modal-empty">
                <p>📭 No hay seminarios disponibles para tu programa en este momento.</p>
              </div>
            ) : (
              <div className="seminar-table-wrapper">
                <table className="seminar-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Participantes</th>
                      <th>Espacios</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seminars.map((seminar) => (
                      <tr key={seminar.id}>
                        <td>
                          <div className="seminar-name">{seminar.name}</div>
                          <small className="seminar-program">{seminar.academicProgramName}</small>
                        </td>
                        <td className="seminar-description">{seminar.description}</td>
                        <td className="text-center">
                          {seminar.minParticipants} - {seminar.maxParticipants}
                        </td>
                        <td className="text-center">
                          <span className={`available-spots ${seminar.availableSpots === 0 ? 'full' : ''}`}>
                            {seminar.availableSpots}
                          </span>
                        </td>
                        <td className="seminar-cost">{formatCurrency(seminar.totalCost)}</td>
                        <td>{getStatusBadge(seminar.status)}</td>
                        <td>
                          <button
                            className="enroll-button"
                            onClick={() => {
                              setSelectedSeminar(seminar);
                              setShowSeminarConfirmModal(true);
                            }}
                            disabled={
                              seminar.status !== "OPEN" ||
                              seminar.availableSpots === 0 ||
                              enrollingSeminar === seminar.id
                            }
                          >
                            {enrollingSeminar === seminar.id
                              ? "Inscribiendo..."
                              : seminar.availableSpots === 0
                              ? "Sin cupos"
                              : "Unirse"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ NUEVO: MODAL CONFIRMACIÓN SEMINARIO */}
      {showSeminarConfirmModal && selectedSeminar && (
        <div className="modal-overlay" onClick={() => setShowSeminarConfirmModal(false)}>
          <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Inscripción en Seminario</h3>

            <div className="seminar-confirm-warning">
              ⚠️ <strong>IMPORTANTE: Al confirmar, quedarás inscrito en este seminario 
              y deberás completar con el pago del seminario. </strong>
            </div>

            <div className="seminar-confirm-details">
              <h4>{selectedSeminar.name}</h4>
              <p>{selectedSeminar.description}</p>

              <div className="detail-row">
                <span>Horas totales:</span>
                <strong>{selectedSeminar.totalHours} horas</strong>
              </div>

              <div className="detail-row">
                <span>Costo:</span>
                <strong className="cost-highlight">{formatCurrency(selectedSeminar.totalCost)}</strong>
              </div>

              <div className="detail-row">
                <span>Cupos disponibles:</span>
                <strong className={selectedSeminar.availableSpots < 5 ? "low-spots" : ""}>
                  {selectedSeminar.availableSpots} / {selectedSeminar.maxParticipants}
                </strong>
              </div>
            </div>

            <p className="seminar-confirm-question">
              ¿Estás seguro de que deseas inscribirte en este seminario?
            </p>

            <div className="modal-confirm-actions">
              <button
                className="modality-button secondary"
                onClick={() => setShowSeminarConfirmModal(false)}
                disabled={enrollingSeminar}
              >
                Cancelar
              </button>
              <button
                className="modality-button"
                onClick={handleEnrollInSeminar}
                disabled={enrollingSeminar}
              >
                {enrollingSeminar ? "Inscribiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECCIÓN TIPO */}
      {showModalityTypeModal && (
        <div className="modal-overlay" onClick={() => setShowModalityTypeModal(false)}>
          <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              color: '#7A1117',
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textShadow: '0 2px 8px #d5cba02a',
              marginBottom: '0.5rem'
            }}>Tipo de Modalidad</h3>
            <p style={{
              color: '#7A1117cc',
              fontSize: '1.13rem',
              fontWeight: 500,
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              Elige cómo deseas realizar tu modalidad de grado:
            </p>

            <div className="modality-type-options">
              <button
                className="modality-type-btn individual"
                onClick={handleSelectIndividual}
                disabled={sendingId}
                style={{
                  borderColor: '#D5CBA0',
                  boxShadow: '0 4px 16px #7A111733',
                  position: 'relative'
                }}
              >
                <span className="type-icon" style={{ fontSize: '3.5rem', color: '#7A1117' }}>👤</span>
                <span className="type-label" style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem' }}>Individual</span>
                <span className="type-description" style={{ color: '#7A1117cc', fontSize: '1rem', marginTop: '0.5rem' }}>Trabajarás solo en esta modalidad</span>
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#D5CBA0',
                  color: '#7A1117',
                  borderRadius: '8px',
                  padding: '0.3rem 0.7rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px #D5CBA033'
                }}>Solo</span>
              </button>

              <button
                className="modality-type-btn group"
                onClick={handleSelectGroup}
                disabled={sendingId}
                style={{
                  borderColor: '#D5CBA0',
                  boxShadow: '0 4px 16px #7A111733',
                  position: 'relative'
                }}
              >
                <span className="type-icon" style={{ fontSize: '3.5rem', color: '#7A1117' }}>👥</span>
                <span className="type-label" style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem' }}>Grupal</span>
                <span className="type-description" style={{ color: '#7A1117cc', fontSize: '1rem', marginTop: '0.5rem' }}>Hasta 3 integrantes (incluido tú)</span>
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#D5CBA0',
                  color: '#7A1117',
                  borderRadius: '8px',
                  padding: '0.3rem 0.7rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px #D5CBA033'
                }}>Grupo</span>
              </button>
            </div>

            <button
              className="modality-button secondary"
              onClick={() => {
                setShowModalityTypeModal(false);
                resetGroupFlow();
              }}
              disabled={sendingId}
              style={{ marginTop: '2rem' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO GRUPAL */}
      {showGroupFormModal && (
        <div className="modal-overlay" onClick={() => setShowGroupFormModal(false)}>
          <div className="modal-group-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-detail-header">
              <h3>Invitar Compañeros</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowGroupFormModal(false);
                  resetGroupFlow();
                }}
              >
                ✕
              </button>
            </div>

            <p className="group-form-subtitle">
              Selecciona hasta 2 compañeros para formar tu grupo (máximo 3 integrantes en total)
            </p>

            <input
              type="text"
              className="student-search-input"
              placeholder="Buscar por nombre..."
              value={searchFilter}
              onChange={handleSearchStudents}
            />

            {selectedStudents.length > 0 && (
              <div className="selected-students-summary">
                <h4>Seleccionados ({selectedStudents.length}/2):</h4>
                <ul>
                  {selectedStudents.map(s => (
                    <li key={s.userId}>
                      {s.fullName}
                      <button onClick={() => handleToggleStudent(s)}>✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="eligible-students-list">
              {loadingStudents ? (
                <p>Cargando estudiantes...</p>
              ) : searchFilter.trim() === "" ? (
                <p className="no-students" style={{ color: '#666', fontStyle: 'italic' }}>📝 Escribe el nombre de un compañero para buscar</p>
              ) : eligibleStudents.length === 0 ? (
                <p className="no-students">No hay estudiantes disponibles con ese nombre</p>
              ) : (
                eligibleStudents.map(student => {
                  const isSelected = selectedStudents.find(s => s.userId === student.userId);
                  return (
                    <div
                      key={student.userId}
                      className={`student-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleStudent(student)}
                    >
                      <div className="student-info">
                        <h4>{student.fullName}</h4>
                        <p>{student.academicProgramName}</p>
                        <small>Semestre {student.currentSemester}</small>
                      </div>
                      <div className="student-checkbox">
                        {isSelected && "✓"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-confirm-actions">
              <button
                className="modality-button secondary"
                onClick={() => {
                  setShowGroupFormModal(false);
                  resetGroupFlow();
                }}
              >
                Cancelar
              </button>

              <button
                className="modality-button"
                onClick={handleSendInvitations}
                disabled={selectedStudents.length === 0 || sendingId}
              >
                {sendingId ? "Enviando..." : `Invitar (${selectedStudents.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN FINAL */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-confirm" style={{
            background: 'linear-gradient(120deg, #f9f6e7 0%, #f7f7fa 60%, #e8ebf0 100%)',
            border: '2.5px solid #D5CBA0',
            boxShadow: '0 20px 40px rgba(122, 17, 23, 0.18)',
            borderRadius: '18px',
            padding: '2.5rem 2rem 2rem 2rem',
            maxWidth: '480px',
            position: 'relative',
            textAlign: 'center',
            animation: 'slideDown 0.35s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              color: '#7A1117',
              fontSize: '1.7rem',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textShadow: '0 2px 8px #d5cba02a',
              marginBottom: '1.2rem',
            }}>Confirmar selección</h3>

            {isSeminarioSelection ? (
              <div style={{
                background: '#fffbe6',
                borderLeft: '4px solid #D5CBA0',
                borderRadius: '8px',
                padding: '1.2rem',
                marginBottom: '1.5rem',
                color: '#7A1117',
                fontWeight: 600,
                fontSize: '1.08rem',
                boxShadow: '0 2px 12px #7A111733',
              }}>
                ¿Estás seguro que deseas activar la modalidad <strong>SEMINARIO DE GRADO</strong>?
                <br />Después de confirmar, podrás seleccionar el seminario en el que deseas inscribirte.
                <br /><strong>Esta acción no se puede deshacer.</strong>
              </div>
            ) : modalityType === "INDIVIDUAL" ? (
              <div style={{
                background: '#fffbe6',
                borderLeft: '4px solid #D5CBA0',
                borderRadius: '8px',
                padding: '1.2rem',
                marginBottom: '1.5rem',
                color: '#7A1117',
                fontWeight: 600,
                fontSize: '1.08rem',
                boxShadow: '0 2px 12px #7A111733',
              }}>
                ¿Estás seguro que deseas seleccionar esta modalidad de forma <strong>individual</strong>?
                <br /><strong>Esta acción no se puede deshacer.</strong>
              </div>
            ) : (
              <>
                <div style={{
                  background: '#f9fafb',
                  borderLeft: '4px solid #7A1117',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  marginBottom: '1.5rem',
                  color: '#7A1117',
                  fontWeight: 600,
                  fontSize: '1.08rem',
                  boxShadow: '0 2px 12px #7A111733',
                }}>
                  Has invitado a <strong>{selectedStudents.length} compañero(s)</strong>:
                  <ul className="invited-students-list" style={{
                    margin: '1rem 0',
                    background: '#fff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #D5CBA0',
                    padding: '1rem',
                    boxShadow: '0 2px 8px #D5CBA033',
                    textAlign: 'left',
                  }}>
                    {selectedStudents.map(s => (
                      <li key={s.userId} style={{
                        padding: '0.5rem 0',
                        color: '#7A1117',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}>• {s.fullName}</li>
                    ))}
                  </ul>
                  <span style={{
                    display: 'block',
                    color: '#666',
                    fontSize: '0.98rem',
                    marginTop: '0.5rem',
                    fontWeight: 400,
                  }}>
                    Las invitaciones serán enviadas. Una vez que acepten, podrán trabajar juntos.
                  </span>
                </div>
              </>
            )}

            <div className="modal-confirm-actions" style={{ marginTop: '2rem', gap: '1.2rem', display: 'flex', justifyContent: 'center' }}>
              <button
                className="modality-button secondary"
                disabled={sendingId}
                onClick={() => {
                  setShowConfirmModal(false);
                  resetGroupFlow();
                }}
                style={{
                  minWidth: '120px',
                  background: '#7A1117',
                  color: '#fff',
                  border: '2px solid #7A1117',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px #7A111733',
                  transition: 'all 0.3s',
                }}
              >
                Cancelar
              </button>

              <button
                className={`modality-button ${sendingId ? "loading" : ""}`}
                disabled={sendingId}
                onClick={handleFinalConfirm}
                style={{
                  minWidth: '120px',
                  background: '#D5CBA0',
                  color: '#7A1117',
                  border: '2px solid #D5CBA0',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px #D5CBA033',
                  transition: 'all 0.3s',
                }}
              >
                {sendingId ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
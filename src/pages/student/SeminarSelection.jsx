import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAvailableSeminars,
  enrollInSeminar,
  getCurrentModalityStatus,
  getStudentProfile,
  getModalidades,
  startModality,
} from "../../services/studentService";
import '../../styles/student/seminars-modal.css';

export default function SeminarSelection() {
  const navigate = useNavigate();

  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState(null);

  // Estado de la modalidad del estudiante: "none" | "seminar" | "other" | "enrolled"
  const [modalityState, setModalityState] = useState("none");
  const [seminarModalityId, setSeminarModalityId] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    const {
      approvedCredits, gpa, semester, studentCode,
      facultyId, academicProgramId, faculty, academicProgram
    } = profile;
    const hasFaculty = facultyId || faculty;
    const hasProgram = academicProgramId || academicProgram;
    const hasBasicInfo = approvedCredits && gpa && semester && studentCode;
    return hasBasicInfo && hasFaculty && hasProgram;
  };

  const loadPageData = async () => {
    try {
      setLoading(true);

      // Cargar perfil y modalidades en paralelo
      const [profileRes, modalitiesRes] = await Promise.all([
        getStudentProfile().catch(() => null),
        getModalidades().catch(() => []),
      ]);

      setProfileComplete(isProfileComplete(profileRes));

      // Buscar el ID de la modalidad de Diplomado
      const seminarMod = modalitiesRes.find(m =>
        m.name?.toUpperCase().includes("SEMINARIO")
      );
      if (seminarMod) {
        setSeminarModalityId(seminarMod.id);
      }

      // Verificar estado actual de modalidad
      try {
        const currentModality = await getCurrentModalityStatus();
        if (currentModality && currentModality.modalityName) {
          const isSeminario = currentModality.modalityName.toUpperCase().includes("SEMINARIO");
          if (isSeminario) {
            // Si el estado ya avanzó más allá de MODALITY_SELECTED, el estudiante ya está inscrito en un diplomado
            const status = currentModality.currentStatus;
            if (status && status !== "MODALITY_SELECTED") {
              setModalityState("enrolled");
            } else {
              setModalityState("seminar");
            }
          } else {
            setModalityState("other");
          }
        } else {
          setModalityState("none");
        }
      } catch {
        setModalityState("none");
      }

      // Cargar diplomados disponibles
      try {
        const response = await getAvailableSeminars();
        if (response.success) {
          setSeminars(response.seminars || []);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || "";
        if (errorMsg.toLowerCase().includes("ya estás inscrito") || errorMsg.toLowerCase().includes("already enrolled")) {
          setMessage("Ya estás inscrito en un diplomado. Puedes continuar con la carga de documentos.");
          setMessageType("success");
          setModalityState("enrolled");
        } else {
          console.warn("⚠️ No se pudieron cargar diplomados:", errorMsg);
          setSeminars([]);
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      setMessage("Error al cargar la información");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmModal = (seminar) => {
    if (modalityState === "enrolled") return;

    if (!profileComplete) {
      setMessage("Debes completar tu perfil antes de inscribirte en un diplomado.");
      setMessageType("error");
      return;
    }

    if (modalityState === "other") {
      setMessage("Ya tienes otra modalidad activa. No puedes inscribirte en un diplomado.");
      setMessageType("error");
      return;
    }

    setSelectedSeminar(seminar);
    setShowConfirmModal(true);
    setMessage("");
  };

  const handleEnroll = async () => {
    if (!selectedSeminar) return;

    try {
      setEnrolling(selectedSeminar.id);
      setMessage("");

      // Si no tiene modalidad activa, primero iniciar la modalidad de diplomado
      if (modalityState === "none") {
        if (!seminarModalityId) {
          setMessage("No se encontró la modalidad de Diplomado de Grado. Contacta a soporte.");
          setMessageType("error");
          setShowConfirmModal(false);
          return;
        }

        try {
          await startModality(seminarModalityId);
          setModalityState("seminar");
        } catch (err) {
          const errorMsg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Error al iniciar la modalidad de diplomado";
          setMessage(errorMsg);
          setMessageType("error");
          setShowConfirmModal(false);
          return;
        }
      }

      // Inscribirse en el diplomado
      const response = await enrollInSeminar(selectedSeminar.id);

      if (response.success) {
        setMessage(`🎉 ${response.message || "Te has inscrito exitosamente en el diplomado"}`);
        setMessageType("success");
        setModalityState("enrolled");
        setShowConfirmModal(false);
      } else {
        setMessage(response.error || "Error al inscribirse en el diplomado");
        setMessageType("error");
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error("❌ Error al inscribirse:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al inscribirse en el diplomado";

      // Si el backend dice que ya está inscrito, bloquear inscripciones futuras
      if (errorMsg.toLowerCase().includes("ya estás inscrito") || errorMsg.toLowerCase().includes("already enrolled")) {
        setModalityState("enrolled");
        setMessage("Ya estás inscrito en un diplomado. No puedes inscribirte en otro.");
        setMessageType("info");
      } else {
        setMessage(errorMsg);
        setMessageType("error");
      }
      setShowConfirmModal(false);
    } finally {
      setEnrolling(null);
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
    return <span className={`seminar-status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getJoinButtonText = (seminar) => {
    if (enrolling === seminar.id) return "Inscribiendo...";
    if (seminar.availableSpots === 0) return "Sin cupos";
    if (modalityState === "enrolled") return "Ya inscrito";
    if (modalityState === "other") return "Otra modalidad activa";
    if (modalityState === "none") return "Iniciar modalidad y unirse";
    return "Unirse";
  };

  const isJoinDisabled = (seminar) => {
    return (
      seminar.status !== "OPEN" ||
      seminar.availableSpots === 0 ||
      enrolling === seminar.id ||
      modalityState === "enrolled" ||
      modalityState === "other" ||
      !profileComplete
    );
  };

  if (loading) {
    return (
      <div className="seminars-page-container">
        <div className="seminar-modal-loading">
          <div className="spinner"></div>
          <p>Cargando diplomados disponibles...</p>
        </div>
      </div>
    );
  }

  if (modalityState === "enrolled") {
    return (
      <div className="seminars-page-container">
        <div className="seminars-page-header">
          <h2>📚 Diplomados de Grado</h2>
        </div>
        <div className="seminar-modal-empty">
          <p>✅ Ya estás inscrito en un diplomado.<br/>Puedes continuar con la carga de tus documentos.</p>
          <button className="enroll-button" style={{ marginTop: '1rem' }} onClick={() => navigate("/student/documents")}>
            Ir a Documentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seminars-page-container">
      <div className="seminars-page-header">
        <h2>📚 Diplomados de Grado</h2>
        <p className="seminar-modal-subtitle">
          Consulta los diplomados disponibles para tu programa. Si deseas inscribirte,
          se iniciará automáticamente la modalidad de Diplomado de Grado.
        </p>
      </div>

      {!profileComplete && (
        <div style={{
          background: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          borderRadius: '6px',
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          color: '#856404',
          fontWeight: 500,
        }}>
          ⚠️ Debes completar tu perfil antes de poder inscribirte en un diplomado.{' '}
          <a href="/student/profile" style={{ color: '#856404', fontWeight: 600, textDecoration: 'underline' }}>
            Ir a mi perfil
          </a>
        </div>
      )}

      {modalityState === "other" && (
        <div style={{
          background: '#f8d7da',
          borderLeft: '4px solid #dc3545',
          borderRadius: '6px',
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          color: '#721c24',
          fontWeight: 500,
        }}>
          ⚠️ Ya tienes otra modalidad activa. No puedes inscribirte en un diplomado mientras tengas otra modalidad en curso.
        </div>
      )}

      {modalityState === "none" && profileComplete && (
        <div style={{
          background: '#d1ecf1',
          borderLeft: '4px solid #17a2b8',
          borderRadius: '6px',
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          color: '#0c5460',
          fontWeight: 500,
        }}>
          ℹ️ Al unirte a un diplomado, se activará automáticamente la modalidad "Diplomado de Grado" como tu modalidad de grado.
        </div>
      )}

      {message && (
        <div className={`seminar-message ${messageType}`} style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {seminars.length === 0 ? (
        <div className="seminar-modal-empty">
          <p>📭 No hay diplomados disponibles para tu programa en este momento.</p>
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
                  <td className="text-center">{seminar.minParticipants} - {seminar.maxParticipants}</td>
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
                      onClick={() => handleOpenConfirmModal(seminar)}
                      disabled={isJoinDisabled(seminar)}
                    >
                      {getJoinButtonText(seminar)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación de inscripción */}
      {showConfirmModal && selectedSeminar && (
        <div className="modal-overlay" onClick={() => !enrolling && setShowConfirmModal(false)}>
          <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Inscripción en Diplomado</h3>

            {modalityState === "none" && (
              <div className="seminar-confirm-warning">
                ⚠️ <strong>IMPORTANTE: Al confirmar, se iniciará la modalidad "Diplomado de Grado"
                y quedarás inscrito en este diplomado. Deberás completar con el pago del diplomado.</strong>
              </div>
            )}

            {modalityState === "seminar" && (
              <div className="seminar-confirm-warning">
                ⚠️ <strong>IMPORTANTE: Al confirmar, quedarás inscrito en este diplomado
                y deberás completar con el pago del diplomado.</strong>
              </div>
            )}

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
              {modalityState === "none"
                ? "¿Estás seguro de que deseas iniciar la modalidad de Diplomado de Grado e inscribirte en este diplomado?"
                : "¿Estás seguro de que deseas inscribirte en este diplomado?"}
            </p>

            <div className="modal-confirm-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="enroll-button secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={enrolling}
                style={{ background: '#6c757d' }}
              >
                Cancelar
              </button>
              <button
                className="enroll-button primary"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling
                  ? "Procesando..."
                  : modalityState === "none"
                    ? "Iniciar modalidad e inscribirse"
                    : "Confirmar inscripción"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito después de inscripción */}
      {messageType === 'success' && message.includes('inscrito') && !showConfirmModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#7A1117', marginBottom: '1rem' }}>¡Diplomado seleccionado exitosamente!</h3>
            <div className="seminar-confirm-warning" style={{ justifyContent: 'center', textAlign: 'center' }}>
              ✅ Has seleccionado el diplomado <strong>{selectedSeminar?.name}</strong>.
            </div>
            <div className="modal-confirm-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="enroll-button primary" onClick={() => navigate('/student/documents')}>Ir a Documentos</button>
              <button className="enroll-button secondary" onClick={() => setMessage('')} style={{ background: '#6c757d' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
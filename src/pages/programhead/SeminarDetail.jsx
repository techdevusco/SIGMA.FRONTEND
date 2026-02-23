import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSeminarDetail,
  startSeminar,
  cancelSeminar,
  completeSeminar,
  getSeminarStatusLabel,
  getSeminarStatusClass,
  formatCurrency,
  formatDate,
  getStatusLabel,
} from "../../services/programsheadService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/programhead/seminardetail.css";

export default function SeminarDetail() {
  const { seminarId } = useParams();
  const navigate = useNavigate();

  const [seminar, setSeminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchSeminarDetail();
  }, [seminarId]);

  const fetchSeminarDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSeminarDetail(seminarId);

      if (response.success) {
        setSeminar(response.seminar);
      } else {
        setError(response.error || "Error al cargar el seminario");
      }
    } catch (err) {
      console.error("❌ Error al cargar detalle:", err);
      const errorMsg = err.response?.data?.error || "Error al cargar el seminario";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSeminar = () => {
    setConfirmAction({
      type: "start",
      title: "Iniciar Seminario",
      message: `¿Iniciar el seminario "${seminar.name}"?`,
      variant: "primary",
    });
  };

  const handleCancelSeminar = async () => {
    if (!cancelReason.trim()) {
      alert("Por favor ingresa una razón para la cancelación");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      const response = await cancelSeminar(seminarId, cancelReason);

      if (response.success) {
        setSuccessMessage(response.message);
        setShowCancelModal(false);
        setCancelReason("");
        await fetchSeminarDetail();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error("❌ Error al cancelar seminario:", err);
      const errorMsg = err.response?.data?.error || "Error al cancelar el seminario";
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSeminar = () => {
    setConfirmAction({
      type: "complete",
      title: "Completar Seminario",
      message: `¿Marcar como completado el seminario "${seminar.name}"?`,
      variant: "primary",
    });
  };

  const executeConfirmAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action.type === "start") {
      try {
        setActionLoading(true);
        setError("");
        const response = await startSeminar(seminarId);

        if (response.success) {
          setSuccessMessage(response.message);
          await fetchSeminarDetail();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setError(response.error);
        }
      } catch (err) {
        console.error("❌ Error al iniciar seminario:", err);
        const errorMsg = err.response?.data?.error || "Error al iniciar el seminario";
        setError(errorMsg);
      } finally {
        setActionLoading(false);
      }
    } else if (action.type === "complete") {
      try {
        setActionLoading(true);
        setError("");
        const response = await completeSeminar(seminarId);

        if (response.success) {
          setSuccessMessage(response.message);
          await fetchSeminarDetail();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setError(response.error);
        }
      } catch (err) {
        console.error("❌ Error al completar seminario:", err);
        const errorMsg = err.response?.data?.error || "Error al completar el seminario";
        setError(errorMsg);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditSeminar = () => {
    navigate(`/jefeprograma/seminars/${seminarId}/edit`);
  };

  if (loading) {
    return (
      <div className="seminar-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !seminar) {
    return (
      <div className="seminar-detail-container">
        <div className="alert alert-error">{error}</div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="seminar-detail-container">
        <div className="alert alert-error">Seminario no encontrado</div>
      </div>
    );
  }

  const canStart = seminar.status === "OPEN" && seminar.hasMinimumParticipants;
  const canCancel = seminar.status === "OPEN";
  const canComplete = seminar.status === "IN_PROGRESS";
  const canEdit = seminar.status !== "COMPLETED" && seminar.status !== "CLOSED";

  return (
    <div className="seminar-detail-container">
      {/* Header */}
      <div className="seminar-detail-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate("/jefeprograma/seminars")}
        >
          ← Volver
        </button>

        <div className="header-title-section">
          <h1 className="seminar-detail-title">{seminar.name}</h1>
          <span className={`badge badge-${getSeminarStatusClass(seminar.status)}`}>
            {getSeminarStatusLabel(seminar.status)}
          </span>
        </div>

        <div className="header-actions">
          {canEdit && (
            <button 
              className="btn btn-primary"
              onClick={handleEditSeminar}
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Información Principal */}
      <div className="detail-section">
        <h2>Información General</h2>
        
        <div className="info-card">
          {seminar.description && (
            <div className="info-row">
              <span className="info-label">Descripción:</span>
              <span className="info-value">{seminar.description}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Programa Académico:</span>
            <span className="info-value">{seminar.academicProgramName}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Facultad:</span>
            <span className="info-value">{seminar.facultyName}</span>
          </div>

          <div className="info-rows-grid">
            <div className="info-row">
              <span className="info-label">Costo Total:</span>
              <span className="info-value">{formatCurrency(seminar.totalCost)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Total de Horas:</span>
              <span className="info-value">{seminar.totalHours} horas</span>
            </div>

            <div className="info-row">
              <span className="info-label">Mínimo de Participantes:</span>
              <span className="info-value">{seminar.minParticipants}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Máximo de Participantes:</span>
              <span className="info-value">{seminar.maxParticipants}</span>
            </div>
          </div>

          <div className="info-rows-grid">
            <div className="info-row">
              <span className="info-label">Participantes Actuales:</span>
              <span className="info-value">
                {seminar.currentParticipants} ({seminar.fillPercentage.toFixed(1)}%)
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Cupos Disponibles:</span>
              <span className="info-value">{seminar.availableSeats}</span>
            </div>

            {seminar.startDate && (
              <div className="info-row">
                <span className="info-label">Fecha de Inicio:</span>
                <span className="info-value">{formatDate(seminar.startDate)}</span>
              </div>
            )}

            {seminar.endDate && (
              <div className="info-row">
                <span className="info-label">Fecha de Finalización:</span>
                <span className="info-value">{formatDate(seminar.endDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estudiantes Inscritos */}
      <div className="detail-section">
        <h2>Estudiantes Inscritos ({seminar.enrolledStudents?.length || 0})</h2>

        {seminar.enrolledStudents && seminar.enrolledStudents.length > 0 ? (
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Créditos</th>
                  <th>Promedio</th>
                  <th>Estado Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {seminar.enrolledStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td className="code">{student.studentCode}</td>
                    <td>{`${student.name} ${student.lastName}`}</td>
                    <td className="email">{student.email}</td>
                    <td className="numeric">
                      {student.approvedCredits} / {student.totalCreditsProgram}
                    </td>
                    <td className="numeric">
                      {student.academicAverage?.toFixed(2) || "N/A"}
                    </td>
                    <td>
                      {student.modalityInfo ? (
                        <span className="badge badge-info">
                          {getStatusLabel(student.modalityInfo.status)}
                        </span>
                      ) : (
                        <span className="badge badge-secondary">Sin modalidad</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-small">
            <p>No hay estudiantes inscritos en este seminario</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="detail-section">
        <h2>Acciones</h2>

        <div className="actions-grid">
          {canStart && (
            <button
              className="btn btn-success"
              onClick={handleStartSeminar}
              disabled={actionLoading}
            >
              {actionLoading ? "Procesando..." : "▶️ Iniciar Seminario"}
            </button>
          )}

          {!canStart && seminar.status === "OPEN" && (
            <div className="alert alert-warning">
              ⚠️ Necesitas al menos {seminar.minParticipants} participantes para iniciar.
              Actualmente hay {seminar.currentParticipants}.
            </div>
          )}

          {canCancel && (
            <button
              className="btn btn-danger"
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
            >
              ❌ Cancelar Seminario
            </button>
          )}

          {canComplete && (
            <button
              className="btn btn-success"
              onClick={handleCompleteSeminar}
              disabled={actionLoading}
            >
              {actionLoading ? "Procesando..." : "✅ Marcar como Completado"}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Cancelación */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar Seminario</h3>
            <p>Por favor indica la razón de la cancelación:</p>

            <textarea
              className="form-control modal-textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ejemplo: No se alcanzó el mínimo de participantes..."
              rows={4}
              disabled={actionLoading}
            />

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={actionLoading}
              >
                Cerrar
              </button>

              <button
                className="btn btn-danger"
                onClick={handleCancelSeminar}
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? "Cancelando..." : "Confirmar Cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

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
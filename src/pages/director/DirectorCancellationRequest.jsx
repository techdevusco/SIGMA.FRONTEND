import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDirectorCancellationRequests,
  viewCancellationDocument,
  approveModalityCancellationByDirector,
  rejectModalityCancellationByDirector,
} from "../../services/directorService";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/council/CancellationRequests.css";

export default function DirectorCancellationRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getDirectorCancellationRequests();
      console.log("📋 Solicitudes de cancelación recibidas:", data);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error al cargar solicitudes:", err);
      setMessage("Error al cargar solicitudes de cancelación");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (request) => {
    console.log("📄 Intentando ver documento de cancelación");
    console.log("📄 studentModalityId:", request.studentModalityId);
    
    setLoadingDoc(request.studentModalityId);

    try {
      const blob = await viewCancellationDocument(request.studentModalityId);
      
      console.log("✅ Blob recibido - Tamaño:", blob.size, "bytes");
      
      if (blob.size === 0) {
        throw new Error("El documento está vacío (0 bytes)");
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      console.log("✅ Abriendo documento en nueva pestaña");
      window.open(blobUrl, "_blank");
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
      
    } catch (err) {
      console.error("❌ Error:", err);
      
      let errorMessage = "Error al ver el documento";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Documento de cancelación no encontrado";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleViewProfile = (studentModalityId) => {
    navigate(`/project-director/students/${studentModalityId}`);
  };

  const handleApprove = (studentModalityId) => {
    setConfirmAction({
      studentModalityId,
      title: "Aprobar Cancelación",
      message: "¿Estás seguro de aprobar esta solicitud de cancelación?",
      variant: "danger",
    });
  };

  const executeApprove = async () => {
    const smId = confirmAction.studentModalityId;
    setConfirmAction(null);
    try {
      await approveModalityCancellationByDirector(smId);
      setMessage("✅ Solicitud aprobada exitosamente");
      fetchRequests();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error al aprobar:", err);
      setMessage(err.response?.data?.message || "Error al aprobar la solicitud");
    }
  };

  const handleOpenRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    
    if (!rejectReason.trim()) {
      setMessage("⚠️ Debes proporcionar un motivo para el rechazo");
      return;
    }

    try {
      await rejectModalityCancellationByDirector(selectedRequest.studentModalityId, rejectReason);
      setMessage("✅ Solicitud rechazada");
      setShowRejectModal(false);
      fetchRequests();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error al rechazar:", err);
      setMessage(err.response?.data?.message || "Error al rechazar la solicitud");
    }
  };

  if (loading) {
    return <div className="council-loading">Cargando solicitudes...</div>;
  }

  return (
    <div className="cancellation-requests-container">
      <div className="cancellation-requests-header">
        <h1>Solicitudes de Cancelación de Modalidad</h1>
        <p>Revisa y gestiona las solicitudes de cancelación de tus estudiantes asignados</p>
      </div>

      {message && (
        <div className={`cancellation-message ${message.includes("Error") || message.includes("❌") || message.includes("⚠️") ? "error" : "success"}`}>
          {message}
          <button 
            onClick={() => setMessage("")} 
            style={{ 
              marginLeft: "auto", 
              background: "transparent", 
              border: "none", 
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "inherit"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No hay solicitudes de cancelación pendientes</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Modalidad</th>
                <th>Fecha de Solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.studentModalityId}>
                  <td>
                    <strong>{request.studentName}</strong>
                    <br />
                    <small>{request.studentEmail}</small>
                  </td>
                  <td>{request.modalityName}</td>
                  <td>{new Date(request.requestDate).toLocaleDateString("es-CO")}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewDocument(request)}
                        disabled={loadingDoc === request.studentModalityId}
                        className={`btn-view-doc ${loadingDoc === request.studentModalityId ? "loading" : ""}`}
                        title="Ver documento"
                      >
                        {loadingDoc === request.studentModalityId ? "⏳ Cargando..." : "📄 Documento"}
                      </button>
                      <button
                        onClick={() => handleViewProfile(request.studentModalityId)}
                        className="btn-view-profile"
                        title="Ver perfil"
                      >
                        👤 Perfil
                      </button>
                      <button
                        onClick={() => handleApprove(request.studentModalityId)}
                        className="btn-approve"
                        title="Aprobar"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(request)}
                        className="btn-reject"
                        title="Rechazar"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rechazar Solicitud de Cancelación</h2>
              <button onClick={() => setShowRejectModal(false)} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="modal-form">
              <div className="form-group">
                <label>Estudiante</label>
                <input
                  type="text"
                  value={selectedRequest?.studentName}
                  className="input"
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Razón del Rechazo *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="textarea"
                  placeholder="Explica por qué se rechaza esta solicitud de cancelación..."
                  required
                  rows="5"
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Este motivo será enviado al estudiante
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm-reject">
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmText="Sí, aprobar"
        cancelText="Cancelar"
        variant={confirmAction?.variant || "danger"}
        onConfirm={executeApprove}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
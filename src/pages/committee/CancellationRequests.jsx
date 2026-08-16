import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCancellationRequests,
  viewCancellationDocument,
  approveCancellation,
  rejectCancellation,
} from "../../services/committeeService";
import { getErrorMessage } from "../../utils/errorUtils";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/council/CancellationRequests.css";

export default function CancellationRequests() {
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
      const data = await getCancellationRequests();
      console.log("📋 [DEBUG] Solicitudes de cancelación recibidas:", data);
      console.log("📋 [DEBUG] Primera solicitud (ejemplo):", data[0]);
      setRequests(data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      setMessage("Error al cargar solicitudes de cancelación");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (request) => {
    console.log("📄 [DEBUG] Intentando ver documento de cancelación");
    console.log("📄 [DEBUG] studentModalityId:", request.studentModalityId);
    
    setLoadingDoc(request.studentModalityId);

    try {
      const blob = await viewCancellationDocument(request.studentModalityId);
      
      console.log("✅ [DEBUG] Blob recibido - Tamaño:", blob.size, "bytes");
      
      if (blob.size === 0) {
        throw new Error("El documento está vacío (0 bytes)");
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      console.log("✅ [DEBUG] Abriendo documento en nueva pestaña");
      window.open(blobUrl, "_blank");
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
      
    } catch (err) {
      console.error("❌ [DEBUG] Error:", err);
      
      setMessage(
        getErrorMessage(
          err,
          err.response?.status === 404 ? "Documento de cancelación no encontrado" : "Error al ver el documento"
        )
      );
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleViewProfile = (studentModalityId) => {
    navigate(`/comite/students/${studentModalityId}`);
  };

  const handleApprove = (studentModalityId) => {
    setConfirmAction({
      studentModalityId,
      title: "Confirmar aprobación de cancelación",
      message: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(122,17,23,0.10)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="none"/><path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ color: '#7A1117', fontFamily: 'Georgia, Times New Roman, serif', fontSize: '1.15rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>
            ¿Deseas aprobar la solicitud de cancelación de modalidad?
          </div>
          <div style={{ color: '#D5CBA0', fontWeight: 700, fontSize: '1rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            Esta acción es irreversible y se notificará al estudiante.
          </div>
        </div>
      ),
      variant: "institutional",
    });
  };

  const executeApprove = async () => {
    const smId = confirmAction.studentModalityId;
    setConfirmAction(null);
    try {
      await approveCancellation(smId);
      setMessage("Solicitud aprobada exitosamente");
      fetchRequests();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error al aprobar:", err);
      setMessage(getErrorMessage(err, "Error al aprobar la solicitud"));
    }
  };

  const handleOpenRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await rejectCancellation(selectedRequest.studentModalityId, rejectReason);
      setMessage("Solicitud rechazada");
      setShowRejectModal(false);
      fetchRequests();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error al rechazar:", err);
      setMessage(getErrorMessage(err, "Error al rechazar la solicitud"));
    }
  };

  if (loading) {
    return <div className="council-loading">Cargando solicitudes...</div>;
  }

  return (
    <div className="cancellation-requests-container">
      <div className="cancellation-requests-header">
        <h1>Solicitudes de Cancelación de Modalidad</h1>
        <p>Revisa y gestiona las solicitudes de los estudiantes</p>
      </div>

      {message && (
        <div className={`cancellation-message ${message.includes("Error") ? "error" : "success"}`} style={{
          background: message.includes("Error") ? '#fde1e1' : 'linear-gradient(135deg, #D5CBA0 0%, #fff 100%)',
          color: message.includes("Error") ? '#5d0d12' : '#5d0d12',
          borderLeft: message.includes("Error") ? '4px solid #5d0d12' : '4px solid #D5CBA0',
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: '1rem',
        }}>
          {message}
          <button 
            onClick={() => setMessage("")} 
            style={{ 
              marginLeft: "1rem", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              fontSize: "1.2rem",
              color: '#5d0d12',
              fontWeight: 700
            }}
          >
            ×
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state" style={{ background: '#fff', border: '2px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(122,17,23,0.08)' }}>
          <div className="empty-icon" style={{ color: '#5d0d12', fontSize: '3.5rem', marginBottom: '1rem' }}>Sin solicitudes</div>
          <p style={{ color: '#5d0d12', fontWeight: 500 }}>No hay solicitudes de cancelación pendientes</p>
        </div>
      ) : (
        <div className="requests-table-container" style={{ background: 'linear-gradient(135deg, #fff 0%, #D5CBA0 100%)', border: '2px solid #D5CBA0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(122,17,23,0.08)' }}>
          <table className="requests-table">
            <thead>
  <tr style={{ background: '#5d0d12', color: '#fff' }}>
    <th>Estudiante</th>
    <th>Modalidad</th>
    <th>Fecha de Solicitud</th>
    <th>Acciones</th>
  </tr>
</thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.studentModalityId} style={{ borderBottom: '1px solid #D5CBA0' }}>
                  <td>
                    <strong style={{ color: '#5d0d12', fontWeight: 600 }}>{request.studentName}</strong>
                    <br />
                    <small style={{ color: '#D5CBA0' }}>{request.studentEmail}</small>
                  </td>
                  <td style={{ color: '#5d0d12', fontWeight: 500 }}>{request.modalityName}</td>
                  <td style={{ color: '#5d0d12', fontWeight: 500 }}>{new Date(request.requestDate).toLocaleDateString("es-CO")}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewDocument(request)}
                        disabled={loadingDoc === request.studentModalityId}
                        className={`btn-view-doc ${loadingDoc === request.studentModalityId ? "loading" : ""}`}
                        title="Ver documento"
                        style={{ background: '#fff', color: '#5d0d12', border: '1.5px solid #D5CBA0', fontWeight: 600 }}
                      >
                        {loadingDoc === request.studentModalityId ? "Cargando..." : "Documento"}
                      </button>
                      <button
                        onClick={() => handleViewProfile(request.studentModalityId)}
                        className="btn-view-profile"
                        title="Ver perfil"
                        style={{ background: '#fff', color: '#5d0d12', border: '1.5px solid #D5CBA0', fontWeight: 600 }}
                      >
                        Perfil
                      </button>
                      <button
                        onClick={() => handleApprove(request.studentModalityId)}
                        className="btn-approve"
                        title="Aprobar"
                        style={{ background: 'linear-gradient(135deg, #5d0d12 0%, #7A1117 100%)', color: '#fff', border: '1.5px solid #5d0d12', fontWeight: 600 }}
                      >
                        {loadingDoc === request.studentModalityId ? "Cargando..." : "Aprobar"}
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(request)}
                        className="btn-reject"
                        title="Rechazar"
                        style={{ background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', fontWeight: 600 }}
                      >
                        Rechazar
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
        <div className="modal-overlay" style={{ background: 'rgba(122,17,23,0.12)' }} onClick={() => setShowRejectModal(false)}>
          <div
            className="modal"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #D5CBA0 100%)',
              border: '2px solid #7A1117',
              borderRadius: '18px',
              boxShadow: '0 8px 32px rgba(122,17,23,0.12)',
              maxWidth: '420px',
              margin: 'auto',
              padding: '2rem 1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D5CBA0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Rechazar Solicitud</h2>
              <button onClick={() => setShowRejectModal(false)} className="modal-close" style={{ color: '#7A1117', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleReject} className="modal-form">
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Estudiante</label>
                <input
                  type="text"
                  value={selectedRequest?.studentName}
                  className="input"
                  disabled
                  style={{
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '1rem',
                    color: '#7A1117',
                    background: '#f9f6ee',
                    fontWeight: 500,
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Razón del Rechazo</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="textarea"
                  placeholder="Explica por qué se rechaza esta solicitud..."
                  required
                  rows="4"
                  style={{
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '1rem',
                    color: '#7A1117',
                    background: '#f9f6ee',
                    fontWeight: 500,
                  }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn-cancel"
                  style={{
                    background: '#fff',
                    color: '#7A1117',
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirm-reject"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: '#fff',
                    border: '1.5px solid #7A1117',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(122,17,23,0.08)'
                  }}
                >
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
        confirmText={
          <span style={{
            background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)',
            color: '#fff',
            border: '1.5px solid #7A1117',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '0.5rem 1.25rem',
            boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
            cursor: 'pointer',
            fontFamily: 'Georgia, Times New Roman, serif'
          }}>Sí, aprobar</span>
        }
        cancelText={
          <span style={{
            background: '#fff',
            color: '#7A1117',
            border: '1.5px solid #D5CBA0',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '0.5rem 1.25rem',
            cursor: 'pointer',
            fontFamily: 'Georgia, Times New Roman, serif'
          }}>Cancelar</span>
        }
        variant={confirmAction?.variant || "danger"}
        onConfirm={executeApprove}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
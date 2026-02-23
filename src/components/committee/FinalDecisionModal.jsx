import { useState } from "react";
import {
  approveFinalModalityByCommittee,
  rejectFinalModalityByCommittee,
} from "../../services/committeeService";

// Modalidades que usan aprobación/rechazo final directo
const SIMPLIFIED_MODALITIES = [
  "PLAN COMPLEMENTARIO POSGRADO",
  "SEMINARIO DE GRADO",
  "PRODUCCIÓN ACADEMICA DE ALTO NIVEL",
  "PRODUCCIÓN ACADÉMICA DE ALTO NIVEL",
  "SEMILLERO DE INVESTIGACION",
  "SEMILLERO DE INVESTIGACIÓN",
];

export const isFinalDecisionModality = (modalityName) => {
  if (!modalityName) return false;
  const normalized = modalityName.toUpperCase().trim();
  return SIMPLIFIED_MODALITIES.some((m) => normalized.includes(m) || m.includes(normalized));
};

export default function FinalDecisionModal({ studentModalityId, modalityName, studentName, onClose, onSuccess }) {
  const [mode, setMode] = useState(null); // "approve" | "reject"
  const [observations, setObservations] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await approveFinalModalityByCommittee(studentModalityId, observations);
      onSuccess(`✅ ${response.message || "Modalidad aprobada definitivamente"}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al aprobar la modalidad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("La razón del rechazo es obligatoria");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await rejectFinalModalityByCommittee(studentModalityId, reason);
      onSuccess(`✅ ${response.message || "Modalidad rechazada definitivamente"}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al rechazar la modalidad");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h2>⚖️ Decisión Final del Comité</h2>
          <button onClick={onClose} className="modal-close" disabled={submitting}>✕</button>
        </div>

        {/* Info */}
        <div className="modal-form">
          <div className="form-group">
            <label>Estudiante</label>
            <input type="text" value={studentName} className="input" disabled />
          </div>
          <div className="form-group">
            <label>Modalidad</label>
            <input type="text" value={modalityName} className="input" disabled />
          </div>

          {/* Selección inicial */}
          {!mode && (
            <div style={{ marginTop: "1.5rem" }}>
              <p style={{ marginBottom: "1rem", color: "#374151", fontWeight: "500" }}>
                ¿Cuál es la decisión del comité para esta modalidad?
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setMode("approve")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                  }}
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => setMode("reject")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                  }}
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Formulario APROBAR */}
          {mode === "approve" && (
            <form onSubmit={handleApprove}>
              <div style={{
                background: "#d1fae5",
                border: "1px solid #10b981",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                margin: "1rem 0",
              }}>
                <p style={{ margin: 0, color: "#065f46", fontSize: "0.875rem" }}>
                  <strong>✅ Aprobación Definitiva:</strong> El estado cambiará a <strong>APROBADO</strong> y el estudiante será notificado.
                </p>
              </div>
              <div className="form-group">
                <label>Observaciones (Opcional)</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="textarea"
                  placeholder="Agrega comentarios adicionales sobre la aprobación..."
                  rows={4}
                  disabled={submitting}
                />
              </div>
              {error && (
                <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: "0.5rem 0" }}>⚠️ {error}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setMode(null); setError(""); }} disabled={submitting}>
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: "#10b981", color: "white", padding: "0.6rem 1.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                >
                  {submitting ? "Aprobando..." : "Confirmar Aprobación"}
                </button>
              </div>
            </form>
          )}

          {/* Formulario RECHAZAR */}
          {mode === "reject" && (
            <form onSubmit={handleReject}>
              <div style={{
                background: "#fee2e2",
                border: "1px solid #ef4444",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                margin: "1rem 0",
              }}>
                <p style={{ margin: 0, color: "#991b1b", fontSize: "0.875rem" }}>
                  <strong>⚠️ Rechazo Definitivo:</strong> El estado cambiará a <strong>REPROBADO</strong>. El estudiante no podrá continuar con este proceso.
                </p>
              </div>
              <div className="form-group">
                <label>Razón del Rechazo <span style={{ color: "#dc2626" }}>*</span></label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="textarea"
                  placeholder="Explica detalladamente por qué se rechaza esta modalidad..."
                  required
                  rows={5}
                  disabled={submitting}
                />
                <small style={{ color: "#6b7280", marginTop: "0.25rem", display: "block" }}>
                  El estudiante será notificado por correo electrónico con esta razón.
                </small>
              </div>
              {error && (
                <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: "0.5rem 0" }}>⚠️ {error}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setMode(null); setError(""); }} disabled={submitting}>
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: "#dc2626", color: "white", padding: "0.6rem 1.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                >
                  {submitting ? "Rechazando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
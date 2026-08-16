import { useEffect, useState } from "react";
import { getProjectDirectors, changeProjectDirector } from "../../services/committeeService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/council/modals.css";

export default function ChangeDirectorModal({
  studentModalityId,
  currentDirectorName,
  onClose,
  onSuccess
}) {
  const [directors, setDirectors] = useState([]);
  const [selectedDirector, setSelectedDirector] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDirectors();
  }, []);

  const fetchDirectors = async () => {
    try {
      const data = await getProjectDirectors();
      setDirectors(data);
    } catch (err) {
      setError("Error al cargar la lista de directores");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDirector) {
      setError("Debes seleccionar un nuevo director");
      return;
    }
    if (!reason.trim()) {
      setError("Debes indicar el motivo del cambio");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await changeProjectDirector(
        studentModalityId,
        selectedDirector,
        reason
      );
      setSuccessMessage("✅ " + (response.message || "Director cambiado correctamente"));
      setTimeout(() => {
        onSuccess(response.message);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cambiar Director de Proyecto</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body">
          {successMessage ? (
            <div className="modal-success-animation">
              <div className="success-icon">✅</div>
              <div className="success-message">{successMessage}</div>
              <div className="success-submessage">
                El estudiante y ambos directores fueron notificados de este cambio
              </div>
            </div>
          ) : loading ? (
            <div className="loading-message">Cargando directores...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="info-box" style={{marginBottom:16}}>
                <p><strong>Director actual:</strong> {currentDirectorName}</p>
                <p>Selecciona el nuevo director y explica el motivo del cambio. El cambio quedará registrado y se notificará a los involucrados.</p>
              </div>
              <div className="form-group">
                <label>Selecciona el nuevo Director *</label>
                <select
                  className="form-select"
                  value={selectedDirector}
                  onChange={e => { setSelectedDirector(e.target.value); setError(""); }}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Selecciona un director --</option>
                  {directors
                    .filter(d => d.name !== currentDirectorName)
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.lastName} ({d.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Motivo del cambio *</label>
                <textarea
                  className="form-textarea"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explica la razón del cambio de director..."
                  rows={4}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? "Procesando..." : "Confirmar Cambio"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

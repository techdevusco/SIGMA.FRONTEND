import { useState, useEffect } from "react";
import { getProjectDirectors, assignProjectDirector } from "../../services/committeeService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/council/modals.css";

export default function AssignDirectorModal({ studentModalityId, onClose, onSuccess }) {
  const [directors, setDirectors] = useState([]);
  const [selectedDirector, setSelectedDirector] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDirectors();
  }, []);

  const fetchDirectors = async () => {
    try {
      const res = await getProjectDirectors();
      setDirectors(res);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la lista de directores");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDirector) {
      setError("Debes seleccionar un director");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await assignProjectDirector(studentModalityId, selectedDirector);

      // Obtener nombre del director seleccionado
      const selectedDirectorData = directors.find(
        (d) => d.id === parseInt(selectedDirector)
      );
      const directorName = selectedDirectorData
        ? `${selectedDirectorData.name}`
        : "";

      // Mostrar mensaje de éxito
      setSuccessMessage(
        `✅ Director asignado correctamente: ${directorName}`
      );

      // Esperar antes de cerrar
      setTimeout(() => {
        onSuccess();
      }, 5500);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Error al asignar director"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(122,17,23,0.12)' }} onClick={onClose}>
      <div
        className="modal-content"
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
          <h3 style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Asignar Director de Proyecto</h3>
          <button onClick={successMessage ? onSuccess : onClose} className="modal-close" style={{ color: '#7A1117', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 0, background: 'transparent' }}>
          {successMessage ? (
            <div className="modal-success-animation" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="success-message" style={{ color: '#7A1117', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{successMessage.replace('✅ ', '')}</div>
              <div className="success-submessage" style={{ color: '#D5CBA0', fontSize: '0.95rem', marginBottom: '1rem' }}>
                El estudiante fue notificado de esta novedad
              </div>
              <button
                onClick={onSuccess}
                style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          ) : loading ? (
            <div className="loading-message" style={{ color: '#7A1117', fontWeight: 500 }}>Cargando directores...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message" style={{ color: '#dc2626', background: '#fff7f7', border: '1px solid #dc2626', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Selecciona un Director *</label>
                <select
                  value={selectedDirector}
                  onChange={(e) => {
                    setSelectedDirector(e.target.value);
                    setError("");
                  }}
                  className="form-select"
                  disabled={submitting}
                  style={{
                    border: '1.5px solid #D5CBA0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '1rem',
                    color: '#7A1117',
                    background: '#fff',
                    fontWeight: 500,
                  }}
                >
                  <option value="">-- Selecciona un director --</option>
                  {directors.map((director) => (
                    <option key={director.id} value={director.id}>
                      {director.name} ({director.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="info-box" style={{ background: '#f9f6ee', border: '1px solid #D5CBA0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', color: '#7A1117', fontSize: '0.95rem' }}>
                <p style={{ margin: 0 }}>
                  El director asignado será responsable de supervisar el desarrollo de la modalidad del estudiante.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', background: 'transparent' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    background: 'transparent',
                    color: '#7A1117',
                    border: '1.5px solid #7A1117',
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
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)',
                    color: '#fff',
                    border: '1.5px solid #7A1117',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
                  }}
                >
                  {submitting ? "Asignando..." : "Asignar Director"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
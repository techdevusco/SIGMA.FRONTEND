import { useState, useEffect } from "react";
import { assignExaminers, getExaminersForCommittee } from "../../services/committeeService";
import "../../styles/council/modals.css";

export default function AssignExaminersModal({ studentModalityId, onClose, onSuccess }) {
  const [examiners, setExaminers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    primaryExaminer1Id: "",
    primaryExaminer2Id: "",
    tiebreakerExaminerId: "",
  });

  useEffect(() => {
    fetchExaminers();
  }, []);

  const fetchExaminers = async () => {
    try {
      const data = await getExaminersForCommittee();
      console.log("📋 Jurado disponible:", data);
      setExaminers(data);
    } catch (err) {
      console.error("Error al obtener jurado:", err);
      setError("Error al cargar la lista del jurado");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.primaryExaminer1Id || !formData.primaryExaminer2Id) {
      setError("Debes seleccionar al menos los 2 jurados principales");
      return;
    }

    // Verificar que no sean el mismo jurado
    const selectedIds = [
      formData.primaryExaminer1Id,
      formData.primaryExaminer2Id,
      formData.tiebreakerExaminerId,
    ].filter(Boolean);

    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size !== selectedIds.length) {
      setError("No puedes asignar el mismo jurado más de una vez");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        primaryExaminer1Id: parseInt(formData.primaryExaminer1Id),
        primaryExaminer2Id: parseInt(formData.primaryExaminer2Id),
        tiebreakerExaminerId: formData.tiebreakerExaminerId
          ? parseInt(formData.tiebreakerExaminerId)
          : null,
      };

      const response = await assignExaminers(studentModalityId, payload);

      console.log("✅ Jurado asignado:", response);

      // Mostrar mensaje de éxito
      setSuccessMessage("✅ Jurado asignado correctamente a la sustentación");

      // Esperar 3 segundos antes de cerrar
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      console.error("Error al asignar jurado:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Error al asignar jurado"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getExaminerName = (examinerId) => {
    const examiner = examiners.find((e) => e.id === parseInt(examinerId));
    return examiner ? `${examiner.name} ${examiner.lastName}` : "";
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>⏳ Cargando jurado...</h3>
            <button onClick={onClose} className="modal-close">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ background: 'rgba(122,17,23,0.12)' }} onClick={onClose}>
      <div
        className="modal-content modal-large"
        style={{
          background: 'linear-gradient(135deg, #fff 0%, #D5CBA0 100%)',
          border: '2px solid #7A1117',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(122,17,23,0.12)',
          maxWidth: '600px',
          margin: 'auto',
          padding: '2rem 1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D5CBA0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ color: '#7A1117', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Asignar Jurado de Sustentación</h3>
          <button onClick={onClose} className="modal-close" disabled={submitting} style={{ color: '#7A1117', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="modal-body">
          {successMessage ? (
            <div className="modal-success-animation" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="success-message" style={{ color: '#7A1117', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{successMessage.replace('✅ ', '')}</div>
              <div className="success-submessage" style={{ color: '#D5CBA0', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Cerrando automáticamente...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message" style={{ color: '#dc2626', background: '#fff7f7', border: '1px solid #dc2626', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

              <div className="info-box" style={{ background: '#f9f6ee', border: '1px solid #D5CBA0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', color: '#7A1117', fontSize: '0.95rem' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Instrucciones:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: '#7A1117' }}>
                  <li>Los 2 jurados principales son <strong>obligatorios</strong></li>
                  <li>El jurado de desempate es <strong>opcional</strong> (solo se usa si hay desacuerdo)</li>
                  <li>No puedes asignar el mismo jurado más de una vez</li>
                  <li>El director del proyecto NO puede ser jurado</li>
                </ul>
              </div>

              {/* Jurado Principal 1 */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Jurado Principal 1 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.primaryExaminer1Id}
                  onChange={(e) => {
                    setFormData({ ...formData, primaryExaminer1Id: e.target.value });
                    setError("");
                  }}
                  className="form-input"
                  disabled={submitting}
                  required
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
                  <option value="">Seleccionar jurado principal 1...</option>
                  {examiners.map((examiner) => (
                    <option key={examiner.id} value={examiner.id}>
                      {examiner.name} {examiner.lastName} - {examiner.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jurado Principal 2 */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Jurado Principal 2 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.primaryExaminer2Id}
                  onChange={(e) => {
                    setFormData({ ...formData, primaryExaminer2Id: e.target.value });
                    setError("");
                  }}
                  className="form-input"
                  disabled={submitting}
                  required
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
                  <option value="">Seleccionar jurado principal 2...</option>
                  {examiners.map((examiner) => (
                    <option
                      key={examiner.id}
                      value={examiner.id}
                      disabled={examiner.id === parseInt(formData.primaryExaminer1Id)}
                    >
                      {examiner.name} {examiner.lastName} - {examiner.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jurado de Desempate */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: '#7A1117', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Jurado de Desempate <span style={{ color: '#666', fontSize: '0.85rem' }}>(Opcional)</span>
                </label>
                <select
                  value={formData.tiebreakerExaminerId}
                  onChange={(e) => {
                    setFormData({ ...formData, tiebreakerExaminerId: e.target.value });
                    setError("");
                  }}
                  className="form-input"
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
                  <option value="">Seleccionar jurado de desempate (opcional)...</option>
                  {examiners.map((examiner) => (
                    <option
                      key={examiner.id}
                      value={examiner.id}
                      disabled={
                        examiner.id === parseInt(formData.primaryExaminer1Id) ||
                        examiner.id === parseInt(formData.primaryExaminer2Id)
                      }
                    >
                      {examiner.name} {examiner.lastName} - {examiner.email}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Solo se utilizará si los jurados principales no llegan a un consenso
                </small>
              </div>

              {/* Resumen de Selección */}
              {(formData.primaryExaminer1Id || formData.primaryExaminer2Id) && (
                <div
                  style={{
                    background: '#f9f6ee',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #D5CBA0',
                    marginTop: '1.5rem',
                    color: '#7A1117',
                    fontSize: '0.98rem',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '0.75rem', color: '#7A1117' }}>
                    Resumen del Jurado Seleccionado:
                  </strong>
                  <ul style={{ marginLeft: '1.5rem', color: '#7A1117' }}>
                    {formData.primaryExaminer1Id && (
                      <li>
                        <strong>Jurado Principal 1:</strong>{' '}
                        {getExaminerName(formData.primaryExaminer1Id)}
                      </li>
                    )}
                    {formData.primaryExaminer2Id && (
                      <li>
                        <strong>Jurado Principal 2:</strong>{' '}
                        {getExaminerName(formData.primaryExaminer2Id)}
                      </li>
                    )}
                    {formData.tiebreakerExaminerId && (
                      <li>
                        <strong>Jurado de Desempate:</strong>{' '}
                        {getExaminerName(formData.tiebreakerExaminerId)}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cancel"
                  disabled={submitting}
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
                  className="btn-submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #7A1117 0%, #D5CBA0 100%)',
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
                  {submitting ? 'Asignando...' : 'Asignar Jurado'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
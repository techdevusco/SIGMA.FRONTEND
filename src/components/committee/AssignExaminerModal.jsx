import { useState, useEffect } from "react";
import { assignExaminers, getExaminersForCommittee } from "../../services/committeeService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/council/modals.css";

export default function AssignExaminersModal({ studentModalityId, onClose, onSuccess }) {
  const [examiners, setExaminers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [assignedExaminersResult, setAssignedExaminersResult] = useState([]);

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
    if (
      !formData.primaryExaminer1Id ||
      !formData.primaryExaminer2Id ||
      !formData.tiebreakerExaminerId
    ) {
      setError("Debe asignar los dos jurados principales y el jurado de desempate");
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
        tiebreakerExaminerId: parseInt(formData.tiebreakerExaminerId),
      };

      const response = await assignExaminers(studentModalityId, payload);

      console.log("✅ Jurado asignado:", response);

      // Construir objetos de jurados seleccionados para devolver al padre
      const e1 = examiners.find(e => e.id === parseInt(formData.primaryExaminer1Id));
      const e2 = examiners.find(e => e.id === parseInt(formData.primaryExaminer2Id));
      const et = formData.tiebreakerExaminerId
        ? examiners.find(e => e.id === parseInt(formData.tiebreakerExaminerId))
        : null;
      const selected = [
        e1 && { ...e1, role: 'PRIMARY' },
        e2 && { ...e2, role: 'PRIMARY' },
        et && { ...et, role: 'TIEBREAKER' },
      ].filter(Boolean);
      setAssignedExaminersResult(selected);

      // Mostrar mensaje de éxito
      setSuccessMessage("✅ Jurado asignado correctamente a la sustentación");

      // Esperar antes de cerrar
      setTimeout(() => {
        onSuccess(selected);
      }, 1500);
    } catch (err) {
      console.error("Error al asignar jurado:", err);
      setError(getErrorMessage(err, "Error al asignar jurado"));
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
          <button onClick={successMessage ? () => onSuccess(assignedExaminersResult) : onClose} className="modal-close" disabled={submitting} style={{ color: '#7A1117', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 0, background: 'transparent' }}>
          {successMessage ? (
            <div className="modal-success-animation" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="success-message" style={{ color: '#7A1117', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{successMessage.replace('✅ ', '')}</div>
              <div className="success-submessage" style={{ color: '#D5CBA0', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Cerrando automáticamente...
              </div>
              <button
                onClick={() => onSuccess(assignedExaminersResult)}
                style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #7A1117 0%, #a32c2c 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message" style={{ color: '#dc2626', background: '#fff7f7', border: '1px solid #dc2626', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

              <div className="info-box" style={{ background: '#f9f6ee', border: '1px solid #D5CBA0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', color: '#7A1117', fontSize: '0.95rem' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Instrucciones:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: '#7A1117' }}>
                  <li>Los 2 jurados principales y el jurado de desempate son <strong>obligatorios</strong></li>
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
                  Jurado de Desempate <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.tiebreakerExaminerId}
                  onChange={(e) => {
                    setFormData({ ...formData, tiebreakerExaminerId: e.target.value });
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
                  <option value="">Seleccionar jurado de desempate...</option>
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
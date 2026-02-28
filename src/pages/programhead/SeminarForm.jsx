import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createSeminar,
  updateSeminar,
  getSeminarDetail,
} from "../../services/programsheadService";
import "../../styles/programhead/seminarform.css";

export default function SeminarForm() {
  const { seminarId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(seminarId);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalCost: "",
    minParticipants: 15,
    maxParticipants: 35,
    totalHours: 160,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isEditMode) {
      fetchSeminarData();
    }
  }, [seminarId]);

  const fetchSeminarData = async () => {
    try {
      setLoading(true);
      setErrors({});
      const response = await getSeminarDetail(seminarId);

      if (response.success) {
        const seminar = response.seminar;
        setFormData({
          name: seminar.name || "",
          description: seminar.description || "",
          totalCost: seminar.totalCost || "",
          minParticipants: seminar.minParticipants || 15,
          maxParticipants: seminar.maxParticipants || 35,
          totalHours: seminar.totalHours || 160,
        });
      } else {
        setErrors({ general: response.error || "Error al cargar el diplomado" });
      }
    } catch (err) {
      console.error("❌ Error al cargar seminario:", err);
      const errorMsg = err.response?.data?.error || "Error al cargar el diplomado";
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es el campo de costo, formatear solo números
    if (name === 'totalCost') {
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Función para formatear números con separadores de miles
  const formatNumberWithSeparators = (num) => {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del diplomado es obligatorio";
    }

    const minPart = parseInt(formData.minParticipants) || 0;
    const maxPart = parseInt(formData.maxParticipants) || 0;
    const totalCostVal = parseFloat(formData.totalCost) || 0;
    const totalHoursVal = parseInt(formData.totalHours) || 0;

    if (minPart < 15) {
      newErrors.minParticipants = "Mínimo 15 participantes requeridos";
    }

    if (maxPart > 35) {
      newErrors.maxParticipants = "Máximo 35 participantes permitidos";
    }

    if (minPart > maxPart) {
      newErrors.minParticipants = "No puede ser mayor que el máximo";
    }

    if (totalHoursVal < 160) {
      newErrors.totalHours = "Mínimo 160 horas requeridas";
    }

    if (totalCostVal <= 0) {
      newErrors.totalCost = "El costo debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        totalCost: Number(formData.totalCost),
        minParticipants: Number(formData.minParticipants),
        maxParticipants: Number(formData.maxParticipants),
        totalHours: Number(formData.totalHours),
      };

      let response;
      if (isEditMode) {
        response = await updateSeminar(seminarId, payload);
      } else {
        response = await createSeminar(payload);
      }

      if (response.success) {
        setSuccessMessage(response.message || "Diplomado guardado exitosamente");
        
        setTimeout(() => {
          if (isEditMode) {
            navigate(`/jefeprograma/seminars/${seminarId}`);
          } else {
            navigate("/jefeprograma/seminars");
          }
        }, 1500);
      } else {
        setErrors({ general: response.error || "Error al guardar el diplomado" });
      }
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      const errorMsg = err.response?.data?.error || "Error al guardar el diplomado";
      setErrors({ general: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="seminar-form-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando diplomado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seminar-form-container">
      {/* Header */}
      <div className="form-header">
        <button 
          className="btn-back" 
          onClick={() => navigate(-1)}
          type="button"
        >
          ← Volver
        </button>
        <h1 className="form-title">
          {isEditMode ? "✏️ Editar Diplomado" : "Crear Nuevo Diplomado"}
        </h1>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}
      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="seminar-form" noValidate>
        {/* Nombre */}
        <div className="form-group">
          <label htmlFor="name">
            <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px' }}>
              Nombre del Diplomado <span className="required">*</span>
            </span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Diplomado de Inteligencia Artificial"
            className={errors.name ? "form-control is-invalid" : "form-control"}
            disabled={submitting}
            required
            style={{ borderColor: errors.name ? '#e74c3c' : '#7A1117', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
          />
          {errors.name && <small className="error-text">{errors.name}</small>}
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description">
            <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px' }}>Descripción</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el objetivo y contenido del diplomado..."
            className="form-control"
            rows={4}
            disabled={submitting}
            style={{ borderColor: '#7A1117', fontWeight: 600, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
          />
          <small className="form-hint">Campo opcional pero recomendado</small>
        </div>

        {/* Grid de campos numéricos */}
        <div className="form-grid">
          {/* Costo Total */}
          <div className="form-group">
            <label htmlFor="totalCost">
              <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px' }}>Costo Total (COP) <span className="required">*</span></span>
            </label>
            <input
              type="text"
              id="totalCost"
              name="totalCost"
              value={formatNumberWithSeparators(formData.totalCost)}
              onChange={handleChange}
              placeholder="1.000.000"
              inputMode="numeric"
              className={errors.totalCost ? "form-control is-invalid" : "form-control"}
              disabled={submitting}
              required
              style={{ borderColor: errors.totalCost ? '#e74c3c' : '#7A1117', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
            />
            {errors.totalCost && <small className="error-text">{errors.totalCost}</small>}
          </div>

          {/* Total de Horas */}
          <div className="form-group">
            <label htmlFor="totalHours">
              <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px' }}>Total de Horas <span className="required">*</span></span>
            </label>
            <input
              type="number"
              id="totalHours"
              name="totalHours"
              value={formData.totalHours}
              onChange={handleChange}
              placeholder="160"
              min="160"
              className={errors.totalHours ? "form-control is-invalid" : "form-control"}
              disabled={submitting}
              required
              style={{ borderColor: errors.totalHours ? '#e74c3c' : '#7A1117', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
            />
            {errors.totalHours && <small className="error-text">{errors.totalHours}</small>}
            <small className="form-hint">Mínimo 160 horas requeridas</small>
          </div>

          {/* Mínimo de Participantes */}
          <div className="form-group">
            <label htmlFor="minParticipants">
              <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px'  }}>Mínimo de Participantes <span className="required">*</span></span>
            </label>
            <input
              type="number"
              id="minParticipants"
              name="minParticipants"
              value={formData.minParticipants}
              onChange={handleChange}
              placeholder="15"
              min="15"
              max="35"
              className={errors.minParticipants ? "form-control is-invalid" : "form-control"}
              disabled={submitting}
              required
              style={{ borderColor: errors.minParticipants ? '#e74c3c' : '#7A1117', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
            />
            {errors.minParticipants && <small className="error-text">{errors.minParticipants}</small>}
            <small className="form-hint">Mínimo 15 participantes requeridos</small>
          </div>

          {/* Máximo de Participantes */}
          <div className="form-group">
            <label htmlFor="maxParticipants">
              <span style={{ color: '#7A1117', fontWeight: 900, letterSpacing: '0.6px' }}>Máximo de Participantes <span className="required">*</span></span>
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="35"
              min="15"
              max="35"
              className={errors.maxParticipants ? "form-control is-invalid" : "form-control"}
              disabled={submitting}
              required
              style={{ borderColor: errors.maxParticipants ? '#e74c3c' : '#7A1117', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', background: '#fff' }}
            />
            {errors.maxParticipants && <small className="error-text">{errors.maxParticipants}</small>}
            <small className="form-hint">Máximo 35 participantes</small>
          </div>
        </div>

        {/* Información de Ayuda */}
        <div className="form-info-box">
          <h4 style={{ color: '#7A1117', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px' }}> Requisitos del Diplomado</h4>
          <ul>
            <li> Mínimo 15 participantes para iniciar </li>
            <li> Máximo 35 participantes </li>
            <li> Mínimo 160 horas de intensidad</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}
            style={{ fontWeight: 900, fontSize: '1.05rem', borderRadius: '12px', letterSpacing: '0.5px' }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ fontWeight: 900, fontSize: '1.08rem', borderRadius: '12px', letterSpacing: '0.5px', background: 'linear-gradient(135deg, #7A1117 0%, #5d0d12 100%)', color: '#fff', boxShadow: '0 8px 20px rgba(122, 17, 23, 0.18)' }}
          >
            {submitting
              ? "Guardando..."
              : isEditMode
              ? "Actualizar Diplomado"
              : "Crear Diplomado"}
          </button>
        </div>
      </form>
    </div>
  );
}
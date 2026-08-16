import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAllFaculties,
  getAllAcademicPrograms,
  createAcademicProgram,
  updateAcademicProgram,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/admin/Roles.css";

export default function Programs() {
  const [searchParams] = useSearchParams();
  const facultyIdFromUrl = searchParams.get("facultyId");

  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState(facultyIdFromUrl || "");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    facultyId: "",
    totalCredits: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (facultyIdFromUrl) {
      setSelectedFacultyId(facultyIdFromUrl);
    }
  }, [facultyIdFromUrl]);

  const fetchInitialData = async () => {
    try {
      const [programsData, facultiesData] = await Promise.all([
        getAllAcademicPrograms(),
        getAllFaculties()
      ]);
      setPrograms(programsData);
      setFaculties(facultiesData);
    } catch (err) {
      setMessage("Error al cargar datos: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setFormData({
      name: "",
      description: "",
      code: "",
      facultyId: selectedFacultyId || "",
      totalCredits: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      code: program.code,
      facultyId: program.facultyId,
      totalCredits: program.totalCredits || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        facultyId: formData.facultyId ? parseInt(formData.facultyId) : null,
        totalCredits: formData.totalCredits ? parseInt(formData.totalCredits) : null,
      };

      console.log("📦 Payload enviado al backend:", JSON.stringify(payload, null, 2));

      if (editingProgram) {
        await updateAcademicProgram(editingProgram.id, payload);
        setMessage("Programa académico actualizado exitosamente");
      } else {
        await createAcademicProgram(payload);
        setMessage("Programa académico creado exitosamente");
      }
      setShowModal(false);
      fetchInitialData();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(getErrorMessage(err, "Error al procesar la solicitud"));
    }
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : "Sin facultad";
  };

  const filteredPrograms = selectedFacultyId
    ? programs.filter(p => p.facultyId === parseInt(selectedFacultyId))
    : programs;

  if (loading) {
    return <div className="admin-loading">Cargando programas académicos...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Programas Académicos</h1>
          <p className="admin-page-subtitle">Administra los programas académicos por facultad</p>
        </div>
        <button onClick={handleOpenCreate} className="admin-btn-primary">
          ➕ Crear Programa
        </button>
      </div>

      {message && (
        <div className={`admin-message ${String(message).includes("Error") || String(message).includes("error") ? "error" : "success"}`}>
          {typeof message === "string" ? message : JSON.stringify(message)}
          <button onClick={() => setMessage("")} style={{ marginLeft: "1rem" }}>✕</button>
        </div>
      )}

      {/* Filtro por facultad */}
      <div className="admin-form-group" style={{ marginBottom: "2rem" }}>
        <label className="admin-label">Filtrar por Facultad</label>
        <select
          value={selectedFacultyId}
          onChange={(e) => setSelectedFacultyId(e.target.value)}
          className="admin-select"
          style={{ maxWidth: "400px" }}
        >
          <option value="">-- Todas las facultades --</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-cards-grid">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">{program.name}</h3>
              <span className={`admin-status-badge ${program.active ? "active" : "inactive"}`}>
                {program.active ? "ACTIVO" : "INACTIVO"}
              </span>
            </div>
            
            <div className="admin-card-body">
              {/* Descripción */}
              <div className="admin-card-info">
                <p>{program.description}</p>
              </div>

              {/* Metadata */}
              <div className="admin-card-meta">
                <div className="admin-card-meta-item">
                  <strong>Facultad:</strong>
                  <span className="admin-tag">{getFacultyName(program.facultyId)}</span>
                </div>
                <div className="admin-card-meta-item">
                  <strong>Código:</strong>
                  <span className="admin-tag">{program.code}</span>
                </div>
                <div className="admin-card-meta-item">
                  <strong>Total Créditos:</strong>
                  <span className="admin-tag">{program.totalCredits ?? "N/A"}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="admin-card-actions">
                <button onClick={() => handleOpenEdit(program)} className="admin-btn-edit">
                  ✏️ Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
          {selectedFacultyId 
            ? "No hay programas académicos para esta facultad" 
            : "No hay programas académicos registrados"}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingProgram ? "Editar Programa Académico" : "Crear Nuevo Programa Académico"}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">Facultad *</label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="admin-select"
                  required
                >
                  <option value="">-- Selecciona una facultad --</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Nombre del Programa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  placeholder="Ej: Ingeniería de Software"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-textarea"
                  placeholder="Describe el programa académico..."
                  rows="5"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="admin-input"
                  placeholder="Ej: ING_SOFTWARE"
                  required
                />
                <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                  Usa el formato: TIPO_NOMBRE (se convertirá a mayúsculas)
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Total de Créditos *</label>
                <input
                  type="number"
                  value={formData.totalCredits}
                  onChange={(e) => setFormData({ ...formData, totalCredits: e.target.value ? parseInt(e.target.value) : "" })}
                  className="admin-input"
                  placeholder="Ej: 160"
                  min="1"
                  required
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingProgram ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
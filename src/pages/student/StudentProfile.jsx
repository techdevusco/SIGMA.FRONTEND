import { useEffect, useState } from "react";
import {
  getStudentProfile,
  saveStudentProfile,
  getActiveFacultiesStudent,
  getActiveProgramsStudent,
} from "../../services/studentService";
import "../../styles/student/studentProfile.css";

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    facultyId: "",
    academicProgramId: "",
    approvedCredits: "",
    gpa: "",
    semester: "",
    // ❌ ELIMINADO: studentCode - ahora lo extrae el backend del email
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    lastname: "",
    email: "",
    studentCode: "", // ✅ Solo para mostrar, no para editar
  });

  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Obtener créditos máximos del programa seleccionado
  const getMaxCredits = () => {
    if (!profile.academicProgramId) return 180;
    
    const selectedProgram = allPrograms.find(
      p => p.id === parseInt(profile.academicProgramId)
    );
    
    return selectedProgram?.totalCredits || 180;
  };

  const maxCredits = getMaxCredits();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [facultiesData, programsData, profileData] = await Promise.all([
          getActiveFacultiesStudent().catch(err => {
            console.error("Error al cargar facultades:", err);
            return [];
          }),
          getActiveProgramsStudent().catch(err => {
            console.error("Error al cargar programas:", err);
            return [];
          }),
          getStudentProfile().catch(err => {
            console.error("Error al cargar perfil:", err);
            throw err;
          })
        ]);

        console.log("📚 Facultades cargadas:", facultiesData);
        console.log("📖 Programas cargados:", programsData);
        console.log("👤 Perfil cargado:", profileData);

        setFaculties(Array.isArray(facultiesData) ? facultiesData : []);
        setAllPrograms(Array.isArray(programsData) ? programsData : []);

        // ✅ Incluir studentCode en userInfo para mostrar
        setUserInfo({
          name: profileData.name || "",
          lastname: profileData.lastname || "",
          email: profileData.email || "",
          studentCode: profileData.studentCode || "", // Backend lo genera automáticamente
        });

        let facultyId = "";
        let academicProgramId = "";

        // Mapear nombres a IDs
        if (profileData.faculty && Array.isArray(facultiesData)) {
          const faculty = facultiesData.find(f => f.name === profileData.faculty);
          if (faculty) {
            facultyId = faculty.id;
            console.log("✅ Facultad encontrada:", faculty.name, "ID:", faculty.id);
          }
        }

        if (profileData.academicProgram && Array.isArray(programsData)) {
          const program = programsData.find(p => p.name === profileData.academicProgram);
          if (program) {
            academicProgramId = program.id;
            console.log("✅ Programa encontrado:", program.name, "ID:", program.id);
          }
        }

        setProfile({
          facultyId: facultyId || "",
          academicProgramId: academicProgramId || "",
          approvedCredits: profileData.approvedCredits ?? "",
          gpa: profileData.gpa ?? "",
          semester: profileData.semester ?? "",
          // ❌ NO incluimos studentCode aquí - solo en userInfo
        });

        // Si los campos inmutables están llenos, marcar como guardado
        // ✅ ACTUALIZADO: Ya no verificamos studentCode porque lo genera el backend
        // Nota: El semestre ya NO es inmutable, puede editarse siempre
        if (facultyId && academicProgramId) {
          setProfileSaved(true);
        }

        // Filtrar programas si ya tiene facultad
        if (facultyId && Array.isArray(programsData)) {
          const filtered = programsData.filter(p => p.facultyId === facultyId);
          setPrograms(filtered);
          console.log("📋 Programas filtrados:", filtered);
        }
      } catch (err) {
        console.error("❌ Error completo:", err);
        const errorMsg = err.response?.data?.message
          || err.response?.data
          || err.message
          || "No se pudo cargar el perfil";
        setMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Filtrar programas cuando cambia la facultad
  useEffect(() => {
    if (profile.facultyId) {
      const filtered = allPrograms.filter(
        p => p.facultyId === parseInt(profile.facultyId)
      );
      setPrograms(filtered);
      
      const programBelongsToFaculty = filtered.some(
        p => p.id === parseInt(profile.academicProgramId)
      );
      
      if (!programBelongsToFaculty && profile.academicProgramId) {
        setProfile(prev => ({ ...prev, academicProgramId: "" }));
      }
    } else {
      setPrograms([]);
      setProfile(prev => ({ ...prev, academicProgramId: "" }));
    }
  }, [profile.facultyId, allPrograms, profile.academicProgramId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!profile.facultyId) {
      setMessage("Por favor selecciona una facultad");
      return;
    }
    if (!profile.academicProgramId) {
      setMessage("Por favor selecciona un programa académico");
      return;
    }

    // Validar créditos aprobados
    const approvedCredits = parseInt(profile.approvedCredits);
    if (approvedCredits > maxCredits) {
      setMessage(`Los créditos aprobados no pueden superar el total del programa (${maxCredits})`);
      return;
    }

    // Mostrar modal de confirmación solo si es la primera vez
    if (!profileSaved) {
      setShowConfirmModal(true);
    } else {
      // Si ya está guardado, guardar directamente
      handleConfirmSave();
    }
  };

  const handleConfirmSave = async () => {
    setMessage("");
    setSaving(true);
    setShowConfirmModal(false);

    try {
      const approvedCredits = parseInt(profile.approvedCredits);
      const gpa = parseFloat(profile.gpa);
      const semester = parseInt(profile.semester);
      const facultyId = parseInt(profile.facultyId);
      const academicProgramId = parseInt(profile.academicProgramId);

      if (isNaN(approvedCredits) || isNaN(gpa) || isNaN(semester) || isNaN(facultyId) || isNaN(academicProgramId)) {
        setMessage("Error: Algunos campos tienen valores inválidos");
        setSaving(false);
        return;
      }

      // ✅ ACTUALIZADO: Ya NO enviamos studentCode
      const profileData = {
        facultyId,
        academicProgramId,
        approvedCredits,
        gpa,
        semester,
        // ❌ ELIMINADO: studentCode - el backend lo genera del email
      };

      console.log("📤 Enviando perfil (sin studentCode):", profileData);

      const response = await saveStudentProfile(profileData);
      
      console.log("✅ Respuesta del servidor:", response);
      
      setMessage(response.message || response.data || "Perfil actualizado correctamente");
      
      // Marcar como guardado (bloquear campos inmutables)
      setProfileSaved(true);

      // ✅ Actualizar studentCode en userInfo con la respuesta del backend
      if (response.studentCode) {
        setUserInfo(prev => ({
          ...prev,
          studentCode: response.studentCode
        }));
      }
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      console.error("❌ Respuesta del error:", err.response);
      
      const errorMsg = err.response?.data?.message
        || err.response?.data
        || err.message
        || "No se pudo guardar el perfil";
      setMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="profile-loading">Cargando perfil...</p>;
  }

  // Campos que NO se pueden modificar después del primer guardado
  const isFieldLocked = profileSaved;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Perfil del Estudiante</h1>
            <p>Consulta y actualiza tu información académica de manera rápida y segura.</p>
        </div>

        <div className="profile-body">
          {/* INFO USUARIO */}
          <div className="profile-info">
            <p>
              <strong>Nombre Completo:</strong> {userInfo.name} {userInfo.lastname}
            </p>
            <p>
              <strong>Correo Institucional:</strong> {userInfo.email}
            </p>
            {/* ✅ NUEVO: Mostrar código estudiantil (generado por backend) */}
            {userInfo.studentCode && userInfo.studentCode !== "Será tomado de tu correo" && (
              <p>
                <strong>Código Estudiantil:</strong> {userInfo.studentCode}
                <span style={{ 
                  marginLeft: "0.5rem", 
                  fontSize: "0.85rem", 
                  color: "#10b981",
                  fontWeight: "600"
                }}>
                  
                </span>
              </p>
            )}
          </div>

          {/* Advertencia si el perfil ya fue guardado */}
          {isFieldLocked && (
            <div className="profile-lock-warning">
              <div className="profile-lock-warning-content">
                <strong>Información bloqueada</strong>
                <p>
                  Los campos de Facultad y Programa Académico
                  no pueden modificarse una vez guardados.</p>
              </div>
            </div>
          )}

          {message && (
            <div className={`profile-message ${message.includes("Error") || message.includes("favor") || message.includes("pudo") || message.includes("inválidos") || message.includes("superar") ? "error" : "success"}`}>
              {message}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* FACULTAD */}
            <div className="profile-group">
              <label>
                Facultad 
                {isFieldLocked && <span className="locked-badge">🔒 Bloqueado</span>}
              </label>
              <select
                name="facultyId"
                value={profile.facultyId}
                onChange={handleChange}
                required
                disabled={saving || isFieldLocked}
                className={isFieldLocked ? "locked-field" : ""}
              >
                <option value="">-- Selecciona una facultad --</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PROGRAMA ACADÉMICO */}
            <div className="profile-group">
              <label>
                Programa Académico 
                {isFieldLocked && <span className="locked-badge">🔒 Bloqueado</span>}
              </label>
              <select
                name="academicProgramId"
                value={profile.academicProgramId}
                onChange={handleChange}
                required
                disabled={!profile.facultyId || saving || isFieldLocked}
                className={isFieldLocked ? "locked-field" : ""}
              >
                <option value="">
                  {profile.facultyId
                    ? "-- Selecciona un programa --"
                    : "-- Primero selecciona una facultad --"}
                </option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ❌ ELIMINADO: Campo de Código Estudiantil */}
            {/* El backend lo genera automáticamente del email */}

            {/* SEMESTRE - SIEMPRE EDITABLE */}
            <div className="profile-group">
              <label>
                Semestre En El Que Se Encuentra Actualmente
                {isFieldLocked && <span className="editable-badge">Editable</span>}
              </label>
              <select
                name="semester"
                value={profile.semester}
                onChange={handleChange}
                required
                disabled={saving}
              >
                <option value="">-- Selecciona el semestre --</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <small style={{ color: "#666", fontSize: "0.85rem" }}>
                Debe estar entre 1 y 10
              </small>
            </div>

            {/* CRÉDITOS APROBADOS - SIEMPRE EDITABLE */}
            <div className="profile-group">
              <label>
                Créditos Aprobados 
                {isFieldLocked && <span className="editable-badge">Editable</span>}
              </label>
              <input
                type="number"
                name="approvedCredits"
                value={profile.approvedCredits}
                onChange={handleChange}
                min="0"
                max={maxCredits}
                required
                disabled={saving}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>
                {profile.academicProgramId
                  ? `Máximo ${maxCredits} créditos (total del programa)`
                  : "Selecciona un programa para ver el máximo de créditos"}
              </small>
            </div>

            {/* GPA - SIEMPRE EDITABLE */}
            <div className="profile-group">
              <label>
                Promedio Calificado Ponderado del Pregrado 
                {isFieldLocked && <span className="editable-badge">Editable</span>}
              </label>
              <input
                type="number"
                step="0.01"
                name="gpa"
                value={profile.gpa}
                onChange={handleChange}
                min="0"
                max="5"
                required
                disabled={saving}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>
                Debe estar entre 0.0 y 5.0
              </small>
            </div>

            <button
              className="profile-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Guardando..." : profileSaved ? "Actualizar información" : "Guardar perfil"}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {showConfirmModal && (
        <div className="profile-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Confirmar información del perfil</h3>
            </div>
            <div className="profile-modal-body">
              <p className="profile-modal-warning">
                <strong>IMPORTANTE:</strong> Una vez guardada, la siguiente información
                <strong> NO PODRÁ ser modificada</strong>
              </p>
              <div className="profile-modal-summary">
                <div className="profile-modal-item">
                  <span className="profile-modal-label">Facultad:</span>
                  <span className="profile-modal-value">
                    {faculties.find(f => f.id === parseInt(profile.facultyId))?.name || "No seleccionado"}
                  </span>
                </div>
                <div className="profile-modal-item">
                  <span className="profile-modal-label">Programa Académico:</span>
                  <span className="profile-modal-value">
                    {programs.find(p => p.id === parseInt(profile.academicProgramId))?.name || "No seleccionado"}
                  </span>
                </div>
                {/* ✅ ACTUALIZADO: Código se muestra pero no se edita */}
                <div className="profile-modal-item">
                  <span className="profile-modal-label">Código Estudiantil:</span>
                  <span className="profile-modal-value">
                    {userInfo.studentCode} 
                    <span style={{ fontSize: "0.85rem", color: "#10b981", marginLeft: "0.5rem" }}>
                      (generado automáticamente)
                    </span>
                  </span>
                </div>
                <div className="profile-modal-item editable">
                  <span className="profile-modal-label">Semestre:</span>
                  <span className="profile-modal-value">{profile.semester}</span>
                </div>
                <div className="profile-modal-item editable">
                  <span className="profile-modal-label">Créditos Aprobados:</span>
                  <span className="profile-modal-value">{profile.approvedCredits} / {maxCredits}</span>
                </div>
                <div className="profile-modal-item editable">
                  <span className="profile-modal-label">Promedio (GPA):</span>
                  <span className="profile-modal-value">{profile.gpa}</span>
                </div>
              </div>
              <p className="profile-modal-note">
                Podrás actualizar el <strong>Semestre</strong><strong>Créditos Aprobados</strong><strong>Promedio</strong>
                en cualquier momento.
              </p>
              <p className="profile-modal-question">
                ¿Estás seguro de que toda la información es correcta?
              </p>
            </div>
            <div className="profile-modal-actions">
              <button
                className="profile-button secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Revisar de nuevo
              </button>
              <button
                className="profile-button primary"
                onClick={handleConfirmSave}
              >
                Sí, confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
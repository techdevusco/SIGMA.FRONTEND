import { useEffect, useState } from "react";
import {
  getStudentProfile,
  updateStudentProfileFromAcademicHistory,
} from "../../services/studentService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/student/studentProfile.css";

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    facultyId: "",
    academicProgramId: "",
    approvedCredits: "",
    gpa: "",
    semester: "",
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    lastname: "",
    email: "",
    studentCode: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const inferredStudentCodeFromEmail =
    userInfo.email?.match(/\d{7,12}/)?.[0] || "";
  const canInferSemesterFromEmail = Boolean(inferredStudentCodeFromEmail);

  const loadProfile = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const profileData = await getStudentProfile();

      setUserInfo({
        name: profileData.name || "",
        lastname: profileData.lastname || "",
        email: profileData.email || "",
        studentCode: profileData.studentCode || "",
      });

      setProfile({
        facultyId: profileData.faculty || "",
        academicProgramId: profileData.academicProgram || "",
        approvedCredits: profileData.approvedCredits ?? "",
        gpa: profileData.gpa ?? "",
        semester: profileData.semester ?? "",
      });
    } catch (err) {
      const errorMsg = getErrorMessage(err, "No se pudo cargar el perfil");
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setMessage("");
    setExtractionResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdfMime = file.type === "application/pdf";
    const isPdfName = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfName) {
      setSelectedFile(null);
      setMessage("Debes adjuntar un archivo PDF del historial academico.");
      setMessageType("error");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!canInferSemesterFromEmail) {
      setMessage(
        "No se puede procesar el PDF porque tu correo institucional no permite inferir el codigo estudiantil. Contacta soporte para actualizar tu correo en SIGMA."
      );
      setMessageType("error");
      return;
    }

    if (!selectedFile) {
      setMessage("Debes seleccionar el PDF del historial academico antes de continuar.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const response = await updateStudentProfileFromAcademicHistory(selectedFile);
      setExtractionResult(response);
      setMessage(
        response.message || "Perfil academico actualizado automaticamente desde el PDF."
      );
      setMessageType("success");
      setSelectedFile(null);

      await loadProfile({ silent: true });
    } catch (err) {
      const rawErrorMsg = getErrorMessage(err, "No fue posible procesar el PDF del historial academico.");

      const errorMsg = String(rawErrorMsg).includes(
        "No fue posible calcular el semestre actual a partir del codigo estudiantil"
      )
        ? "No fue posible calcular el semestre desde tu codigo estudiantil. Verifica que tu correo institucional tenga el codigo correcto y contacta soporte academico si el problema persiste."
        : rawErrorMsg;

      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="profile-loading">Cargando perfil...</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Perfil del Estudiante</h1>
          <p>Actualiza tu perfil academico automaticamente a partir de tu historial en PDF.</p>
        </div>

        <div className="profile-body">
          <div className="profile-info">
            <p>
              <strong>Nombre Completo:</strong> {userInfo.name} {userInfo.lastname}
            </p>
            <p>
              <strong>Correo Institucional:</strong> {userInfo.email}
            </p>
            {userInfo.studentCode && (
              <p>
                <strong>Código Estudiantil:</strong> {userInfo.studentCode}
              </p>
            )}
          </div>

          <div className="profile-instructions">
            <h3>Como obtener el PDF oficial</h3>
            <ol className="profile-steps">
              <li>
                Ingresa a la plataforma oficial en
                {" "}
                <a
                  href="https://gaitana.usco.edu.co/estadisticas/#/login"
                  target="_blank"
                  rel="noreferrer"
                >
                  gaitana.usco.edu.co/estadisticas/#/login
                </a>
                .
              </li>
              <li>Inicia sesion con tus credenciales institucionales.</li>
              <li>En el menu, abre 13 - Historial academico.</li>
              <li>Selecciona 67 - Historial academico personal.</li>
              <li>
                Haz clic derecho, elige Imprimir y descarga el archivo en formato PDF.
              </li>
              <li>
                Adjunta ese PDF aqui para que SIGMA extraiga programa, facultad, creditos, promedio y semestre.
              </li>
            </ol>

            {!canInferSemesterFromEmail && (
              <p className="profile-email-warning">
                Advertencia: no se detecta codigo estudiantil en tu correo institucional ({userInfo.email || "sin correo"}).
                
              </p>
            )}
          </div>

          {message && (
            <div className={`profile-message ${messageType === "error" ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpload} className="profile-upload-panel">
            <div className="profile-group">
              <label htmlFor="academic-history-pdf">Historial academico (PDF)</label>
              <input
                id="academic-history-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <small>Solo se permite PDF original descargado desde Gaitana.</small>
            </div>

            {selectedFile && (
              <div className="profile-selected-file">
                Archivo seleccionado: <strong>{selectedFile.name}</strong>
              </div>
            )}

            <button
              className="profile-button"
              type="submit"
              disabled={uploading || !selectedFile || !canInferSemesterFromEmail}
            >
              {uploading ? "Procesando PDF..." : "Extraer y actualizar perfil"}
            </button>
          </form>

          <div className="profile-current-data">
            <h3>Datos academicos actuales</h3>
            <div className="profile-data-grid">
              <div className="profile-data-item">
                <span className="profile-data-label">Facultad</span>
                <span className="profile-data-value">{profile.facultyId || "Sin registro"}</span>
              </div>
              <div className="profile-data-item">
                <span className="profile-data-label">Programa academico</span>
                <span className="profile-data-value">{profile.academicProgramId || "Sin registro"}</span>
              </div>
              <div className="profile-data-item">
                <span className="profile-data-label">Creditos aprobados</span>
                <span className="profile-data-value">{profile.approvedCredits || "Sin registro"}</span>
              </div>
              <div className="profile-data-item">
                <span className="profile-data-label">Promedio (GPA)</span>
                <span className="profile-data-value">{profile.gpa || "Sin registro"}</span>
              </div>
              <div className="profile-data-item">
                <span className="profile-data-label">Semestre</span>
                <span className="profile-data-value">{profile.semester || "Sin registro"}</span>
              </div>
            </div>
          </div>

          {extractionResult && (
            <div className="profile-current-data extraction-result">
              <h3>Resultado de la extraccion</h3>
              <div className="profile-data-grid">
                <div className="profile-data-item">
                  <span className="profile-data-label">Programa extraido</span>
                  <span className="profile-data-value">
                    {extractionResult.programNameExtracted || "No disponible"}
                  </span>
                </div>
                <div className="profile-data-item">
                  <span className="profile-data-label">Programa asociado en SIGMA</span>
                  <span className="profile-data-value">
                    {extractionResult.academicProgramMatched || "No disponible"}
                  </span>
                </div>
                <div className="profile-data-item">
                  <span className="profile-data-label">Facultad</span>
                  <span className="profile-data-value">
                    {extractionResult.faculty || "No disponible"}
                  </span>
                </div>
                <div className="profile-data-item">
                  <span className="profile-data-label">Creditos aprobados</span>
                  <span className="profile-data-value">
                    {extractionResult.approvedCredits ?? "No disponible"}
                  </span>
                </div>
                <div className="profile-data-item">
                  <span className="profile-data-label">Promedio (GPA)</span>
                  <span className="profile-data-value">
                    {extractionResult.gpa ?? "No disponible"}
                  </span>
                </div>
                <div className="profile-data-item">
                  <span className="profile-data-label">Semestre inferido</span>
                  <span className="profile-data-value">
                    {extractionResult.semester ?? "No disponible"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
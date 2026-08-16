import { useState, useEffect } from "react";
import {
  uploadCancellationDocument,
  requestCancellationModality,
  getCurrentModalityStatus,
} from "../../services/studentService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/student/cancellation.css";

export default function StudentCancellation() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [studentModalityId, setStudentModalityId] = useState(null);
  const [loadingModalityId, setLoadingModalityId] = useState(true);

  useEffect(() => {
    const fetchModalityId = async () => {
      setLoadingModalityId(true);
      try {
        const status = await getCurrentModalityStatus();
        console.log("📦 Modalidad actual:", status);
        
        // Intentar obtener el ID de diferentes formas
        const modalityId = status.studentModalityId || status.id || status.modalityId;
        
        if (modalityId) {
          setStudentModalityId(modalityId);
          console.log("✅ studentModalityId encontrado:", modalityId);
        } else {
          setMessage("No se encontró una modalidad activa");
          setMessageType("error");
        }
      } catch (err) {
        console.error(" Error al obtener modalidad:", err);
        setMessage(getErrorMessage(err, "Error al obtener información de la modalidad"));
        setMessageType("error");
      } finally {
        setLoadingModalityId(false);
      }
    };

    fetchModalityId();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar tipo de archivo
      if (selectedFile.type !== "application/pdf") {
        setMessage("Solo se permiten archivos PDF");
        setMessageType("error");
        return;
      }

      // Validar tamaño (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage("El archivo no puede superar los 5MB");
        setMessageType("error");
        return;
      }

      setFile(selectedFile);
      setMessage("");
      setMessageType("");
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Selecciona un archivo primero");
      setMessageType("error");
      return;
    }

    if (!studentModalityId) {
      setMessage("No se pudo obtener la información de tu modalidad");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Subiendo documento de cancelación para modalidad:", studentModalityId);
      const response = await uploadCancellationDocument(studentModalityId, formData);
      
      console.log("✅ Respuesta:", response);
      setMessage(response.message || "Documento subido exitosamente. Ahora puedes confirmar la solicitud de cancelación.");
      setMessageType("success");
      setStep(2);
    } catch (err) {
      console.error(" Error al subir documento:", err);
      const errorMsg = getErrorMessage(err, "Error al subir el documento");
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCancellation = async () => {
    if (!studentModalityId) {
      setMessage("No se pudo obtener la información de tu modalidad");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log("📩 Solicitando cancelación para modalidad:", studentModalityId);
      const response = await requestCancellationModality(studentModalityId);
      
      console.log("✅ Respuesta:", response);
      setMessage(response.message || "Solicitud de cancelación enviada exitosamente. El director de proyecto la revisará pronto.");
      setMessageType("success");
      setStep(3);
    } catch (err) {
      console.error(" Error al solicitar cancelación:", err);
      const errorMsg = getErrorMessage(err, "Error al solicitar cancelación");
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingModalityId) {
    return (
      <div className="cancellation-container">
        <div className="cancellation-header">
          <h1>Cancelar Modalidad de Grado</h1>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cancellation-requests-container">
  <div className="cancellation-requests-header">
    <h1>Cancelar Modalidad de Grado</h1>
    <p>
      Sigue estos pasos para solicitar la cancelación de tu modalidad. Recuerda que este proceso puede estar sujeto a validación académica y a los plazos definidos en el reglamento institucional.
    </p>
  </div>

  {message && (
    <div className={`cancellation-message ${messageType}`}>
      {message}
      <button
        onClick={() => setMessage("")}
        style={{
          marginLeft: "auto",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          color: "inherit",
        }}
      >
        ✕
      </button>
    </div>
  )}

  {/* Pasos del proceso */}
  <div className="cancellation-steps">
    <div className={`step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
      <div className="step-number">1</div>
      <div className="step-content">
        <h3>Subir Documento de Justificación</h3>
        <p>
          Adjunta un documento en formato PDF en el que expongas de manera clara y formal las razones que sustentan la solicitud de cancelación.
        </p>
      </div>
    </div>

    <div className={`step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
      <div className="step-number">2</div>
      <div className="step-content">
        <h3>Confirmar Solicitud</h3>
        <p>
          Envía formalmente tu solicitud de cancelación al director de proyecto para su revisión y validación.
        </p>
      </div>
    </div>

    <div className={`step ${step >= 3 ? "active" : ""}`}>
      <div className="step-number">3</div>
      <div className="step-content">
        <h3>Esperar Aprobación</h3>
        <p>
          Tu director y el comité de currículo revisarán tu solicitud conforme a los lineamientos institucionales vigentes. Durante este proceso, el estado de tu trámite podrá ser consultado en la plataforma hasta que se emita una decisión formal.
        </p>
      </div>
    </div>
  </div>

  {/* PASO 1: Subir documento */}
  {step === 1 && (
    <div className="cancellation-form">
      <h2>Paso 1: Subir Documento de Justificación</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        El documento debe explicar las razones por las cuales deseas cancelar tu modalidad de grado.
      </p>
      <form onSubmit={handleUploadDocument}>
        <div className="form-group">
          <label>Documento de Justificación (PDF) *</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="file-input"
            required
          />
          {file && (
            <div className="file-info">
               Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
          <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
            Formato: PDF | Tamaño máximo: 5 MB
          </small>
        </div>

        <button
          type="submit"
          className="btn-approve"
          disabled={loading || !file || !studentModalityId}
        >
          {loading ? " Subiendo..." : " Subir Documento"}
        </button>
      </form>
    </div>
  )}

  {/* PASO 2: Confirmar solicitud */}
  {step === 2 && (
    <div className="cancellation-confirm">
      <h2>Paso 2: Confirmar Solicitud de Cancelación</h2>
      <div className="confirm-box">
        <p>
          <strong>⚠️ Importante:</strong> Al confirmar esta solicitud:
        </p>
        <ul style={{ marginLeft: "1.5rem", lineHeight: "1.8" }}>
          <li>Tu director de proyecto recibirá la solicitud para revisión</li>
          <li>Si el director aprueba, pasará al comité de currículo del programa</li>
          <li>El comité tomará la decisión final sobre la cancelación</li>
          <li>Este proceso es irreversible una vez enviado</li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          <strong>¿Estás seguro de que deseas continuar?</strong>
        </p>
      </div>

      <div className="button-group">
        <button onClick={() => setStep(1)} className="btn-view-doc" disabled={loading}>
          ← Volver
        </button>
        <button
          onClick={handleRequestCancellation}
          className="btn-reject"
          disabled={loading || !studentModalityId}
        >
          {loading ? " Enviando..." : " Confirmar Solicitud"}
        </button>
      </div>
    </div>
  )}

  {/* PASO 3: Solicitud enviada */}
  {step === 3 && (
    <div className="cancellation-success">
      <div className="success-icon">✅</div>
      <h2>Solicitud Enviada Exitosamente</h2>
      <p>Tu solicitud de cancelación ha sido enviada y seguirá este proceso:</p>
      
      <div style={{ 
        background: "#f8f9fa", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginTop: "1.5rem",
        textAlign: "left"
      }}>
        <ol style={{ lineHeight: "2", marginLeft: "1.5rem" }}>
          <li><strong>Director de Proyecto:</strong> Revisará y aprobará/rechazará tu solicitud</li>
          <li><strong>Comité de Currículo:</strong> Si el director aprueba, el comité tomará la decisión final</li>
          <li><strong>Notificación:</strong> Recibirás una notificación con la decisión</li>
        </ol>
      </div>

      <p style={{ marginTop: "1.5rem", color: "#666" }}>
        Puedes ver el estado de tu solicitud en tu perfil de estudiante.
      </p>
    </div>
  )}
</div>
  );
}
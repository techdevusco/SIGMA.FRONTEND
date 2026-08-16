import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { getErrorMessage } from "../utils/errorUtils";
import "../styles/forgotpassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setMsg("Te enviamos un código a tu correo 📩");

      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    } catch (err) {
      // El backend ya maneja este mensaje:
      // - "No se encontró un usuario con el correo proporcionado."
      setMsg(getErrorMessage(err, "Error al enviar el correo"));
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">

        <div className="forgot-header">
          <h1>Recuperar contraseña</h1>
          <p>Ingresa tu correo institucional</p>
        </div>

        <div className="forgot-body">

          {msg && (
            <div className={`forgot-msg ${error ? "error" : ""}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="forgot-group">
              <input
                type="email"
                placeholder="Correo institucional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="forgot-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="forgot-btn-loading">
                  <span className="forgot-btn-spinner"></span>
                  Enviando...
                </span>
              ) : (
                "Enviar código"
              )}
            </button>
          </form>

          <div className="forgot-footer">
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

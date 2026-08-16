import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/errorUtils";
import "../styles/resetpassword.css";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });

      setSuccess("Contraseña cambiada correctamente ✅");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      // El backend ya maneja estos mensajes:
      // - "El token es inválido o ya ha sido utilizado."
      // - "El token ha expirado. Por favor, solicita un nuevo restablecimiento de contraseña."
      setError(getErrorMessage(err, "Error al restablecer contraseña"));
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">

        <div className="reset-header">
          <h1>Restablecer contraseña</h1>
          <p>Cambia tu contraseña de acceso</p>
        </div>

        <div className="reset-body">

          <p className="reset-info">
            Te enviamos un <b>código</b> a tu correo.
            Cópialo y pégalo a continuación
          </p>

          {error && <div className="reset-msg error">{error}</div>}
          {success && <div className="reset-msg success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="reset-group">
              <input
                type="text"
                placeholder="Código recibido"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            <div className="reset-group">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="reset-group">
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button className="reset-button" type="submit">
              Cambiar contraseña
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

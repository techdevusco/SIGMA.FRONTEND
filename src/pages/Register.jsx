import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { getErrorMessage, getFieldErrors } from "../utils/errorUtils";
import "../styles/register.css";


function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    // Validar apellido
    if (!form.lastName.trim()) {
      newErrors.lastName = "El apellido es obligatorio";
    }

    // Validar email
    if (!form.email.trim()) {
      newErrors.email = "El correo es obligatorio";
    } else if (!form.email.endsWith("@usco.edu.co")) {
      newErrors.email = "Debe usar un correo institucional @usco.edu.co";
    }

    // Validar contraseña
    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (form.password.length < 4) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    // Validar confirmación de contraseña
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar tu contraseña";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const VALID_ROLES = [
    "ADMIN",
    "SUPERADMIN",
    "PROGRAM_HEAD",
    "PROGRAM_CURRICULUM_COMMITTEE",
    "STUDENT",
    "PROJECT_DIRECTOR",
    "EXAMINER"
  ];

  const redirectByRole = (role) => {
    const normalizedRole = role.toUpperCase();
    switch (normalizedRole) {
      case "SUPERADMIN":
      case "ADMIN":
        navigate("/admin", { replace: true });
        break;
      case "PROGRAM_HEAD":
        navigate("/jefeprograma", { replace: true });
        break;
      case "PROGRAM_CURRICULUM_COMMITTEE":
        navigate("/comite", { replace: true });
        break;
      case "STUDENT":
        navigate("/student", { replace: true });
        break;
      case "PROJECT_DIRECTOR":
        navigate("/project-director", { replace: true });
        break;
      case "EXAMINER":
        navigate("/examiner", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    try {
      // Enviar solo los campos que el backend necesita
      const { confirmPassword, ...registerData } = form;
      const response = await register(registerData);
      // El backend retorna el token directamente
      const token = typeof response === "string" ? response : response?.token;
      if (!token) throw new Error("Token inválido recibido del servidor");

      // Decodificar y extraer rol
      const decoded = jwtDecode(token);
      let role = null;
      if (decoded?.role && VALID_ROLES.includes(decoded.role.toUpperCase())) {
        role = decoded.role.toUpperCase();
      } else if (decoded?.authorities) {
        let authorities = Array.isArray(decoded.authorities)
          ? decoded.authorities
          : decoded.authorities.split(",").map((a) => a.trim());
        for (const auth of authorities) {
          const cleanAuth = auth.replace("ROLE_", "").trim().toUpperCase();
          if (VALID_ROLES.includes(cleanAuth)) {
            role = cleanAuth;
            break;
          }
        }
      }
      if (!role) role = "STUDENT"; // fallback

      // Guardar token en contexto y redirigir
      login(token);
      setTimeout(() => {
        redirectByRole(role);
      }, 100);
    } catch (error) {
      console.error("Error al registrarse:", error);
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors && Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        return;
      }
      const errorMessage = getErrorMessage(error, "Error al registrarse");
      if (errorMessage.includes("correo") || errorMessage.includes("email")) {
        setErrors({ email: errorMessage });
      } else {
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
          </div>
          <h1>Registro</h1>
          <p>Crea tu cuenta para acceder al sistema SIGMA</p>
        </div>

        <div className="register-body">
          <form className="register-form" onSubmit={handleSubmit}>
            {/* NOMBRE */}
            <div className="register-group full">
              <label htmlFor="name"></label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ingresa tu nombre"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* APELLIDO */}
            <div className="register-group full">
              <label htmlFor="lastName"></label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Ingresa tu apellido"
                value={form.lastName}
                onChange={handleChange}
                className={errors.lastName ? "error" : ""}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>

            {/* EMAIL */}
            <div className="register-group full">
              <label htmlFor="email"></label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@usco.edu.co"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
              {!errors.email && (
                <small className="input-help">Debe ser un correo institucional @usco.edu.co</small>
              )}
            </div>

            {/* CONTRASEÑA */}
            <div className="register-group full">
              <label htmlFor="password"></label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  className={errors.password ? "error" : ""}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* CONFIRMAR CONTRASEÑA */}
            <div className="register-group full">
              <label htmlFor="confirmPassword"></label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "error" : ""}
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button className="register-button" type="submit">
              Registrarse
            </button>
          </form>

          <div className="register-footer">
            ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
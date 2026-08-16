/**
 * Utilidades compartidas para normalizar errores del backend.
 * Contratos soportados:
 *  - ApiResponse { success, message, data, timestamp } (data={campo:msg} en validación)
 *  - ReportResponse.error { success, message, error, data:null, timestamp }
 *  - String plano (auth: /auth/register, /auth/login, /auth/forgot-password, /auth/reset-password)
 *  - Errores de red axios (sin response)
 */

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getErrorMessage = (error, fallback = "Ocurrió un error inesperado") => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (isPlainObject(data)) {
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (isPlainObject(data.data)) {
      const firstValue = Object.values(data.data).find((v) => typeof v === "string");
      if (firstValue) return firstValue;
    }
    return JSON.stringify(data);
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

export const getFieldErrors = (error) => {
  const data = error?.response?.data?.data;
  if (!isPlainObject(data)) return null;
  const hasStringValues = Object.values(data).some((v) => typeof v === "string");
  return hasStringValues ? data : null;
};
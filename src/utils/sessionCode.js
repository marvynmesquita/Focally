/**
 * Gera um código de sessão de 6 dígitos
 * @returns {string} Código de 6 dígitos
 */
export const generateSessionCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Valida se um código de sessão é válido (6 dígitos)
 * @param {string} code - Código a validar
 * @returns {boolean} True se válido
 */
export const validateSessionCode = (code) => {
  return /^\d{6}$/.test(code);
};


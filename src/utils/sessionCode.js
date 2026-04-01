import { SESSION_CONFIG } from '../config/constants';

const SESSION_CODE_REGEX = new RegExp(`^\\d{${SESSION_CONFIG.CODE_LENGTH}}$`);

const getCrypto = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }

  return null;
};

/**
 * Gera um código de sessão numérico
 * @returns {string} Código com o tamanho definido em SESSION_CONFIG.CODE_LENGTH
 */
export const generateSessionCode = () => {
  const cryptoApi = getCrypto();

  if (cryptoApi?.getRandomValues) {
    const randomBuffer = new Uint32Array(1);
    cryptoApi.getRandomValues(randomBuffer);
    const randomValue = randomBuffer[0] % (10 ** SESSION_CONFIG.CODE_LENGTH);
    return randomValue.toString().padStart(SESSION_CONFIG.CODE_LENGTH, '0');
  }

  return Math.floor(Math.random() * (10 ** SESSION_CONFIG.CODE_LENGTH))
    .toString()
    .padStart(SESSION_CONFIG.CODE_LENGTH, '0');
};

export const normalizeSessionCode = (code) => {
  if (typeof code !== 'string') {
    return '';
  }

  return code.trim();
};

/**
 * Valida se um código de sessão é válido
 * @param {string} code - Código a validar
 * @returns {boolean} True se válido
 */
export const validateSessionCode = (code) => {
  return SESSION_CODE_REGEX.test(normalizeSessionCode(code));
};

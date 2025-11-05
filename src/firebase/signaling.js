import { ref, set, onValue, off, remove } from 'firebase/database';
import { database, isFirebaseConfigured } from './config';

/**
 * Verifica se o Firebase está configurado
 */
const checkFirebase = () => {
  if (!isFirebaseConfigured || !database) {
    throw new Error('Firebase não está configurado. Por favor, configure as credenciais em src/firebase/config.js');
  }
};

/**
 * Cria uma sessão de sinalização no Firebase
 * @param {string} sessionCode - Código da sessão
 * @param {string} offer - SDP Offer
 */
export const createSession = async (sessionCode, offer) => {
  checkFirebase();
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await set(sessionRef, {
    offer,
    answer: null,
    createdAt: Date.now()
  });
};

/**
 * Escuta por mudanças na sessão (para aluno receber oferta e professor receber resposta)
 * @param {string} sessionCode - Código da sessão
 * @param {function} callback - Callback chamado quando há mudanças
 * @returns {function} Função para cancelar a escuta
 */
export const listenToSession = (sessionCode, callback) => {
  checkFirebase();
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });

  return () => {
    off(sessionRef);
    unsubscribe();
  };
};

/**
 * Envia a resposta (answer) para a sessão
 * @param {string} sessionCode - Código da sessão
 * @param {string} answer - SDP Answer
 */
export const sendAnswer = async (sessionCode, answer) => {
  checkFirebase();
  const answerRef = ref(database, `sessions/${sessionCode}/answer`);
  await set(answerRef, answer);
};

/**
 * Limpa uma sessão do Firebase
 * @param {string} sessionCode - Código da sessão
 */
export const cleanupSession = async (sessionCode) => {
  if (!isFirebaseConfigured || !database) return;
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await remove(sessionRef);
};


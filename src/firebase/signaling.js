import { ref, set, onValue, off, remove, onChildAdded, onChildRemoved } from 'firebase/database';
import { database, isFirebaseConfigured } from './config';

const checkFirebase = () => {
  if (!isFirebaseConfigured || !database) {
    throw new Error('Firebase não está configurado. Por favor, configure as credenciais em src/firebase/config.js');
  }
};

/**
 * [MODIFICADO] Cria uma sessão (agora sem oferta inicial)
 * @param {string} sessionCode - Código da sessão
 */
export const createSession = async (sessionCode) => {
  checkFirebase();
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await set(sessionRef, {
    // A oferta do professor foi removida.
    offers: {}, // Alunos colocarão suas ofertas aqui
    answers: {}, // Professor colocará as respostas aqui
    createdAt: Date.now()
  });
};

/**
 * [MODIFICADO] Escuta por NOVAS OFERTAS (usado pelo Professor)
 * @param {string} sessionCode - Código da sessão
 * @param {function} onOfferCallback - Callback para quando um aluno posta uma oferta
 * @param {function} onOfferRemovedCallback - Callback para quando um aluno sai
 * @returns {function} Função para cancelar a escuta
 */
export const listenForOffers = (sessionCode, onOfferCallback, onOfferRemovedCallback) => {
  checkFirebase();
  const offersRef = ref(database, `sessions/${sessionCode}/offers`);
  
  const addedUnsubscribe = onChildAdded(offersRef, (snapshot) => {
    onOfferCallback(snapshot.key, snapshot.val());
  });

  const removedUnsubscribe = onChildRemoved(offersRef, (snapshot) => {
    onOfferRemovedCallback(snapshot.key);
  });

  return () => {
    off(offersRef);
    addedUnsubscribe();
    removedUnsubscribe();
  };
};

/**
 * [MODIFICADO] Envia a OFERTA do Aluno
 * @param {string} sessionCode - Código da sessão
 * @param {string} studentId - ID único do aluno
 * @param {string} offer - SDP Offer do aluno
 */
export const sendOffer = async (sessionCode, studentId, offer) => {
  checkFirebase();
  const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
  await set(offerRef, offer);
};

/**
 * [MODIFICADO] Envia a RESPOSTA do Professor
 * @param {string} sessionCode - Código da sessão
 * @param {string} studentId - ID do aluno para quem é a resposta
 * @param {string} answer - SDP Answer do professor
 */
export const sendAnswer = async (sessionCode, studentId, answer) => {
  checkFirebase();
  const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
  await set(answerRef, answer);
};

/**
 * [MODIFICADO] Escuta pela RESPOSTA do Professor (usado pelo Aluno)
 * @param {string} sessionCode - Código da sessão
 * @param {string} studentId - ID único do aluno
 * @param {function} callback - Callback chamado quando a resposta é recebida
 * @param {function} errorCallback - Callback de erro
 * @returns {function} Função para cancelar a escuta
 */
export const listenForAnswer = (sessionCode, studentId, callback, errorCallback) => {
  checkFirebase();
  const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
  
  const unsubscribe = onValue(answerRef, 
    (snapshot) => {
      const answer = snapshot.val();
      if (answer) {
        callback(answer);
      }
    }, 
    (error) => {
      console.error('Erro ao escutar resposta no Firebase:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return () => {
    off(answerRef);
    unsubscribe();
  };
};


/**
 * [MODIFICADO] Aluno remove sua própria OFERTA ao sair
 */
export const cleanupOffer = async (sessionCode, studentId) => {
  if (!isFirebaseConfigured || !database) return;
  // Limpa a oferta e a resposta associada
  const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
  await remove(offerRef);
  const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
  await remove(answerRef);
};

/**
 * Limpa uma sessão INTEIRA do Firebase (usado pelo Professor)
 */
export const cleanupSession = async (sessionCode) => {
  if (!isFirebaseConfigured || !database) return;
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await remove(sessionRef);
};
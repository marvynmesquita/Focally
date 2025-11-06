import { ref, set, onValue, off, remove, onChildAdded, onChildRemoved } from 'firebase/database';
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
 * Cria uma sessão de sinalização no Firebase (Armazena a oferta do professor)
 * @param {string} sessionCode - Código da sessão
 * @param {string} offer - SDP Offer
 */
export const createSession = async (sessionCode, offer) => {
  checkFirebase();
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await set(sessionRef, {
    offer,
    answers: {}, // Inicializa o nó para as respostas dos alunos
    createdAt: Date.now()
  });
};

/**
 * Escuta pela OFERTA do professor (usado pelo Aluno)
 * @param {string} sessionCode - Código da sessão
 * @param {function} callback - Callback chamado quando a oferta é recebida
 * @param {function} errorCallback - Callback chamado em caso de erro no listener
 * @returns {function} Função para cancelar a escuta
 */
export const listenToSession = (sessionCode, callback, errorCallback) => {
  checkFirebase();
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  
  const unsubscribe = onValue(sessionRef, 
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    }, 
    (error) => {
      console.error('Erro ao escutar sessão no Firebase:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return () => {
    off(sessionRef);
    unsubscribe();
  };
};

/**
 * Envia a resposta (answer) de UM aluno para a sessão
 * @param {string} sessionCode - Código da sessão
 * @param {string} studentId - ID único do aluno
 * @param {string} answer - SDP Answer
 */
export const sendAnswer = async (sessionCode, studentId, answer) => {
  checkFirebase();
  const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
  await set(answerRef, answer);
};

/**
 * [NOVO] Escuta por novas respostas (answers) de alunos (usado pelo Professor)
 * @param {string} sessionCode - Código da sessão
 * @param {function} onAnswerCallback - Callback para quando um aluno entra (onChildAdded)
 * @param {function} onAnswerRemovedCallback - Callback para quando um aluno sai (onChildRemoved)
 * @returns {function} Função para cancelar a escuta
 */
export const listenForAnswers = (sessionCode, onAnswerCallback, onAnswerRemovedCallback) => {
  checkFirebase();
  const answersRef = ref(database, `sessions/${sessionCode}/answers`);
  
  // Escuta por novos alunos
  const addedUnsubscribe = onChildAdded(answersRef, (snapshot) => {
    const studentId = snapshot.key;
    const answer = snapshot.val();
    onAnswerCallback(studentId, answer);
  });

  // Escuta por alunos que saíram
  const removedUnsubscribe = onChildRemoved(answersRef, (snapshot) => {
    const studentId = snapshot.key;
    onAnswerRemovedCallback(studentId);
  });

  return () => {
    off(answersRef);
    addedUnsubscribe();
    removedUnsubscribe();
  };
};

/**
 * [NOVO] Aluno remove sua própria resposta ao sair
 * @param {string} sessionCode - Código da sessão
 * @param {string} studentId - ID único do aluno
 */
export const cleanupAnswer = async (sessionCode, studentId) => {
  if (!isFirebaseConfigured || !database) return;
  const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
  await remove(answerRef);
};


/**
 * Limpa uma sessão INTEIRA do Firebase (usado pelo Professor)
 * @param {string} sessionCode - Código da sessão
 */
export const cleanupSession = async (sessionCode) => {
  if (!isFirebaseConfigured || !database) return;
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  await remove(sessionRef);
};
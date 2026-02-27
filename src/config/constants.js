export const STATUS_MESSAGES = {
    WAITING: 'Aguardando...',
    CONNECTING: 'Conectando à sessão...',
    CONNECTED: 'Conectado',
    DISCONNECTED: 'Conexão perdida',
    ERROR: 'Erro',
    REQUESTING_MIC: 'Solicitando permissão do microfone...',
    WAITING_STUDENTS: 'Aguardando alunos...',
    PROCESSING_STUDENT: 'Processando novo aluno...',
    RECEIVING_ANSWER: 'Resposta recebida, conectando...',
    OFFER_SENT: 'Oferta enviada, aguardando resposta...',
};

export const AUDIO_CONFIG = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
};

export const FIREBASE_PATHS = {
    SESSIONS: 'sessions',
};

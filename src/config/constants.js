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

export const WEBRTC_CONFIG = {
    ICE_GATHERING_TIMEOUT_MS: 3000,
    MAX_SDP_PAYLOAD_SIZE: 10000
};

export const VISUALIZER_CONFIG = {
    FFT_SIZE: 256,
    SMOOTHING: 0.7
};

export const FALLBACK_SOUND_OPTIONS = [
    { value: 'white-noise', label: 'Ruído Branco' },
    { value: 'pink-noise', label: 'Ruído Rosa' },
    { value: 'brown-noise', label: 'Ruído Marrom' },
    { value: 'beta-wave', label: 'Beta (Foco)' },
    { value: 'theta-wave', label: 'Theta (Relaxamento)' },
];

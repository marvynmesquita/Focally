import { ref, set, onValue, off, remove, onChildAdded, onChildRemoved, runTransaction } from 'firebase/database';
import { database, isFirebaseConfigured } from '../../firebase/config';
import { ISignalingService } from './ISignalingService';
import { logger } from '../../utils/logger';
import { FIREBASE_PATHS, SESSION_CONFIG, WEBRTC_CONFIG } from '../../config/constants';
import { normalizeSessionCode, validateSessionCode } from '../../utils/sessionCode';

const FIREBASE_KEY_REGEX = new RegExp(`^[A-Za-z0-9_-]{1,${SESSION_CONFIG.STUDENT_ID_MAX_LENGTH}}$`);
const SDP_HEADER_REGEX = /^v=0\r?\n/;

const assertValidSessionCode = (sessionCode) => {
    const normalizedSessionCode = normalizeSessionCode(sessionCode);

    if (!validateSessionCode(normalizedSessionCode)) {
        throw new Error('Código de sessão inválido.');
    }

    return normalizedSessionCode;
};

const assertValidParticipantId = (participantId) => {
    if (typeof participantId !== 'string' || !FIREBASE_KEY_REGEX.test(participantId)) {
        throw new Error('Identificador de participante inválido.');
    }

    return participantId;
};

const assertValidSdpPayload = (payload) => {
    if (typeof payload !== 'string' || payload.length === 0 || payload.length > WEBRTC_CONFIG.MAX_SDP_PAYLOAD_SIZE) {
        throw new Error('Payload SDP inválido.');
    }

    if (!SDP_HEADER_REGEX.test(payload)) {
        throw new Error('Formato de SDP recusado no Client-Side.');
    }

    return payload;
};

export class FirebaseSignalingService extends ISignalingService {
    checkFirebase() {
        if (!isFirebaseConfigured || !database) {
            throw new Error('Firebase não está configurado. Por favor, configure as credenciais em .env');
        }
    }

    async createSession(sessionCode) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const sessionRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}`);

        const { committed } = await runTransaction(sessionRef, (currentData) => {
            if (currentData !== null) {
                return;
            }

            return {
                offers: {},
                answers: {},
                createdAt: Date.now()
            };
        }, { applyLocally: false });

        if (!committed) {
            throw new Error('Código de sessão já está em uso. Gere outro código.');
        }
    }

    listenForOffers(sessionCode, onOfferCallback, onOfferRemovedCallback) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const offersRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/offers`);

        const addedUnsubscribe = onChildAdded(offersRef, (snapshot) => {
            const participantId = snapshot.key;
            if (!participantId || !FIREBASE_KEY_REGEX.test(participantId)) {
                logger.warn('[Signaling] Oferta ignorada por ID inválido:', participantId);
                return;
            }

            onOfferCallback(participantId, snapshot.val());
        });

        const removedUnsubscribe = onChildRemoved(offersRef, (snapshot) => {
            const participantId = snapshot.key;
            if (!participantId || !FIREBASE_KEY_REGEX.test(participantId)) {
                return;
            }

            onOfferRemovedCallback(participantId);
        });

        return () => {
            off(offersRef);
            addedUnsubscribe();
            removedUnsubscribe();
        };
    }

    async sendOffer(sessionCode, studentId, offer) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const normalizedStudentId = assertValidParticipantId(studentId);
        const validatedOffer = assertValidSdpPayload(offer);
        const offerRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/offers/${normalizedStudentId}`);
        await set(offerRef, validatedOffer);
    }

    async sendAnswer(sessionCode, studentId, answer) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const normalizedStudentId = assertValidParticipantId(studentId);
        const validatedAnswer = assertValidSdpPayload(answer);
        const answerRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/answers/${normalizedStudentId}`);
        await set(answerRef, validatedAnswer);
    }

    listenForAnswer(sessionCode, studentId, callback, errorCallback) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const normalizedStudentId = assertValidParticipantId(studentId);
        const answerRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/answers/${normalizedStudentId}`);

        const unsubscribe = onValue(answerRef,
            (snapshot) => {
                const answer = snapshot.val();
                if (answer) {
                    callback(answer);
                }
            },
            (error) => {
                logger.error('Erro ao escutar resposta no Firebase:', error);
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        );

        return () => {
            off(answerRef);
            unsubscribe();
            // Workaround para onValue unsubscribe not completely unbinding listeners immediately in some cases
        };
    }

    listenForSessionClose(sessionCode, onClosedCallback) {
        this.checkFirebase();
        const normalizedSessionCode = assertValidSessionCode(sessionCode);
        const sessionRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}`);
        
        let initialDataLoaded = false;
        
        const unsubscribe = onValue(sessionRef, (snapshot) => {
            if (initialDataLoaded && !snapshot.exists()) {
                onClosedCallback();
            }
            initialDataLoaded = true;
        });
        
        return () => {
            off(sessionRef);
            unsubscribe();
        };
    }

    async cleanupOffer(sessionCode, studentId) {
        if (!isFirebaseConfigured || !database) return;
        try {
            const normalizedSessionCode = assertValidSessionCode(sessionCode);
            const normalizedStudentId = assertValidParticipantId(studentId);
            const offerRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/offers/${normalizedStudentId}`);
            await remove(offerRef);
            const answerRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}/answers/${normalizedStudentId}`);
            await remove(answerRef);
        } catch (error) {
            logger.error('Erro ao limpar a oferta do Firebase:', error);
        }
    }

    async cleanupSession(sessionCode) {
        if (!isFirebaseConfigured || !database) return;
        try {
            const normalizedSessionCode = assertValidSessionCode(sessionCode);
            const sessionRef = ref(database, `${FIREBASE_PATHS.SESSIONS}/${normalizedSessionCode}`);
            await remove(sessionRef);
        } catch (error) {
            logger.error('Erro ao limpar sessão no Firebase:', error);
        }
    }
}

export const firebaseSignalingService = new FirebaseSignalingService();

import { ref, set, onValue, off, remove, onChildAdded, onChildRemoved } from 'firebase/database';
import { database, isFirebaseConfigured } from '../../firebase/config';
import { ISignalingService } from './ISignalingService';
import { logger } from '../../utils/logger';

export class FirebaseSignalingService extends ISignalingService {
    checkFirebase() {
        if (!isFirebaseConfigured || !database) {
            throw new Error('Firebase não está configurado. Por favor, configure as credenciais em .env');
        }
    }

    async createSession(sessionCode) {
        this.checkFirebase();
        const sessionRef = ref(database, `sessions/${sessionCode}`);
        await set(sessionRef, {
            offers: {},
            answers: {},
            createdAt: Date.now()
        });
    }

    listenForOffers(sessionCode, onOfferCallback, onOfferRemovedCallback) {
        this.checkFirebase();
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
    }

    async sendOffer(sessionCode, studentId, offer) {
        this.checkFirebase();
        if (typeof offer !== 'string' || offer.length > 10000) {
            throw new Error('Payload SDP inválido.');
        }
        if (!offer.startsWith('v=0\r\n')) {
            throw new Error('Formato de SDP recusado no Client-Side (Oferta inválida).');
        }
        const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
        await set(offerRef, offer);
    }

    async sendAnswer(sessionCode, studentId, answer) {
        this.checkFirebase();
        if (typeof answer !== 'string' || answer.length > 10000) {
            throw new Error('Payload SDP inválido.');
        }
        if (!answer.startsWith('v=0\r\n')) {
            throw new Error('Formato de SDP recusado no Client-Side (Resposta inválida).');
        }
        const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
        await set(answerRef, answer);
    }

    listenForAnswer(sessionCode, studentId, callback, errorCallback) {
        this.checkFirebase();
        const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);

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
        const sessionRef = ref(database, `sessions/${sessionCode}`);
        
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
            const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
            await remove(offerRef);
            const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
            await remove(answerRef);
        } catch (error) {
            logger.error('Erro ao limpar a oferta do Firebase:', error);
        }
    }

    async cleanupSession(sessionCode) {
        if (!isFirebaseConfigured || !database) return;
        try {
            const sessionRef = ref(database, `sessions/${sessionCode}`);
            await remove(sessionRef);
        } catch (error) {
            logger.error('Erro ao limpar sessão no Firebase:', error);
        }
    }
}

export const firebaseSignalingService = new FirebaseSignalingService();

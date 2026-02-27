import { ref, set, onValue, off, remove, onChildAdded, onChildRemoved } from 'firebase/database';
import { database, isFirebaseConfigured } from '../../firebase/config';
import { ISignalingService } from './ISignalingService';

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
        const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
        await set(offerRef, offer);
    }

    async sendAnswer(sessionCode, studentId, answer) {
        this.checkFirebase();
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
    }

    async cleanupOffer(sessionCode, studentId) {
        if (!isFirebaseConfigured || !database) return;
        const offerRef = ref(database, `sessions/${sessionCode}/offers/${studentId}`);
        await remove(offerRef);
        const answerRef = ref(database, `sessions/${sessionCode}/answers/${studentId}`);
        await remove(answerRef);
    }

    async cleanupSession(sessionCode) {
        if (!isFirebaseConfigured || !database) return;
        const sessionRef = ref(database, `sessions/${sessionCode}`);
        await remove(sessionRef);
    }
}

export const firebaseSignalingService = new FirebaseSignalingService();

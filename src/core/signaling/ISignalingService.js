/**
 * Interface for signaling services.
 * Real implementations must provide these methods.
 */
export class ISignalingService {
    async createSession(sessionCode) {
        throw new Error('Method not implemented.');
    }

    listenForOffers(sessionCode, onOfferCallback, onOfferRemovedCallback) {
        throw new Error('Method not implemented.');
    }

    async sendOffer(sessionCode, studentId, offer) {
        throw new Error('Method not implemented.');
    }

    async sendAnswer(sessionCode, studentId, answer) {
        throw new Error('Method not implemented.');
    }

    listenForAnswer(sessionCode, studentId, callback, errorCallback) {
        throw new Error('Method not implemented.');
    }

    async cleanupOffer(sessionCode, studentId) {
        throw new Error('Method not implemented.');
    }

    async cleanupSession(sessionCode) {
        throw new Error('Method not implemented.');
    }
}

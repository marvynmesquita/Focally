import { getRTCConfig } from './WebRTCConfig';

export class WebRTCService {
    constructor() {
        this.config = getRTCConfig();
    }

    createPeerConnection() {
        try {
            return new RTCPeerConnection(this.config);
        } catch (err) {
            console.error('Erro ao inicializar PeerConnection:', err);
            throw err;
        }
    }
}

export const webRTCService = new WebRTCService();

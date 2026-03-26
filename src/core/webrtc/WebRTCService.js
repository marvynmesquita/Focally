import { getRTCConfig } from './WebRTCConfig';
import { logger } from '../../utils/logger';

export class WebRTCService {
    constructor() {
        this.config = null;
    }

    async createPeerConnection() {
        try {
            if (!this.config) {
                this.config = await getRTCConfig();
            }
            return new RTCPeerConnection(this.config);
        } catch (err) {
            logger.error('Erro ao inicializar PeerConnection:', err);
            throw err;
        }
    }
}

export const webRTCService = new WebRTCService();

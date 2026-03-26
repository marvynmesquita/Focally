import { logger } from '../../utils/logger';

export const getRTCConfig = async () => {
    try {
        // Idealmente, consumir de uma Rota de API protegida que fornece credenciais efêmeras
        const response = await fetch('/api/get-turn-credentials');
        
        if (!response.ok) {
            throw new Error('Falha ao buscar credenciais TURN');
        }
        
        const data = await response.json();
        return { iceServers: data.iceServers };
    } catch (error) {
        logger.warn('Usando STUN de fallback (sem TURN) devido a erro na API:', error);
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
    }
};

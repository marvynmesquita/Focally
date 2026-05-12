export const getRTCConfig = async () => {
    const formatUrl = (url, type) => {
        if (!url) return null;
        if (url.startsWith('stun:') || url.startsWith('turn:') || url.startsWith('turns:')) {
            return url;
        }
        return `${type}:${url}`;
    };

    const stunServer = import.meta.env.VITE_STUN_SERVER;
    const stunServer1 = import.meta.env.VITE_STUN_SERVER1;
    
    const iceServers = [];
    
    if (stunServer) iceServers.push({ urls: formatUrl(stunServer, 'stun') });
    if (stunServer1) iceServers.push({ urls: formatUrl(stunServer1, 'stun') });

    // Default fallback caso as variáveis de ambiente STUN estejam vazias
    if (iceServers.length === 0) {
        iceServers.push(
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        );
    }

    const turnServer = import.meta.env.VITE_TURN_SERVER;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

    if (turnServer && turnUsername && turnCredential) {
        iceServers.push({
            urls: formatUrl(turnServer, 'turn'),
            username: turnUsername,
            credential: turnCredential
        });
    }

    return { iceServers };
};

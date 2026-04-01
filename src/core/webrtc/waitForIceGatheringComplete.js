import { WEBRTC_CONFIG } from '../../config/constants';

export const waitForIceGatheringComplete = (
    peerConnection,
    timeoutMs = WEBRTC_CONFIG.ICE_GATHERING_TIMEOUT_MS
) => {
    if (peerConnection.iceGatheringState === 'complete') {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        let timeoutId;

        const handleIceGatheringStateChange = () => {
            if (peerConnection.iceGatheringState !== 'complete') {
                return;
            }

            peerConnection.removeEventListener('icegatheringstatechange', handleIceGatheringStateChange);
            clearTimeout(timeoutId);
            resolve();
        };

        timeoutId = setTimeout(() => {
            peerConnection.removeEventListener('icegatheringstatechange', handleIceGatheringStateChange);
            resolve();
        }, timeoutMs);

        peerConnection.addEventListener('icegatheringstatechange', handleIceGatheringStateChange);
    });
};

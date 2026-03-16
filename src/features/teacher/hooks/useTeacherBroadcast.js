import { useState, useRef, useCallback, useEffect } from 'react';
import { firebaseSignalingService as signaling } from '../../../core/signaling/FirebaseSignalingService';
import { webRTCService } from '../../../core/webrtc/WebRTCService';
import { generateSessionCode } from '../../../utils/sessionCode';
import { STATUS_MESSAGES, AUDIO_CONFIG } from '../../../config/constants';

export const useTeacherBroadcast = () => {
    const [sessionCode, setSessionCode] = useState(
        (typeof window !== 'undefined') ? localStorage.getItem('focally_session_code') || '' : ''
    );
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState(STATUS_MESSAGES.WAITING);

    const peerConnectionsRef = useRef(new Map()); // <studentId, RTCPeerConnection>
    const localStreamRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const sessionCodeRef = useRef(sessionCode);

    const startTransmission = useCallback(async () => {
        try {
            setError(null);
            setStatus(STATUS_MESSAGES.REQUESTING_MIC);

            const code = generateSessionCode();
            sessionCodeRef.current = code;

            if (typeof window !== 'undefined') {
                localStorage.setItem('focally_session_code', code);
            }
            setSessionCode(code);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Acesso ao microfone não suportado neste navegador. Se você não estiver usando localhost, certifique-se de que o site está rodando em HTTPS.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: AUDIO_CONFIG
            });

            localStreamRef.current = stream;

            try {
                console.log('[Teacher] Creating Firebase session for code:', code);
                await signaling.createSession(code);
                setStatus(STATUS_MESSAGES.WAITING_STUDENTS);
            } catch (firebaseError) {
                console.error('[Teacher] Erro ao criar sessão:', firebaseError);
                setError('Erro ao criar sessão: ' + firebaseError.message);
                setStatus(STATUS_MESSAGES.ERROR);
                return;
            }

            const onNewOffer = async (studentId, offerSDP) => {
                console.log(`[Teacher] New offer received from student: ${studentId}`);
                try {
                    if (peerConnectionsRef.current.has(studentId)) {
                        console.log(`[Teacher] Already have PC for student: ${studentId}`);
                        return;
                    }
                    setStatus(STATUS_MESSAGES.PROCESSING_STUDENT);
                    const pc = webRTCService.createPeerConnection();
                    console.log(`[Teacher] Created PC for student: ${studentId}`);

                    pc.oniceconnectionstatechange = () => {
                        console.log(`[Teacher] PC [${studentId}] ICE State Change:`, pc.iceConnectionState);
                        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                            setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
                            setIsConnected(peerConnectionsRef.current.size > 0);
                        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                            pc.close();
                            peerConnectionsRef.current.delete(studentId);
                            const size = peerConnectionsRef.current.size;
                            setStatus(size > 0 ? `Transmitindo para ${size} aluno(s)` : STATUS_MESSAGES.WAITING_STUDENTS);
                            setIsConnected(size > 0);
                        }
                    };

                    localStreamRef.current.getAudioTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current);
                    });

                    console.log(`[Teacher] Added tracks for student: ${studentId}`);

                    const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSDP });
                    await pc.setRemoteDescription(offerDesc);
                    console.log(`[Teacher] Set remote description for student: ${studentId}`);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log(`[Teacher] Created and set local answer description for student: ${studentId}`);

                    if (pc.iceGatheringState !== 'complete') {
                        console.log(`[Teacher] Waiting for ICE candidates to complete for student: ${studentId}...`);
                        await new Promise((resolve) => {
                            const checkState = () => {
                                if (pc.iceGatheringState === 'complete') {
                                    pc.removeEventListener('icegatheringstatechange', checkState);
                                    clearTimeout(timeoutId);
                                    resolve();
                                }
                            };
                            const timeoutId = setTimeout(() => {
                                pc.removeEventListener('icegatheringstatechange', checkState);
                                resolve(); // Fallback to avoid infinite wait
                            }, 3000); // 3-second fallback
                            pc.addEventListener('icegatheringstatechange', checkState);
                        });
                    }

                    const answerSDP = pc.localDescription.sdp;
                    console.log(`[Teacher] Sending answer to Firebase for student: ${studentId}`);
                    await signaling.sendAnswer(code, studentId, answerSDP);

                    peerConnectionsRef.current.set(studentId, pc);
                    setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
                    setIsConnected(true);
                } catch (err) {
                    console.error('[Teacher] Erro ao processar oferta:', err);
                }
            };

            const onOfferRemoved = (studentId) => {
                const pc = peerConnectionsRef.current.get(studentId);
                if (pc) {
                    pc.close();
                    peerConnectionsRef.current.delete(studentId);
                }
                const size = peerConnectionsRef.current.size;
                setStatus(size > 0 ? `Transmitindo para ${size} aluno(s)` : STATUS_MESSAGES.WAITING_STUDENTS);
                setIsConnected(size > 0);
            };

            unsubscribeRef.current = signaling.listenForOffers(code, onNewOffer, onOfferRemoved);

        } catch (err) {
            setError('Erro ao iniciar transmissão: ' + err.message);
            setStatus(STATUS_MESSAGES.ERROR);
        }
    }, []);

    const cleanup = useCallback(async () => {
        const currentSessionCode = sessionCodeRef.current;

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        if (currentSessionCode) {
            try {
                await signaling.cleanupSession(currentSessionCode);
            } catch (err) {
                console.error('Erro ao limpar sessão:', err);
            }
        }

        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (typeof window !== 'undefined') {
            localStorage.removeItem('focally_session_code');
        }

        setIsConnected(false);
        setStatus(STATUS_MESSAGES.WAITING);
        setSessionCode('');
        sessionCodeRef.current = '';
        setError(null);
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        status,
        sessionCode,
        error,
        isConnected,
        localStream: localStreamRef.current,
        startTransmission,
        cleanup
    };
};

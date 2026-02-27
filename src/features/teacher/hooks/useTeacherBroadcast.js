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

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: AUDIO_CONFIG
            });

            localStreamRef.current = stream;

            try {
                await signaling.createSession(code);
                setStatus(STATUS_MESSAGES.WAITING_STUDENTS);
            } catch (firebaseError) {
                setError('Erro ao criar sessão: ' + firebaseError.message);
                setStatus(STATUS_MESSAGES.ERROR);
                return;
            }

            const onNewOffer = async (studentId, offerSDP) => {
                try {
                    if (peerConnectionsRef.current.has(studentId)) {
                        return;
                    }
                    setStatus(STATUS_MESSAGES.PROCESSING_STUDENT);
                    const pc = webRTCService.createPeerConnection();

                    pc.oniceconnectionstatechange = () => {
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

                    const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSDP });
                    await pc.setRemoteDescription(offerDesc);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const answerSDP = pc.localDescription.sdp;
                    await signaling.sendAnswer(code, studentId, answerSDP);

                    peerConnectionsRef.current.set(studentId, pc);
                    setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
                    setIsConnected(true);
                } catch (err) {
                    console.error('Erro ao processar oferta:', err);
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

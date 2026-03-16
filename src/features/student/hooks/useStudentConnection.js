import { useState, useRef, useCallback, useEffect } from 'react';
import { firebaseSignalingService as signaling } from '../../../core/signaling/FirebaseSignalingService';
import { webRTCService } from '../../../core/webrtc/WebRTCService';
import { STATUS_MESSAGES } from '../../../config/constants';

export const useStudentConnection = () => {
    const [sessionCode, setSessionCode] = useState('');
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState(STATUS_MESSAGES.WAITING);

    const peerConnectionRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const sessionCodeRef = useRef('');
    const studentIdRef = useRef(null);

    const connectWithSessionCode = useCallback(async (code) => {
        try {
            setError(null);
            setStatus(STATUS_MESSAGES.CONNECTING);

            const studentId = 'student-' + Math.random().toString(36).substr(2, 9);
            studentIdRef.current = studentId;
            sessionCodeRef.current = code;
            setSessionCode(code);

            console.log(`[Student] Connecting with code: ${code}, Student ID: ${studentId}`);

            const pc = webRTCService.createPeerConnection();
            peerConnectionRef.current = pc;

            pc.ontrack = (event) => {
                console.log('[Student] Audio track received from teacher');
                remoteStreamRef.current = event.streams[0];
                setStatus(STATUS_MESSAGES.CONNECTED);
                setIsConnected(true);
            };

            pc.oniceconnectionstatechange = () => {
                console.log('[Student] ICE State Change:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    setStatus(STATUS_MESSAGES.CONNECTED);
                    setIsConnected(true);
                    setError(null);
                } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                    setStatus(STATUS_MESSAGES.DISCONNECTED);
                    setError('A conexão falhou ou foi desconectada.');
                    setIsConnected(false);
                }
            };

            pc.onerror = (error) => {
                console.error('[Student] PC Error:', error);
                setError('Erro na conexão WebRTC');
                setStatus(STATUS_MESSAGES.ERROR);
            };

            pc.addTransceiver('audio', { direction: 'recvonly' });

            console.log('[Student] Creating offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('[Student] Local description set');

            if (pc.iceGatheringState !== 'complete') {
                console.log('[Student] Waiting for ICE candidates to complete...');
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

            const offerSDP = pc.localDescription.sdp;

            console.log('[Student] Listening for answer from Firebase...');
            unsubscribeRef.current = signaling.listenForAnswer(code, studentId, async (answerSDP) => {
                console.log('[Student] Answer received from Teacher!');
                try {
                    if (pc.signalingState === 'have-local-offer') {
                        setStatus(STATUS_MESSAGES.RECEIVING_ANSWER);
                        const answerDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSDP });
                        await pc.setRemoteDescription(answerDesc);
                        console.log('[Student] Remote description set successfully');
                    } else {
                        console.log('[Student] PC State is not have-local-offer:', pc.signalingState);
                    }
                } catch (err) {
                    console.error('[Student] Erro ao processar resposta:', err);
                    setError('Erro ao processar resposta: ' + err.message);
                }
            }, (firebaseError) => {
                console.error('[Student] Erro no listener do Firebase:', firebaseError);
                setError('Erro ao escutar a resposta: ' + firebaseError.message);
            });

            console.log('[Student] Sending offer to Firebase');
            await signaling.sendOffer(code, studentId, offerSDP);
            setStatus(STATUS_MESSAGES.OFFER_SENT);

        } catch (err) {
            console.error('[Student] Erro fatal ao conectar:', err);
            setError('Erro ao conectar: ' + err.message);
            setStatus(STATUS_MESSAGES.ERROR);
        }
    }, []);

    const cleanup = useCallback(async () => {
        const currentSessionCode = sessionCodeRef.current;
        const currentStudentId = studentIdRef.current;

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        if (currentSessionCode && currentStudentId) {
            try {
                await signaling.cleanupOffer(currentSessionCode, currentStudentId);
            } catch (err) {
                console.error('Erro ao limpar oferta do aluno:', err);
            }
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        remoteStreamRef.current = null;

        setIsConnected(false);
        setStatus(STATUS_MESSAGES.WAITING);
        setSessionCode('');
        sessionCodeRef.current = '';
        studentIdRef.current = null;
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
        remoteStream: remoteStreamRef.current,
        connectWithSessionCode,
        cleanup
    };
};

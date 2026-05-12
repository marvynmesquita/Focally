import { useState, useRef, useCallback, useEffect } from 'react';
import { firebaseSignalingService as signaling } from '../../../core/signaling/FirebaseSignalingService';
import { webRTCService } from '../../../core/webrtc/WebRTCService';
import { generateSessionCode } from '../../../utils/sessionCode';
import { STATUS_MESSAGES, AUDIO_CONFIG, SESSION_CONFIG } from '../../../config/constants';
import { logger } from '../../../utils/logger';
import { waitForIceGatheringComplete } from '../../../core/webrtc/waitForIceGatheringComplete';

export const useTeacherBroadcast = () => {
    const [sessionCode, setSessionCode] = useState('');
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState(STATUS_MESSAGES.WAITING);

    const peerConnectionsRef = useRef(new Map()); // <studentId, RTCPeerConnection>
    const localStreamRef = useRef(null);
    const rawStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const sessionCodeRef = useRef(sessionCode);

    const startTransmission = useCallback(async () => {
        try {
            setError(null);
            setStatus(STATUS_MESSAGES.REQUESTING_MIC);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Acesso ao microfone não suportado neste navegador. Se você não estiver usando localhost, certifique-se de que o site está rodando em HTTPS.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: AUDIO_CONFIG
            });

            // Store raw stream for cleanup
            rawStreamRef.current = stream;

            // Audio DSP pipeline: Pré-tratamento para conforto vocal e proteção
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;

            const sourceNode = audioCtx.createMediaStreamSource(stream);

            // 1. High-pass filter: Remove graves indesejados (ruídos de mesa, vento, batidas no microfone)
            const highpassFilter = audioCtx.createBiquadFilter();
            highpassFilter.type = 'highpass';
            highpassFilter.frequency.value = 85;

            // 2. Peaking filter: Aumenta a clareza e presença da voz (médios-agudos)
            const presenceFilter = audioCtx.createBiquadFilter();
            presenceFilter.type = 'peaking';
            presenceFilter.frequency.value = 3000;
            presenceFilter.Q.value = 1.0;
            presenceFilter.gain.value = 3.0; // Leve ganho na inteligibilidade

            // 3. Compressor "Musical": Nivela o volume geral da fala de forma suave
            const levelingCompressor = audioCtx.createDynamicsCompressor();
            levelingCompressor.threshold.value = -24;
            levelingCompressor.knee.value = 10;
            levelingCompressor.ratio.value = 4;
            levelingCompressor.attack.value = 0.01;
            levelingCompressor.release.value = 0.1;

            // 4. Limiter: Proteção estrita contra picos/estouros repentinos (hardware fails)
            const limiterNode = audioCtx.createDynamicsCompressor();
            limiterNode.threshold.value = -10;
            limiterNode.knee.value = 0; // Hard knee para limiter
            limiterNode.ratio.value = 20; // Ratio máximo para limitar
            limiterNode.attack.value = 0.002;
            limiterNode.release.value = 0.2;

            // 5. Low-pass filter: Suaviza agudos extremos e chiados (reduz fadiga auditiva)
            const lowpassFilter = audioCtx.createBiquadFilter();
            lowpassFilter.type = 'lowpass';
            lowpassFilter.frequency.value = 10000;

            const destinationNode = audioCtx.createMediaStreamDestination();

            // Encadeamento: source -> highpass -> presence -> leveling -> limiter -> lowpass -> destination
            sourceNode.connect(highpassFilter);
            highpassFilter.connect(presenceFilter);
            presenceFilter.connect(levelingCompressor);
            levelingCompressor.connect(limiterNode);
            limiterNode.connect(lowpassFilter);
            lowpassFilter.connect(destinationNode);

            localStreamRef.current = destinationNode.stream;

            try {
                let code = null;

                for (let attempt = 0; attempt < SESSION_CONFIG.MAX_GENERATION_ATTEMPTS; attempt += 1) {
                    const nextCode = generateSessionCode();

                    try {
                        logger.log('[Teacher] Creating Firebase session for code:', nextCode);
                        await signaling.createSession(nextCode);
                        code = nextCode;
                        break;
                    } catch (firebaseError) {
                        if (!firebaseError.message?.includes('já está em uso')) {
                            throw firebaseError;
                        }
                    }
                }

                if (!code) {
                    throw new Error('Não foi possível gerar um código de sessão livre.');
                }

                sessionCodeRef.current = code;
                setSessionCode(code);
                setStatus(STATUS_MESSAGES.WAITING_STUDENTS);
            } catch (firebaseError) {
                logger.error('[Teacher] Erro ao criar sessão:', firebaseError);
                setError('Erro ao criar sessão: ' + firebaseError.message);
                setStatus(STATUS_MESSAGES.ERROR);
                return;
            }

            const onNewOffer = async (studentId, offerSDP) => {
                logger.log(`[Teacher] New offer received from student: ${studentId}`);
                try {
                    if (peerConnectionsRef.current.has(studentId)) {
                        logger.log(`[Teacher] Already have PC for student: ${studentId}`);
                        return;
                    }
                    setStatus(STATUS_MESSAGES.PROCESSING_STUDENT);
                    const pc = await webRTCService.createPeerConnection();
                    logger.log(`[Teacher] Created PC for student: ${studentId}`);

                    pc.oniceconnectionstatechange = () => {
                        logger.log(`[Teacher] PC [${studentId}] ICE State Change:`, pc.iceConnectionState);
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

                    logger.log(`[Teacher] Added tracks for student: ${studentId}`);

                    const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSDP });
                    await pc.setRemoteDescription(offerDesc);
                    logger.log(`[Teacher] Set remote description for student: ${studentId}`);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    logger.log(`[Teacher] Created and set local answer description for student: ${studentId}`);

                    logger.log(`[Teacher] Waiting for ICE candidates to complete for student: ${studentId}...`);
                    await waitForIceGatheringComplete(pc);

                    const answerSDP = pc.localDescription.sdp;
                    logger.log(`[Teacher] Sending answer to Firebase for student: ${studentId}`);
                    await signaling.sendAnswer(sessionCodeRef.current, studentId, answerSDP);

                    peerConnectionsRef.current.set(studentId, pc);
                    setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
                    setIsConnected(true);
                } catch (err) {
                    logger.error('[Teacher] Erro ao processar oferta:', err);
                    setError(`Falha ao processar aluno ${studentId}: ${err.message}`);
                    setStatus(STATUS_MESSAGES.ERROR);
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

            unsubscribeRef.current = signaling.listenForOffers(sessionCodeRef.current, onNewOffer, onOfferRemoved);

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
                logger.error('Erro ao limpar sessão:', err);
            }
        }

        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (rawStreamRef.current) {
            rawStreamRef.current.getTracks().forEach(track => track.stop());
            rawStreamRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close();
            } catch (err) {
                logger.error('Erro ao fechar AudioContext:', err);
            }
            audioContextRef.current = null;
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

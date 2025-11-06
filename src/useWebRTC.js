import { useState, useRef, useCallback, useEffect } from 'react';
import {
  createSession,
  sendOffer,
  listenForAnswer,
  listenForOffers,
  sendAnswer,
  cleanupSession,
  cleanupOffer
} from './firebase/signaling';
import { generateSessionCode } from './utils/sessionCode';

/**
 * Hook personalizado para gerenciar conexões WebRTC com código de sessão
 * @param {string} mode - 'professor' ou 'aluno'
 * @returns {object} Objeto com estado e funções para gerenciar WebRTC
 */
export const useWebRTC = (mode) => {
  // [CORREÇÃO] Apenas o 'professor' deve ler do localStorage.
  // O 'aluno' deve sempre começar com o estado limpo.
  const savedSessionCode = (mode === 'professor' && typeof window !== 'undefined')
    ? localStorage.getItem('focally_session_code')
    : null;

  const [sessionCode, setSessionCode] = useState(savedSessionCode || '');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Aguardando...');
  
  const peerConnectionRef = useRef(null); // Para o aluno
  const peerConnectionsRef = useRef(new Map()); // Para o professor <studentId, RTCPeerConnection>
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null); // Apenas para o aluno
  const unsubscribeRef = useRef(null);
  const sessionCodeRef = useRef(savedSessionCode || '');
  
  const studentIdRef = useRef(null); // Apenas para o aluno

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Seus servidores TURN
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:standard.relay.metered.ca:80",
        username: "135917c2e0b8d6a968c34211",
        credential: "KiW8fcC8uTk/5lCa",
      },
      {
        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
        username: "135917c2e0b8d6a968c34211",
        credential: "KiW8fcC8uTk/5lCa",
      },
      {
        urls: "turn:standard.relay.metered.ca:443",
        username: "135917c2e0b8d6a968c34211",
        credential: "KiW8fcC8uTk/5lCa",
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: "135917c2e0b8d6a968c34211",
        credential: "KiW8fcC8uTk/5lCa",
      },
    ]
  };

  /**
   * Inicializa a conexão RTCPeerConnection
   */
  const initializePeerConnection = useCallback((studentId = null) => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      
      if (mode === 'aluno') {
        pc.ontrack = (event) => {
          console.log('Track recebido:', event.track);
          remoteStreamRef.current = event.streams[0];
          setStatus('Conectado');
          setIsConnected(true);
        };
      }

      pc.oniceconnectionstatechange = () => {
        const id = studentId || studentIdRef.current || 'aluno';
        console.log(`ICE Connection State (${id}):`, pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          if (mode === 'aluno') {
            setStatus('Conectado');
            setIsConnected(true);
            setError(null);
          } else if (mode === 'professor') {
            setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
            setIsConnected(peerConnectionsRef.current.size > 0);
          }
        
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          console.error(`Erro de conexão WebRTC (${id}): Estado mudou para`, pc.iceConnectionState);
          if (mode === 'professor' && studentId) {
            console.log('Aluno desconectado:', studentId);
            pc.close();
            peerConnectionsRef.current.delete(studentId);
            const size = peerConnectionsRef.current.size;
            setStatus(size > 0 ? `Transmitindo para ${size} aluno(s)` : 'Aguardando alunos...');
            setIsConnected(size > 0);
          } else if (mode === 'aluno') {
            setStatus('Conexão perdida');
            setError('A conexão falhou ou foi desconectada.');
            setIsConnected(false);
          }
        }
      };

      pc.onerror = (error) => {
        console.error('Erro na conexão WebRTC:', error);
        setError('Erro na conexão WebRTC');
        setStatus('Erro');
      };

      return pc;
    } catch (err) {
      console.error('Erro ao inicializar PeerConnection:', err);
      setError('Erro ao inicializar conexão: ' + err.message);
      setStatus('Erro');
      return null;
    }
  }, [mode]); // [CORREÇÃO]: A dependência 'mode' já estava correta aqui.

  /**
   * Inicia a transmissão de áudio (modo Professor)
   */
  const startTransmission = useCallback(async () => {
    try {
      setError(null);
      setStatus('Solicitando permissão do microfone...');

      const code = generateSessionCode();
      console.log('Código de sessão gerado:', code);
      sessionCodeRef.current = code;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('focally_session_code', code);
      }
      setSessionCode(code);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      try {
        console.log('Criando sessão no Firebase com código:', code);
        await createSession(code);
        console.log('Sessão criada com sucesso no Firebase');
        setStatus('Aguardando alunos...');
      } catch (firebaseError) {
        console.error('Erro ao criar sessão no Firebase:', firebaseError);
        setError('Erro ao criar sessão: ' + firebaseError.message);
        setStatus('Erro ao criar sessão');
        return;
      }

      // Handler para quando um novo aluno envia uma OFERTA
      const onNewOffer = async (studentId, offerSDP) => {
        try {
          console.log('Recebida nova oferta de:', studentId);
          if (peerConnectionsRef.current.has(studentId)) {
            console.warn('Conexão já existe para o aluno:', studentId);
            return;
          }
          setStatus('Processando novo aluno...');
          const pc = initializePeerConnection(studentId);
          
          localStreamRef.current.getAudioTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
          });

          const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSDP });
          await pc.setRemoteDescription(offerDesc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          await new Promise(resolve => setTimeout(resolve, 1000));

          const answerSDP = pc.localDescription.sdp;
          await sendAnswer(code, studentId, answerSDP);

          peerConnectionsRef.current.set(studentId, pc);
          setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
          setIsConnected(true);
        } catch (err) {
          console.error('Erro ao processar oferta do aluno:', studentId, err);
        }
      };

      // Handler para quando um aluno remove sua oferta (desconecta)
      const onOfferRemoved = (studentId) => {
        console.log('Aluno removido:', studentId);
        const pc = peerConnectionsRef.current.get(studentId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(studentId);
        }
        const size = peerConnectionsRef.current.size;
        setStatus(size > 0 ? `Transmitindo para ${size} aluno(s)` : 'Aguardando alunos...');
        setIsConnected(size > 0);
      };

      unsubscribeRef.current = listenForOffers(code, onNewOffer, onOfferRemoved);

    } catch (err) {
      console.error('Erro ao iniciar transmissão:', err);
      setError('Erro ao iniciar transmissão: ' + err.message);
      setStatus('Erro');
    }
  }, [initializePeerConnection, setStatus, setError]); // [CORREÇÃO] Adicionado setStatus e setError

  /**
   * Conecta usando o código de sessão (modo Aluno)
   */
  const connectWithSessionCode = useCallback(async (code) => {
    try {
      setError(null);
      setStatus('Conectando à sessão...');
      
      const studentId = 'student-' + Math.random().toString(36).substr(2, 9);
      studentIdRef.current = studentId;
      sessionCodeRef.current = code;
      setSessionCode(code);
      
      const pc = initializePeerConnection();
      if (!pc) return;

      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const offerSDP = pc.localDescription.sdp;
      
      unsubscribeRef.current = listenForAnswer(code, studentId, async (answerSDP) => {
        try {
          if (pc.signalingState === 'have-local-offer') {
            setStatus('Resposta recebida, conectando...');
            const answerDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSDP });
            await pc.setRemoteDescription(answerDesc);
            peerConnectionRef.current = pc;
          }
        } catch (err) {
           console.error('Erro ao definir resposta remota:', err);
           setError('Erro ao processar resposta: ' + err.message);
        }
      }, (firebaseError) => {
        console.error('Erro no listener do Firebase (Aluno):', firebaseError);
        setError('Erro ao escutar a resposta: ' + firebaseError.message);
      });

      await sendOffer(code, studentId, offerSDP);
      setStatus('Oferta enviada, aguardando resposta...');

    } catch (err) {
      console.error('Erro ao conectar com código de sessão:', err);
      setError('Erro ao conectar: ' + err.message);
      setStatus('Erro');
    }
  }, [initializePeerConnection, setStatus, setError]); // [CORREÇÃO] Adicionado setStatus e setError

  /**
   * Limpa recursos e fecha conexões
   */
  const cleanup = useCallback(async () => {
    const currentSessionCode = sessionCodeRef.current;
    const currentStudentId = studentIdRef.current;
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (mode === 'professor') {
      if (currentSessionCode) {
        try {
          await cleanupSession(currentSessionCode);
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

    } else if (mode === 'aluno') {
      if (currentSessionCode && currentStudentId) {
        try {
          await cleanupOffer(currentSessionCode, currentStudentId);
        } catch (err) {
          console.error('Erro ao limpar oferta do aluno:', err);
        }
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      remoteStreamRef.current = null;
    }

    setIsConnected(false);
    setStatus('Aguardando...');
    setSessionCode('');
    sessionCodeRef.current = '';
    studentIdRef.current = null;
    setError(null);
  }, [mode]); // [CORREÇÃO]: A dependência 'mode' já estava correta aqui.

  // Limpar quando o componente for desmontado
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
    startTransmission,
    connectWithSessionCode,
    cleanup
  };
};
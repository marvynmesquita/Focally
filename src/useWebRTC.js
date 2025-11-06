import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  createSession, 
  listenToSession, 
  sendAnswer, 
  cleanupSession,
  listenForAnswers, // NOVO
  cleanupAnswer     // NOVO
} from './firebase/signaling';
import { generateSessionCode } from './utils/sessionCode';

/**
 * Hook personalizado para gerenciar conexões WebRTC com código de sessão
 * @param {string} mode - 'professor' ou 'aluno'
 * @returns {object} Objeto com estado e funções para gerenciar WebRTC
 */
export const useWebRTC = (mode) => {
  const savedSessionCode = typeof window !== 'undefined' ? localStorage.getItem('focally_session_code') : null;
  const [status, setStatus] = useState('Aguardando...');
  const [sessionCode, setSessionCode] = useState(savedSessionCode || '');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // MODIFICADO: Professor gerencia MÚLTIPLAS conexões, Aluno apenas UMA
  const peerConnectionRef = useRef(null); // Para o aluno
  const peerConnectionsRef = useRef(new Map()); // Para o professor <studentId, RTCPeerConnection>
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null); // Apenas para o aluno
  const unsubscribeRef = useRef(null);
  const sessionCodeRef = useRef(savedSessionCode || '');
  
  // NOVO: Refs para o ID do aluno e a oferta do professor
  const studentIdRef = useRef(null);
  const offerRef = useRef(null);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // ... (servidores TURN existentes) ...
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
  const initializePeerConnection = useCallback((studentId = null) => { // studentId é para o professor
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      
      // SÓ o aluno recebe áudio
      if (mode === 'aluno') {
        pc.ontrack = (event) => {
          console.log('Track recebido:', event.track);
          remoteStreamRef.current = event.streams[0];
          setStatus('Conectado');
          setIsConnected(true);
        };
      }

      // Handler para mudanças no estado da conexão ICE
      pc.oniceconnectionstatechange = () => {
        const id = studentId || 'aluno';
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
          if (mode === 'professor' && studentId) {
            // Um aluno específico desconectou
            console.log('Aluno desconectado:', studentId);
            pc.close();
            peerConnectionsRef.current.delete(studentId);
            setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
            setIsConnected(peerConnectionsRef.current.size > 0);
          } else if (mode === 'aluno') {
            // O aluno foi desconectado
            setStatus('Conexão perdida');
            setError('A conexão falhou ou foi desconectada.');
            setIsConnected(false);
          }
        }
      };

      // Handler para erros
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
  }, [mode]);

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
      
      setStatus('Criando oferta...');

      // MODIFICADO: Cria um PC temporário APENAS para gerar a oferta
      const tempPC = initializePeerConnection();
      if (!tempPC) {
        setError('Erro ao inicializar conexão WebRTC');
        return;
      }
      stream.getAudioTracks().forEach(track => {
        tempPC.addTrack(track, stream);
      });
      const offer = await tempPC.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      await tempPC.setLocalDescription(offer);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const offerSDP = tempPC.localDescription.sdp;
      offerRef.current = offerSDP; // Salva a oferta no Ref
      tempPC.close(); // Fecha o PC temporário

      // Criar sessão no Firebase com a oferta
      try {
        console.log('Criando sessão no Firebase com código:', code);
        await createSession(code, offerSDP);
        console.log('Sessão criada com sucesso no Firebase');
        setStatus('Aguardando alunos...');
      } catch (firebaseError) {
        console.error('Erro ao criar sessão no Firebase:', firebaseError);
        setError('Erro ao criar sessão: ' + firebaseError.message);
        setStatus('Erro ao criar sessão');
        return;
      }

      // NOVO: Handler para quando um novo aluno envia uma resposta
      const onNewAnswer = async (studentId, answerSDP) => {
        try {
          console.log('Recebida nova resposta de:', studentId);
          if (peerConnectionsRef.current.has(studentId)) {
            console.warn('Conexão já existe para o aluno:', studentId);
            return;
          }
          setStatus('Processando novo aluno...');
          const pc = initializePeerConnection(studentId); // Passa o studentId
          
          localStreamRef.current.getAudioTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
          });

          const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerRef.current });
          const answerDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSDP });

          // Define as descrições na ordem correta para o "ofertante"
          await pc.setLocalDescription(offerDesc);
          await pc.setRemoteDescription(answerDesc);

          peerConnectionsRef.current.set(studentId, pc); // Armazena a nova conexão
          setStatus(`Transmitindo para ${peerConnectionsRef.current.size} aluno(s)`);
          setIsConnected(true);
        } catch (err) {
          console.error('Erro ao processar resposta do aluno:', studentId, err);
        }
      };

      // NOVO: Handler para quando um aluno remove sua resposta (desconecta)
      const onAnswerRemoved = (studentId) => {
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

      // MODIFICADO: Escuta por RESPOSTAS, não pela sessão inteira
      unsubscribeRef.current = listenForAnswers(code, onNewAnswer, onAnswerRemoved);

    } catch (err) {
      console.error('Erro ao iniciar transmissão:', err);
      setError('Erro ao iniciar transmissão: ' + err.message);
      setStatus('Erro');
    }
  }, [initializePeerConnection]);

  /**
   * Conecta usando o código de sessão (modo Aluno)
   */
  const connectWithSessionCode = useCallback(async (code) => {
    try {
      setError(null);
      setStatus('Conectando à sessão...');
      
      const studentId = 'student-' + Math.random().toString(36).substr(2, 9);
      studentIdRef.current = studentId; // Salva o ID único do aluno
      sessionCodeRef.current = code;
      setSessionCode(code);

      const unsubscribe = listenToSession(code, async (sessionData) => {
        // MODIFICADO: Garante que só rode uma vez
        if (sessionData.offer && !peerConnectionRef.current) {
          try {
            setStatus('Processando oferta...');

            const pc = initializePeerConnection();
            if (!pc) return;

            const offer = new RTCSessionDescription({
              type: 'offer',
              sdp: sessionData.offer
            });

            await pc.setRemoteDescription(offer);

            setStatus('Criando resposta...');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await new Promise(resolve => setTimeout(resolve, 1000));
            const answerSDP = pc.localDescription.sdp;
            
            // MODIFICADO: Envia a resposta com o studentId
            await sendAnswer(code, studentIdRef.current, answerSDP);
            
            peerConnectionRef.current = pc; // Salva a conexão única do aluno
            setStatus('Aguardando conexão...');
          } catch (err) {
            console.error('Erro ao processar oferta:', err);
            setError('Erro ao processar oferta: ' + err.message);
            setStatus('Erro');
          }
        }
      },
      (firebaseError) => {
        console.error('Erro no listener do Firebase (Aluno):', firebaseError);
        setError('Erro ao escutar a sessão: ' + firebaseError.message);
        setStatus('Erro');
      });

      unsubscribeRef.current = unsubscribe;

    } catch (err) {
      console.error('Erro ao conectar com código de sessão:', err);
      setError('Erro ao conectar: ' + err.message);
      setStatus('Erro');
    }
  }, [initializePeerConnection]);

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
      // Professor: Limpa a sessão inteira e fecha todas as conexões
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
      // Aluno: Limpa SÓ A SUA resposta e fecha sua única conexão
      if (currentSessionCode && currentStudentId) {
        try {
          await cleanupAnswer(currentSessionCode, currentStudentId);
        } catch (err) {
          console.error('Erro ao limpar resposta do aluno:', err);
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
    offerRef.current = null;
    setError(null);
  }, [mode]); // Adiciona 'mode' como dependência

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
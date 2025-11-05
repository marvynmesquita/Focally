import { useState, useRef, useCallback, useEffect } from 'react';
import { createSession, listenToSession, sendAnswer, cleanupSession } from './firebase/signaling';
import { generateSessionCode } from './utils/sessionCode';

/**
 * Hook personalizado para gerenciar conexões WebRTC com código de sessão
 * @param {string} mode - 'professor' ou 'aluno'
 * @returns {object} Objeto com estado e funções para gerenciar WebRTC
 */
export const useWebRTC = (mode) => {
  // Tentar recuperar código de sessão do localStorage (para sobreviver a remounts do Strict Mode)
  const savedSessionCode = typeof window !== 'undefined' ? localStorage.getItem('focally_session_code') : null;
  const [status, setStatus] = useState('Aguardando...');
  const [sessionCode, setSessionCode] = useState(savedSessionCode || '');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const sessionCodeRef = useRef(savedSessionCode || ''); // Ref para manter o código mesmo durante re-renders

  // Configuração STUN/TURN (pode adicionar servidores TURN para produção)
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  /**
   * Inicializa a conexão RTCPeerConnection
   */
  const initializePeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Handler para quando receber um track remoto (áudio)
      pc.ontrack = (event) => {
        console.log('Track recebido:', event.track);
        remoteStreamRef.current = event.streams[0];
        setStatus('Conectado');
        setIsConnected(true);
      };

      // Handler para mudanças no estado da conexão ICE
      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus(mode === 'professor' ? 'Transmitindo' : 'Conectado');
          setIsConnected(true);
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setStatus('Desconectado');
          setIsConnected(false);
        }
      };

      // Handler para erros
      pc.onerror = (error) => {
        console.error('Erro na conexão WebRTC:', error);
        setError('Erro na conexão WebRTC');
        setStatus('Erro');
      };

      peerConnectionRef.current = pc;
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

      // Gerar código de sessão PRIMEIRO para exibir imediatamente
      const code = generateSessionCode();
      console.log('Código de sessão gerado:', code);
      sessionCodeRef.current = code; // Manter em ref
      // Salvar no localStorage para sobreviver a remounts
      if (typeof window !== 'undefined') {
        localStorage.setItem('focally_session_code', code);
      }
      setSessionCode(code); // Exibir código imediatamente

      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Inicializar conexão
      const pc = initializePeerConnection();
      if (!pc) {
        setError('Erro ao inicializar conexão WebRTC');
        return;
      }

      // Adicionar o track de áudio à conexão
      stream.getAudioTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      setStatus('Criando oferta...');

      // Criar oferta SDP
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });

      await pc.setLocalDescription(offer);
      
      // Aguardar um pouco para que todos os ICE candidates sejam coletados
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obter a oferta completa (incluindo ICE candidates)
      const offerSDP = pc.localDescription.sdp;
      
      // Criar sessão no Firebase
      try {
        console.log('Criando sessão no Firebase com código:', code);
        await createSession(code, offerSDP);
        console.log('Sessão criada com sucesso no Firebase');
        setStatus('Aguardando aluno se conectar...');
      } catch (firebaseError) {
        console.error('Erro ao criar sessão no Firebase:', firebaseError);
        setError('Erro ao criar sessão: ' + firebaseError.message);
        setStatus('Erro ao criar sessão');
        // Manter o código visível mesmo se houver erro no Firebase
        return;
      }

      // Escutar por mudanças na sessão (para receber a resposta do aluno)
      const unsubscribe = listenToSession(code, async (sessionData) => {
        console.log('Dados da sessão recebidos:', sessionData);
        if (sessionData.answer && !isConnected) {
          try {
            setStatus('Processando resposta...');
            const answer = new RTCSessionDescription({
              type: 'answer',
              sdp: sessionData.answer
            });

            await pc.setRemoteDescription(answer);
            setStatus('Transmitindo');
            setIsConnected(true);
          } catch (err) {
            console.error('Erro ao processar resposta:', err);
            setError('Erro ao processar resposta: ' + err.message);
          }
        }
      });

      unsubscribeRef.current = unsubscribe;

    } catch (err) {
      console.error('Erro ao iniciar transmissão:', err);
      setError('Erro ao iniciar transmissão: ' + err.message);
      setStatus('Erro');
      // Manter o código visível mesmo se houver erro
    }
  }, [initializePeerConnection, isConnected]);

  /**
   * Conecta usando o código de sessão (modo Aluno)
   */
  const connectWithSessionCode = useCallback(async (code) => {
    try {
      setError(null);
      setStatus('Conectando à sessão...');
      sessionCodeRef.current = code; // Manter em ref
      setSessionCode(code);

      // Escutar por mudanças na sessão (para receber a oferta do professor)
      const unsubscribe = listenToSession(code, async (sessionData) => {
        if (sessionData.offer && !peerConnectionRef.current) {
          try {
            setStatus('Processando oferta...');

            // Inicializar conexão
            const pc = initializePeerConnection();
            if (!pc) return;

            const offer = new RTCSessionDescription({
              type: 'offer',
              sdp: sessionData.offer
            });

            await pc.setRemoteDescription(offer);

            setStatus('Criando resposta...');

            // Criar resposta SDP
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Aguardar um pouco para que todos os ICE candidates sejam coletados
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Obter a resposta completa
            const answerSDP = pc.localDescription.sdp;
            
            // Enviar resposta para o Firebase
            await sendAnswer(code, answerSDP);
            
            setStatus('Aguardando conexão...');
          } catch (err) {
            console.error('Erro ao processar oferta:', err);
            setError('Erro ao processar oferta: ' + err.message);
            setStatus('Erro');
          }
        }
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
    
    // Cancelar escuta do Firebase
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Limpar sessão do Firebase
    if (currentSessionCode) {
      try {
        await cleanupSession(currentSessionCode);
      } catch (err) {
        console.error('Erro ao limpar sessão:', err);
      }
    }

    // Parar stream local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Fechar conexão WebRTC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteStreamRef.current = null;
    setIsConnected(false);
    setStatus('Aguardando...');
    setSessionCode('');
    sessionCodeRef.current = '';
    // Limpar do localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('focally_session_code');
    }
    setError(null);
  }, []);

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

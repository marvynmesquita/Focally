import { useState, useEffect, useRef } from 'react';
import { useWebRTC } from './useWebRTC';
import SessionCodeInput from './components/SessionCodeInput';
import { isFirebaseConfigured } from './firebase/config';

function AlunoView() {
  const {
    status,
    sessionCode,
    error,
    isConnected,
    remoteStream,
    connectWithSessionCode,
    cleanup
  } = useWebRTC('aluno');

  const audioRef = useRef(null);

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Atualizar o elemento de áudio quando o stream remoto for recebido
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getStatusClass = () => {
    if (error) return 'status-error';
    if (isConnected) return 'status-connected';
    if (sessionCode) return 'status-waiting';
    return 'status-waiting';
  };

  return (
    <div>
      <h2>Modo: Aluno (Receptor)</h2>
      
      <div className={`status-indicator ${getStatusClass()}`}>
        Status: {status}
      </div>

      {error && (
        <div className="status-indicator status-error">
          Erro: {error}
        </div>
      )}

      {!isFirebaseConfigured && (
        <div className="status-indicator status-error" style={{ marginBottom: '20px' }}>
          <strong>⚠️ Firebase não configurado!</strong>
          <p style={{ marginTop: '10px', fontSize: '14px' }}>
            Por favor, configure o Firebase antes de usar o aplicativo.
            <br />
            Siga as instruções em <strong>FIREBASE_SETUP.md</strong> e edite <strong>src/firebase/config.js</strong>
          </p>
        </div>
      )}

      {!sessionCode ? (
        <>
          <div className="info-box">
            <p><strong>Como usar:</strong></p>
            <p>1. Digite o código de 6 dígitos recebido do professor ou escaneie o QR Code</p>
            <p>2. Clique em "Conectar"</p>
            <p>3. O áudio começará a tocar automaticamente quando a conexão for estabelecida</p>
          </div>

          <SessionCodeInput 
            onConnect={connectWithSessionCode}
            disabled={!isFirebaseConfigured}
          />
        </>
      ) : (
        <>
          <div className="info-box">
            <p><strong>Código de sessão:</strong> {sessionCode}</p>
            <p>Aguardando conexão com o professor...</p>
          </div>

          {isConnected && (
            <div className="audio-container">
              <div className="info-box" style={{ background: '#d4edda', marginBottom: '10px' }}>
                <p>✅ <strong>Conectado!</strong> O áudio do professor está sendo reproduzido.</p>
              </div>
              <audio 
                ref={audioRef}
                autoPlay
                controls
                playsInline
              >
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AlunoView;

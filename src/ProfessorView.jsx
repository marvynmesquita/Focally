import { useEffect, useRef } from 'react';
import { useWebRTC } from './useWebRTC';
import QRCodeDisplay from './components/QRCodeDisplay';
import { isFirebaseConfigured } from './firebase/config';
import DeviceStatus from './components/DeviceStatus';

function ProfessorView() {
  const {
    status,
    sessionCode,
    error,
    isConnected,
    startTransmission,
    cleanup
  } = useWebRTC('professor');

  // Limpar recursos quando o componente for desmontado
  // Usar uma ref para evitar limpar durante re-renders do Strict Mode
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;
  
  useEffect(() => {
    return () => {
      // Só limpar se realmente estiver desmontando (não durante re-renders)
      if (sessionCode || isConnected) {
        cleanupRef.current();
      }
    };
  }, []); // Array vazio = só executa no mount/unmount real

  const getStatusClass = () => {
    if (error) return 'status-error';
    if (isConnected) return 'status-transmitting';
    if (sessionCode) return 'status-waiting';
    return 'status-waiting';
  };

  const handleCopyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      alert('Código copiado para a área de transferência!');
    }
  };

  // Debug: log do sessionCode
  useEffect(() => {
    console.log('ProfessorView - sessionCode:', sessionCode);
    console.log('ProfessorView - status:', status);
    console.log('ProfessorView - error:', error);
  }, [sessionCode, status, error]);

  return (
    <div>
      <DeviceStatus />
      <h2>Modo: Professor (Transmissor)</h2>
      
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
            <p>1. Clique em "Iniciar Transmissão" e permita o acesso ao microfone</p>
            <p>2. Um código de 6 dígitos será gerado automaticamente</p>
            <p>3. Compartilhe o código ou QR Code com o aluno</p>
            <p>4. A conexão será estabelecida automaticamente quando o aluno se conectar</p>
          </div>

          <button 
            className="button button-primary"
            onClick={startTransmission}
            disabled={!isFirebaseConfigured}
          >
            Iniciar Transmissão
          </button>
        </>
      ) : (
        <>
          <div className="info-box">
            <p><strong>✅ Sessão criada!</strong></p>
            <p>Compartilhe o código abaixo ou o QR Code com o aluno. A conexão será estabelecida automaticamente.</p>
          </div>

          <QRCodeDisplay sessionCode={sessionCode} />

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              onClick={handleCopyCode}
              className="button button-secondary"
            >
              📋 Copiar Código
            </button>
          </div>

          {isConnected && (
            <div className="info-box" style={{ marginTop: '20px', background: '#d4edda' }}>
              <p>✅ <strong>Transmissão ativa!</strong> O aluno está conectado e ouvindo seu áudio.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProfessorView;

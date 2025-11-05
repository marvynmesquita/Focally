import { useState } from 'react';
import { validateSessionCode } from '../utils/sessionCode';

/**
 * Componente para entrada de código de sessão com opção de escanear QR Code
 * @param {function} onConnect - Callback quando o código for submetido
 * @param {boolean} disabled - Se o input está desabilitado
 */
function SessionCodeInput({ onConnect, disabled }) {
  const [code, setCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateSessionCode(code)) {
      setError('Código inválido. Digite 6 dígitos.');
      return;
    }

    onConnect(code);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '600', 
          color: '#333' 
        }}>
          Digite o código de sessão (6 dígitos):
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '4px',
              fontFamily: 'monospace',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          />
          <button
            type="submit"
            className="button button-primary"
            disabled={disabled || code.length !== 6}
          >
            Conectar
          </button>
        </div>
        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginTop: '8px', 
            fontSize: '14px' 
          }}>
            {error}
          </div>
        )}
      </form>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#e7f3ff', 
        borderRadius: '8px',
        border: '1px solid #2196F3'
      }}>
        <p style={{ 
          marginBottom: '10px', 
          color: '#1976D2', 
          fontWeight: '600' 
        }}>
          Alternativa: Escanear QR Code
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setShowQRScanner(!showQRScanner)}
          disabled={disabled}
        >
          {showQRScanner ? 'Ocultar Scanner' : 'Mostrar Scanner QR Code'}
        </button>
        {showQRScanner && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ 
              marginBottom: '10px', 
              color: '#666', 
              fontSize: '14px' 
            }}>
              Use a câmera do seu dispositivo para escanear o QR Code do professor
            </p>
            <video
              id="qr-video"
              style={{ 
                width: '100%', 
                maxWidth: '300px', 
                borderRadius: '8px',
                marginBottom: '10px'
              }}
            />
            <p style={{ 
              fontSize: '12px', 
              color: '#999' 
            }}>
              Nota: A funcionalidade de leitura de QR Code via câmera requer biblioteca adicional.
              Por enquanto, digite o código manualmente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionCodeInput;


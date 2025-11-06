import { useState, useEffect } from 'react';
import { validateSessionCode } from '../utils/sessionCode';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Componente para entrada de código de sessão com opção de escanear QR Code
 * @param {function} onConnect - Callback quando o código for submetido
 * @param {boolean} disabled - Se o input está desabilitado
 * @param {string} initialCode - Código para pré-preencher o input
 */
function SessionCodeInput({ onConnect, disabled, initialCode = '' }) {
  // MODIFICADO: Usa initialCode para o estado inicial
  const [code, setCode] = useState(initialCode);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  // Efeito para controlar o scanner de QR Code
  useEffect(() => {
    if (showQRScanner) {
      const scannerRegionId = "qr-reader";
      
      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerRegionId,
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        setError('');
        
        // NOVO: Validação flexível (pode ser a URL ou só o código)
        let sessionCode = decodedText;

        // Tenta extrair o código da URL, se for uma URL
        if (decodedText.includes('?code=')) {
          try {
            const url = new URL(decodedText);
            const codeFromUrl = url.searchParams.get('code');
            if (codeFromUrl) {
              sessionCode = codeFromUrl;
            }
          } catch (e) {
            // Ignora, trata como texto plano
          }
        }
        
        if (validateSessionCode(sessionCode)) {
          onConnect(sessionCode);
          setCode(sessionCode);
          setShowQRScanner(false);
        } else {
          setError('QR code inválido. Por favor, escaneie o código da sessão.');
        }
      };

      const onScanError = (errorMessage) => {
        // Não faz nada
      };

      html5QrcodeScanner.render(onScanSuccess, onScanError);

      return () => {
        html5QrcodeScanner.clear().catch(err => {
          console.error("Falha ao limpar o Html5QrcodeScanner.", err);
        });
      };
    }
  }, [showQRScanner, onConnect]);


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

  // ... (Renderização) ...
  // O restante do arquivo (lógica de renderização) pode permanecer o mesmo.
  // Apenas o <input> principal será pré-preenchido pelo useState.
  // ... (return <div> ... <form> ... <input value={code} ... /> ... </form> ... </div>)
  if (showQRScanner) {
    return (
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
        
        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginTop: '8px', 
            fontSize: '14px',
            textAlign: 'center' 
          }}>
            {error}
          </div>
        )}

        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setShowQRScanner(false);
            setError('');
          }}
          style={{ width: '100%', marginTop: '15px' }}
        >
          Cancelar Leitura
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }} className='connection-form'>
        <label>
          Digite o código de sessão (6 dígitos):
        </label>
        <div>
          <input
            type="text"
            value={code} // O valor será o 'initialCode' no primeiro render
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
          onClick={() => setShowQRScanner(true)}
          disabled={disabled}
        >
          📷 Escanear QR Code
        </button>
      </div>
    </div>
  );
}

export default SessionCodeInput;
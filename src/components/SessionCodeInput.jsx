import { useState, useEffect } from 'react';
import { validateSessionCode } from '../utils/sessionCode';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Componente para entrada de código de sessão com opção de escanear QR Code
 * @param {function} onConnect - Callback quando o código for submetido
 * @param {boolean} disabled - Se o input está desabilitado
 */
function SessionCodeInput({ onConnect, disabled }) {
  const [code, setCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  // Efeito para controlar o scanner de QR Code
  useEffect(() => {
    // Só inicializa o scanner se showQRScanner for true
    if (showQRScanner) {
      // ID do elemento div onde o scanner será renderizado
      const scannerRegionId = "qr-reader";
      
      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerRegionId,
        { 
          fps: 10, // Quadros por segundo
          qrbox: { width: 250, height: 250 } // Tamanho da caixa de leitura
        },
        false // verbose
      );

      // Callback de sucesso da leitura
      const onScanSuccess = (decodedText, decodedResult) => {
        setError(''); // Limpa erros anteriores
        
        // Valida se o código lido parece um código de sessão
        if (validateSessionCode(decodedText)) {
          onConnect(decodedText);
          setCode(decodedText);
          setShowQRScanner(false); // Fecha o scanner
        } else {
          setError('QR code inválido. Por favor, escaneie o código da sessão (6 dígitos).');
          // Não para o scanner, permite nova tentativa
        }
      };

      // Callback de erro (ex: não achou QR code)
      const onScanError = (errorMessage) => {
        // Não faz nada em erros comuns de "não encontrado"
      };

      // Inicia o scanner
      html5QrcodeScanner.render(onScanSuccess, onScanError);

      // Função de limpeza para parar o scanner quando o componente for desmontado
      // ou quando showQRScanner se tornar false
      return () => {
        html5QrcodeScanner.clear().catch(err => {
          console.error("Falha ao limpar o Html5QrcodeScanner.", err);
        });
      };
    }
  }, [showQRScanner, onConnect]); // Depende de showQRScanner e onConnect


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

  // --- RENDERIZAÇÃO ---

  // Modo Scanner Ativo
  if (showQRScanner) {
    return (
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        {/* O scanner será renderizado aqui */}
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
            setError(''); // Limpa o erro ao cancelar
          }}
          style={{ width: '100%', marginTop: '15px' }}
        >
          Cancelar Leitura
        </button>
      </div>
    );
  }

  // Modo Padrão (Digitação)
  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }} className='connection-form'>
        <label>
          Digite o código de sessão (6 dígitos):
        </label>
        <div>
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

      {/* Caixa do botão para ativar o scanner */}
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
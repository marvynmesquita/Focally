import { useState, useEffect } from 'react';
import { validateSessionCode } from '../utils/sessionCode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import NeonButton from './NeonButton';

/**
 * Componente para entrada de código de sessão com opção de escanear QR Code
 * @param {function} onConnect - Callback quando o código for submetido
 * @param {boolean} disabled - Se o input está desabilitado
 * @param {string} initialCode - Código para pré-preencher o input
 */
function SessionCodeInput({ onConnect, disabled, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

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
        
        let sessionCode = decodedText;

        if (decodedText.includes('?code=')) {
          try {
            const url = new URL(decodedText);
            const codeFromUrl = url.searchParams.get('code');
            if (codeFromUrl) {
              sessionCode = codeFromUrl;
            }
          } catch (e) {
            // Ignora
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

  if (showQRScanner) {
    return (
      <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
        <div id="qr-reader" className="w-full max-w-[500px] mx-auto overflow-hidden rounded-lg"></div>
        
        {error && (
          <div className="text-red-400 mt-2 text-sm text-center">
            {error}
          </div>
        )}

        <NeonButton
          variant="secondary"
          onClick={() => {
            setShowQRScanner(false);
            setError('');
          }}
          className="w-full mt-4"
        >
          Cancelar Leitura
        </NeonButton>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block mb-2 font-medium text-gray-300">
          Digite o Código da Sessão (6 dígitos):
        </label>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            disabled={disabled}
            className="w-full p-3 text-2xl text-center tracking-[0.5em] font-mono bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-cyan transition-colors placeholder-white/10"
          />
          <NeonButton
            type="submit"
            disabled={disabled || code.length !== 6}
            className="w-full"
          >
            Conectar
          </NeonButton>
        </div>
        {error && (
          <div className="text-red-400 mt-2 text-sm text-center">
            {error}
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20 text-center">
        <p className="mb-3 text-neon-cyan font-medium">
          Alternativa: Escanear QR Code
        </p>
        <NeonButton
          variant="secondary"
          onClick={() => setShowQRScanner(true)}
          disabled={disabled}
          className="w-full text-sm"
        >
          📷 Escanear QR Code
        </NeonButton>
      </div>
    </div>
  );
}

export default SessionCodeInput;
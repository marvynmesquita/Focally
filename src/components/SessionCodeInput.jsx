import { useState, useEffect } from 'react';
import { normalizeSessionCode, validateSessionCode } from '../utils/sessionCode';
import NeonButton from './NeonButton';
import { logger } from '../utils/logger';
import { SESSION_CONFIG } from '../config/constants';

/**
 * Componente para entrada de código de sessão com opção de escanear QR Code
 * @param {function} onConnect - Callback quando o código for submetido
 * @param {boolean} disabled - Se o input está desabilitado
 * @param {string} initialCode - Código para pré-preencher o input
 */
function SessionCodeInput({ onConnect, disabled, initialCode = '' }) {
  const normalizedInitialCode = normalizeSessionCode(initialCode);
  const [code, setCode] = useState(normalizedInitialCode);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCode(normalizedInitialCode);
  }, [normalizedInitialCode]);

  useEffect(() => {
    if (showQRScanner) {
      let html5QrcodeScanner = null;
      let isActive = true;
      const scannerRegionId = "qr-reader";

      import('html5-qrcode')
        .then(({ Html5QrcodeScanner }) => {
          if (!isActive) {
            return;
          }

          html5QrcodeScanner = new Html5QrcodeScanner(
            scannerRegionId,
            { 
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            false
          );

          const onScanSuccess = (decodedText) => {
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
                logger.warn('Ignorado: Formato do QRCode não pôde ser parseado via URL Object', e);
              }
            }
            
            if (validateSessionCode(sessionCode)) {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => logger.warn('Fullscreen bloqueada', err));
              }

              onConnect(sessionCode);
              setCode(sessionCode);
              setShowQRScanner(false);
            } else {
              setError('QR code inválido. Por favor, escaneie o código da sessão.');
            }
          };

          const onScanError = (errorMessage) => {
            logger.warn('Erro ao escanear QRCode:', errorMessage);
          };

          html5QrcodeScanner.render(onScanSuccess, onScanError);
        })
        .catch((error) => {
          logger.error('Falha ao carregar o leitor de QR Code.', error);
          setError('Não foi possível carregar a câmera. Tente novamente.');
          setShowQRScanner(false);
        });

      return () => {
        isActive = false;

        if (html5QrcodeScanner) {
          html5QrcodeScanner.clear().catch(err => {
            logger.error("Falha ao limpar o Html5QrcodeScanner.", err);
          });
        }
      };
    }
  }, [showQRScanner, onConnect]);


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateSessionCode(code)) {
      setError(`Código inválido. Digite ${SESSION_CONFIG.CODE_LENGTH} dígitos.`);
      return;
    }

    // Tentativa de tela cheia ao interagir
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => logger.warn('Fullscreen bloqueada', err));
    }

    onConnect(code);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, SESSION_CONFIG.CODE_LENGTH);
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
          Digite o Código da Sessão ({SESSION_CONFIG.CODE_LENGTH} dígitos):
        </label>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={SESSION_CONFIG.CODE_LENGTH}
            disabled={disabled}
            className="w-full p-3 text-2xl text-center tracking-[0.5em] font-mono bg-[#1f1f1f] border-2 border-[#4d4d4d] rounded-2xl text-white focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(83,58,253,0.3)] transition-all placeholder-white/20"
          />
          <NeonButton
            type="submit"
            disabled={disabled || code.length !== SESSION_CONFIG.CODE_LENGTH}
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

      <div className="mt-6 p-4 bg-accent-primary/10 rounded-2xl border border-accent-primary/20 text-center">
        <p className="mb-3 text-accent-primary font-medium tracking-tight">
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

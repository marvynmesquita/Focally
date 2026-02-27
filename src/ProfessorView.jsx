import { useEffect, useRef } from 'react';
import { useTeacherBroadcast } from './features/teacher/hooks/useTeacherBroadcast';
import QRCodeDisplay from './components/QRCodeDisplay';
import { isFirebaseConfigured } from './firebase/config';
import AudioVisualizerBackground from './components/AudioVisualizerBackground';
import GlassCard from './components/GlassCard';
import NeonButton from './components/NeonButton';

function ProfessorView() {
  const {
    status,
    sessionCode,
    error,
    isConnected,
    localStream,
    startTransmission,
    cleanup
  } = useTeacherBroadcast();

  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;

  useEffect(() => {
    return () => {
      if (sessionCode || isConnected) {
        cleanupRef.current();
      }
    };
  }, []);

  const handleCopyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      alert('Código copiado para a área de transferência!');
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AudioVisualizerBackground active={isConnected} audioStream={localStream} />

      <GlassCard className="flex flex-col items-center">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-white">Modo Professor</h2>
        </div>

        {/* Status Indicator */}
        <div className={`
          mb-8 px-4 py-2 rounded-full text-sm font-medium border
          ${error
            ? 'bg-red-500/10 border-red-500/30 text-red-200'
            : isConnected
              ? 'bg-green-500/10 border-green-500/30 text-green-200 animate-pulse'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'}
        `}>
          {error ? `Error: ${error}` : `Status: ${status}`}
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-center">
            <strong>⚠️ Firebase não configurado!</strong>
            <p className="text-sm mt-2">Por favor, configure o Firebase em src/firebase/config.js</p>
          </div>
        )}

        {!sessionCode ? (
          <div className="flex flex-col items-center w-full">
            <div className="mb-8 text-center text-gray-300 space-y-2">
              <p>1. Clique em "Iniciar Transmissão" para ativar o microfone</p>
              <p>2. Compartilhe o código gerado com seu aluno</p>
              <p>3. A conexão será estabelecida automaticamente</p>
            </div>

            <NeonButton
              onClick={startTransmission}
              disabled={!isFirebaseConfigured}
              className="w-full max-w-xs"
            >
              Iniciar Transmissão
            </NeonButton>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-fade-in">
            <div className="mb-8 text-center">
              <p className="text-gray-400 mb-4">Código da Sessão</p>
              <button
                onClick={handleCopyCode}
                className="text-5xl font-mono font-bold text-neon-cyan tracking-widest hover:scale-105 transition-transform cursor-pointer"
                title="Clique para copiar"
              >
                {sessionCode}
              </button>
            </div>

            <div className="mb-8 p-4 bg-white/5 rounded-xl">
              <QRCodeDisplay sessionCode={sessionCode} />
            </div>

            {isConnected && (
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan"></span>
                  </span>
                  Aluno Conectado e Ouvindo
                </div>
              </div>
            )}

            <NeonButton
              variant="danger"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Encerrar Sessão
            </NeonButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default ProfessorView;

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentConnection } from './features/student/hooks/useStudentConnection';
import SessionCodeInput from './components/SessionCodeInput';
import { isFirebaseConfigured } from './firebase/config';
import AudioVisualizerBackground from './components/AudioVisualizerBackground';
import GlassCard from './components/GlassCard';
import VolumeSlider from './components/VolumeSlider';
import BinauralSelector from './components/BinauralSelector';
import { useAudioMixer } from './features/student/hooks/useAudioMixer';
import { FALLBACK_SOUND_OPTIONS } from './config/constants';
import { logger } from './utils/logger';
import { useWakeLock } from './hooks/useWakeLock';

function AlunoView() {
  const {
    status,
    sessionCode,
    error,
    isConnected,
    remoteStream,
    connectWithSessionCode,
    cleanup
  } = useStudentConnection();

  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const professorAudioRef = useRef(null);
  const soundWaveAudioRef = useRef(null);

  const [professorVolume, setProfessorVolume] = useState(1);
  const [soundWaveVolume, setSoundWaveVolume] = useState(1);
  const [selectedSound, setSelectedSound] = useState('');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const { combinedStream } = useAudioMixer({
    isConnected,
    remoteStream,
    soundWaveAudioRef,
    selectedSound
  });

  const handleProfessorVolume = useCallback((e) => setProfessorVolume(Number(e.target.value)), []);
  const handleSoundWaveVolume = useCallback((e) => setSoundWaveVolume(Number(e.target.value)), []);

  useEffect(() => {
    return () => {
      cleanup();
      // AudioContext centralizado cuida da sua própria vida útil
    };
  }, [cleanup]);

  useEffect(() => {
    if (remoteStream && professorAudioRef.current) {
      professorAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Stream combinado agora é gerenciado pelo useAudioMixer

  useEffect(() => {
    if (professorAudioRef.current) {
      professorAudioRef.current.volume = professorVolume;
    }
  }, [professorVolume]);

  useEffect(() => {
    if (soundWaveAudioRef.current) {
      soundWaveAudioRef.current.volume = soundWaveVolume;

      if (selectedSound) {
        const soundFile = `/audio/${selectedSound}.mp3`;
        if (soundWaveAudioRef.current.src.endsWith(soundFile)) {
          soundWaveAudioRef.current.play().catch(e => {
            logger.warn('Interação: Reprodução automática bloqueada pelo navegador da Apple ou Edge');
            setAutoplayBlocked(true);
          });
        } else {
          soundWaveAudioRef.current.src = soundFile;
          soundWaveAudioRef.current.play().catch(e => {
            logger.warn('Interação: Reprodução automática bloqueada pelo navegador da Apple ou Edge');
            setAutoplayBlocked(true);
          });
        }
      } else {
        soundWaveAudioRef.current.pause();
        soundWaveAudioRef.current.src = '';
      }
    }
  }, [selectedSound, soundWaveVolume]);

  useEffect(() => {
    if (isConnected) {
      setSelectedSound('beta-wave');
      requestWakeLock();
    } else {
      setSelectedSound('');
      releaseWakeLock();
      // Sai da tela cheia ao desconectar, se estiver nela
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => logger.warn('Erro ao sair da tela cheia', err));
      }
    }
  }, [isConnected, requestWakeLock, releaseWakeLock]);



  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AudioVisualizerBackground active={isConnected} audioStream={combinedStream} />

      <GlassCard className="flex flex-col items-center">
        {autoplayBlocked && (
          <div 
            onClick={() => {
              setAutoplayBlocked(false);
              if (soundWaveAudioRef.current) {
                soundWaveAudioRef.current.play();
              }
            }}
            className="mb-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-center cursor-pointer hover:bg-yellow-500/20 transition-colors"
          >
            <strong>⚠️ Reprodução de Áudio Bloqueada</strong>
            <p className="text-sm mt-2">Clique aqui para habilitar o som na página.</p>
          </div>
        )}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-white">Modo Aluno</h2>
        </div>

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
          <div className="w-full">
            <div className="mb-8 text-center text-gray-300 space-y-2">
              <p>1. Digite o código de 6 dígitos do seu professor</p>
              <p>2. Clique em "Conectar" para entrar na sessão</p>
              <p>3. O áudio iniciará automaticamente</p>
            </div>

            <SessionCodeInput
              onConnect={connectWithSessionCode}
              disabled={!isFirebaseConfigured}
            />
          </div>
        ) : (
          <div className="w-full animate-fade-in">
            <div className="mb-8 text-center">
              <p className="text-gray-400">Conectado à Sessão</p>
              <p className="text-2xl font-mono font-bold text-neon-cyan tracking-widest">{sessionCode}</p>
            </div>

            {isConnected && (
              <div className="space-y-8">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <VolumeSlider
                    value={professorVolume}
                    onChange={handleProfessorVolume}
                    label="Volume do Professor"
                    icon="🎙️"
                  />
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-4">
                      <span className="text-neon-cyan">🌊</span> Som de Fundo
                    </label>
                    <BinauralSelector
                      selected={selectedSound}
                      onSelect={setSelectedSound}
                      options={FALLBACK_SOUND_OPTIONS}
                    />
                  </div>

                  <VolumeSlider
                    value={soundWaveVolume}
                    onChange={handleSoundWaveVolume}
                    label="Volume do Som"
                    icon="🔊"
                    disabled={!selectedSound}
                  />
                </div>

                <audio
                  ref={professorAudioRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />

                <audio
                  ref={soundWaveAudioRef}
                  loop
                  playsInline
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default AlunoView;
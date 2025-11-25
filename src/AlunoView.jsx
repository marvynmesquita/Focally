import { useState, useEffect, useRef } from 'react';
import { useWebRTC } from './useWebRTC';
import SessionCodeInput from './components/SessionCodeInput';
import { isFirebaseConfigured } from './firebase/config';
import AudioVisualizerBackground from './components/AudioVisualizerBackground';
import GlassCard from './components/GlassCard';
import VolumeSlider from './components/VolumeSlider';
import BinauralSelector from './components/BinauralSelector';

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

  const professorAudioRef = useRef(null);
  const soundWaveAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const combinedStreamRef = useRef(null);

  const [professorVolume, setProfessorVolume] = useState(1);
  const [soundWaveVolume, setSoundWaveVolume] = useState(0.2);
  const [selectedSound, setSelectedSound] = useState('');
  const [combinedStream, setCombinedStream] = useState(null);

  useEffect(() => {
    return () => {
      cleanup();
      // NÃO fechar o audioContext aqui, pois ele é compartilhado
      // e pode estar sendo usado pelo visualizador
    };
  }, [cleanup]);

  useEffect(() => {
    if (remoteStream && professorAudioRef.current) {
      professorAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Criar stream combinado para o visualizador
  useEffect(() => {
    if (!isConnected) {
      setCombinedStream(null);
      return;
    }

    try {
      // Criar AudioContext se não existir
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Resume o contexto se necessário
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const destination = audioContext.createMediaStreamDestination();

      // Conectar áudio do professor se disponível
      if (remoteStream) {
        try {
          const professorSource = audioContext.createMediaStreamSource(remoteStream);
          professorSource.connect(destination);
        } catch (e) {
          console.warn('Erro ao conectar stream do professor:', e);
        }
      }

      // Conectar áudio da onda sonora se disponível
      if (soundWaveAudioRef.current && selectedSound) {
        try {
          // Verificar se já não foi conectado antes
          if (!soundWaveAudioRef.current._connectedToContext) {
            const soundSource = audioContext.createMediaElementSource(soundWaveAudioRef.current);
            soundSource.connect(destination);
            soundSource.connect(audioContext.destination); // Manter áudio audível
            soundWaveAudioRef.current._connectedToContext = true;
            soundWaveAudioRef.current._audioSource = soundSource;
          } else if (soundWaveAudioRef.current._audioSource) {
            // Reconectar se já existe
            soundWaveAudioRef.current._audioSource.connect(destination);
          }
        } catch (e) {
          console.warn('Erro ao conectar onda sonora:', e);
        }
      }

      setCombinedStream(destination.stream);
      combinedStreamRef.current = destination.stream;
    } catch (error) {
      console.warn('Erro ao criar stream combinado:', error);
      // Fallback para apenas remoteStream
      setCombinedStream(remoteStream);
    }
  }, [isConnected, remoteStream, selectedSound]);

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
          soundWaveAudioRef.current.play().catch(e => console.warn("Reprodução automática bloqueada"));
        } else {
          soundWaveAudioRef.current.src = soundFile;
          soundWaveAudioRef.current.play().catch(e => console.warn("Reprodução automática bloqueada"));
        }
      } else {
        soundWaveAudioRef.current.pause();
        soundWaveAudioRef.current.src = '';
      }
    }
  }, [selectedSound, soundWaveVolume]);

  const soundOptions = [
    { value: 'white-noise', label: 'Ruído Branco' },
    { value: 'pink-noise', label: 'Ruído Rosa' },
    { value: 'brown-noise', label: 'Ruído Marrom' },
    { value: 'beta-wave', label: 'Beta (Foco)' },
    { value: 'theta-wave', label: 'Theta (Relaxamento)' },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AudioVisualizerBackground active={isConnected} audioStream={combinedStream} />
      
      <GlassCard className="flex flex-col items-center">
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
                    onChange={(e) => setProfessorVolume(Number(e.target.value))}
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
                      options={soundOptions}
                    />
                  </div>

                  <VolumeSlider 
                    value={soundWaveVolume}
                    onChange={(e) => setSoundWaveVolume(Number(e.target.value))}
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
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

  // MODIFICADO: Renomeado de audioRef para professorAudioRef
  const professorAudioRef = useRef(null);
  
  // NOVO: Ref para o player da onda sonora
  const soundWaveAudioRef = useRef(null);

  // NOVO: Estados para controle de volume e seleção de som
  const [professorVolume, setProfessorVolume] = useState(1); // 1 = 100%
  const [soundWaveVolume, setSoundWaveVolume] = useState(0.2); // 0.2 = 20%
  const [selectedSound, setSelectedSound] = useState(''); // '' = Nenhuma

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // MODIFICADO: Atualiza o player de áudio do professor
  useEffect(() => {
    if (remoteStream && professorAudioRef.current) {
      professorAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // NOVO: useEffect para controlar o volume do professor
  useEffect(() => {
    if (professorAudioRef.current) {
      professorAudioRef.current.volume = professorVolume;
    }
  }, [professorVolume]);

  // NOVO: useEffect para controlar o player da onda sonora (seleção e volume)
  useEffect(() => {
    if (soundWaveAudioRef.current) {
      // Define o volume
      soundWaveAudioRef.current.volume = soundWaveVolume;

      // Se uma onda sonora for selecionada
      if (selectedSound) {
        const soundFile = `/audio/${selectedSound}.mp3`;
        // Evita recarregar se o src já for o mesmo (ex: apenas mudando o volume)
        if (soundWaveAudioRef.current.src.endsWith(soundFile)) {
          soundWaveAudioRef.current.play().catch(e => console.warn("Autoplay da onda sonora bloqueado"));
        } else {
          soundWaveAudioRef.current.src = soundFile;
          soundWaveAudioRef.current.play().catch(e => console.warn("Autoplay da onda sonora bloqueado"));
        }
      } else {
        // Se "Nenhuma" for selecionada, pausa e limpa
        soundWaveAudioRef.current.pause();
        soundWaveAudioRef.current.src = '';
      }
    }
  }, [selectedSound, soundWaveVolume]);


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

          {/* MODIFICADO: Esta seção agora contém os controles de áudio */}
          {isConnected && (
            <div className="audio-container">
              <div className="info-box" style={{ background: '#d4edda', marginBottom: '20px' }}>
                <p>✅ <strong>Conectado!</strong> Ajuste os volumes como preferir.</p>
              </div>

              {/* NOVO: Painel de Controle de Áudio */}
              <div className="audio-controls">
                <div className="control-group">
                  <label htmlFor="prof-volume">🎙️ Volume do Professor</label>
                  <input
                    id="prof-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={professorVolume}
                    onChange={(e) => setProfessorVolume(Number(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <label htmlFor="sound-select">🌊 Onda Sonora</label>
                  <select
                    id="sound-select"
                    value={selectedSound}
                    onChange={(e) => setSelectedSound(e.target.value)}
                  >
                    <option value="">Nenhuma</option>
                    <option value="white-noise">Ruído Branco</option>
                    <option value="pink-noise">Ruído Rosa</option>
                    <option value="brown-noise">Ruído Marrom</option>
                    <option value="beta-wave">Ondas Beta</option>
                    <option value="theta-wave">Ondas Theta</option>
                    {/* Adicione mais opções conforme os arquivos que você adicionou */}
                  </select>
                </div>
                
                <div className="control-group">
                  <label htmlFor="sound-volume">🔊 Volume da Onda</label>
                  <input
                    id="sound-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundWaveVolume}
                    onChange={(e) => setSoundWaveVolume(Number(e.target.value))}
                    disabled={!selectedSound} // Desabilita se nenhuma onda for selecionada
                  />
                </div>
              </div>

              {/* MODIFICADO: Player do professor agora não tem controles visíveis */}
              <audio 
                ref={professorAudioRef}
                autoPlay
                playsInline
                style={{ display: 'none' }} // Oculto, pois controlamos via slider
              />

              {/* NOVO: Player da onda sonora, oculto e em loop */}
              <audio
                ref={soundWaveAudioRef}
                loop
                playsInline
                style={{ display: 'none' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AlunoView;
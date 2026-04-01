import { useState, useEffect, useRef } from 'react';
import { audioContextManager } from '../../../core/audio/AudioContextManager';
import { logger } from '../../../utils/logger';

export const useAudioMixer = ({ isConnected, remoteStream, soundWaveAudioRef, selectedSound }) => {
  const [combinedStream, setCombinedStream] = useState(null);
  const [mixerError, setMixerError] = useState(null);
  const audioSourceRef = useRef(null);
  const audioElementRef = useRef(null);

  useEffect(() => {
    if (!isConnected) {
      setMixerError(null);
      setCombinedStream(null);
      return;
    }

    let destination = null;
    let professorSource = null;

    try {
      setMixerError(null);
      const audioContext = audioContextManager.getAudioContext();
      destination = audioContext.createMediaStreamDestination();

      if (remoteStream) {
        try {
          professorSource = audioContext.createMediaStreamSource(remoteStream);
          professorSource.connect(destination);
        } catch (e) {
          logger.warn('Erro ao conectar stream do professor:', e);
          setMixerError('Falha ao conectar áudio do professor. Verifique as permissões de áudio da aba.');
        }
      }

      if (soundWaveAudioRef.current && selectedSound) {
        try {
          if (audioElementRef.current !== soundWaveAudioRef.current) {
            if (audioSourceRef.current) {
              audioSourceRef.current.disconnect();
            }
            audioSourceRef.current = audioContext.createMediaElementSource(soundWaveAudioRef.current);
            audioElementRef.current = soundWaveAudioRef.current;
          }
          audioSourceRef.current.connect(destination);
          audioSourceRef.current.connect(audioContext.destination);
        } catch (e) {
          logger.warn('Erro ao conectar onda sonora:', e);
          setMixerError('Falha ao conectar som de fundo. A reprodução automática pode estar bloqueada.');
        }
      }

      setCombinedStream(destination.stream);
    } catch (error) {
      logger.warn('Erro ao criar stream combinado:', error);
      setMixerError('Falha no mixer de áudio. Atualize a página e tente novamente.');
      setCombinedStream(remoteStream ?? null);
    }

    return () => {
      if (professorSource) {
        professorSource.disconnect();
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      if (destination) {
        destination.disconnect();
      }
    };
  }, [isConnected, remoteStream, selectedSound, soundWaveAudioRef]);

  return { combinedStream, mixerError };
};

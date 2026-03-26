import { useState, useEffect, useRef } from 'react';
import { audioContextManager } from '../../../core/audio/AudioContextManager';
import { logger } from '../../../utils/logger';

export const useAudioMixer = ({ isConnected, remoteStream, soundWaveAudioRef, selectedSound }) => {
  const [combinedStream, setCombinedStream] = useState(null);
  const [mixerError, setMixerError] = useState(null);
  const combinedStreamRef = useRef(null);
  const audioSourceRef = useRef(null);

  useEffect(() => {
    if (!isConnected) {
      setCombinedStream(null);
      return;
    }

    let destination = null;
    let professorSource = null;

    try {
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
          if (!audioSourceRef.current) {
            audioSourceRef.current = audioContext.createMediaElementSource(soundWaveAudioRef.current);
          }
          audioSourceRef.current.connect(destination);
          audioSourceRef.current.connect(audioContext.destination);
        } catch (e) {
          logger.warn('Erro ao conectar onda sonora:', e);
          setMixerError('Falha ao conectar som de fundo. A reprodução automática pode estar bloqueada.');
        }
      }

      setCombinedStream(destination.stream);
      combinedStreamRef.current = destination.stream;
    } catch (error) {
      logger.warn('Erro ao criar stream combinado:', error);
      setMixerError('Falha no mixer de áudio. Atualize a página e tente novamente.');
      setCombinedStream(remoteStream);
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

import { useState, useEffect, useRef } from 'react';
import { audioContextManager } from '../../../core/audio/AudioContextManager';
import { logger } from '../../../utils/logger';

export const useAudioMixer = ({ isConnected, remoteStream, soundWaveAudioRef, selectedSound, professorVolume = 1, soundWaveVolume = 1 }) => {
  const [combinedStream, setCombinedStream] = useState(null);
  const [mixerError, setMixerError] = useState(null);
  
  const audioSourceRef = useRef(null);
  const audioElementRef = useRef(null);
  
  const profGainRef = useRef(null);
  const waveGainRef = useRef(null);
  const autoDuckingGainRef = useRef(null);

  useEffect(() => {
    if (profGainRef.current) {
      profGainRef.current.gain.setTargetAtTime(professorVolume, audioContextManager.getAudioContext().currentTime, 0.05);
    }
  }, [professorVolume]);

  useEffect(() => {
    if (waveGainRef.current) {
      waveGainRef.current.gain.setTargetAtTime(soundWaveVolume, audioContextManager.getAudioContext().currentTime, 0.05);
    }
  }, [soundWaveVolume]);

  useEffect(() => {
    if (!isConnected) {
      setMixerError(null);
      setCombinedStream(null);
      return;
    }

    let destination = null;
    let professorSource = null;
    let animationFrameId = null;
    let profCompressor = null;
    let profAnalyser = null;
    let profGain = null;
    let waveGain = null;
    let autoDuckingGain = null;

    try {
      setMixerError(null);
      const audioContext = audioContextManager.getAudioContext();
      destination = audioContext.createMediaStreamDestination();

      profGain = audioContext.createGain();
      profGain.gain.value = professorVolume;
      profGainRef.current = profGain;

      profCompressor = audioContext.createDynamicsCompressor();
      profCompressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      profCompressor.knee.setValueAtTime(40, audioContext.currentTime);
      profCompressor.ratio.setValueAtTime(12, audioContext.currentTime);
      profCompressor.attack.setValueAtTime(0, audioContext.currentTime);
      profCompressor.release.setValueAtTime(0.25, audioContext.currentTime);

      profAnalyser = audioContext.createAnalyser();
      profAnalyser.fftSize = 512;
      profAnalyser.smoothingTimeConstant = 0.8;

      if (remoteStream) {
        try {
          professorSource = audioContext.createMediaStreamSource(remoteStream);
          professorSource.connect(profCompressor);
          profCompressor.connect(profGain);
          profGain.connect(profAnalyser);
          
          profGain.connect(destination);
          profGain.connect(audioContext.destination);
        } catch (e) {
          logger.warn('Erro ao conectar stream do professor:', e);
          setMixerError('Falha ao conectar áudio do professor. Verifique as permissões de áudio da aba.');
        }
      }

      waveGain = audioContext.createGain();
      waveGain.gain.value = soundWaveVolume;
      waveGainRef.current = waveGain;

      autoDuckingGain = audioContext.createGain();
      autoDuckingGain.gain.value = 1.0;
      autoDuckingGainRef.current = autoDuckingGain;

      if (soundWaveAudioRef.current && selectedSound) {
        try {
          if (audioElementRef.current !== soundWaveAudioRef.current) {
            if (audioSourceRef.current) {
              audioSourceRef.current.disconnect();
            }
            audioSourceRef.current = audioContext.createMediaElementSource(soundWaveAudioRef.current);
            audioElementRef.current = soundWaveAudioRef.current;
          }
          audioSourceRef.current.connect(waveGain);
          waveGain.connect(autoDuckingGain);
          
          autoDuckingGain.connect(destination);
          autoDuckingGain.connect(audioContext.destination);
        } catch (e) {
          logger.warn('Erro ao conectar onda sonora:', e);
          setMixerError('Falha ao conectar som de fundo. A reprodução automática pode estar bloqueada.');
        }
      }

      const equalizeAudio = () => {
        const profData = new Float32Array(profAnalyser.fftSize);
        profAnalyser.getFloatTimeDomainData(profData);
        let profRms = 0;
        for (let i = 0; i < profData.length; i++) {
          profRms += profData[i] * profData[i];
        }
        profRms = Math.sqrt(profRms / profData.length);

        const now = audioContext.currentTime;
        
        if (profRms > 0.015) {
          const targetDucking = Math.max(0.15, 1.0 - (profRms * 10));
          autoDuckingGain.gain.setTargetAtTime(targetDucking, now, 0.1);
        } else {
          autoDuckingGain.gain.setTargetAtTime(1.0, now, 0.5);
        }

        animationFrameId = requestAnimationFrame(equalizeAudio);
      };

      equalizeAudio();

      setCombinedStream(destination.stream);
    } catch (error) {
      logger.warn('Erro ao criar stream combinado:', error);
      setMixerError('Falha no mixer de áudio. Atualize a página e tente novamente.');
      setCombinedStream(remoteStream ?? null);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (professorSource) professorSource.disconnect();
      if (audioSourceRef.current) audioSourceRef.current.disconnect();
      if (destination) destination.disconnect();
      if (profCompressor) profCompressor.disconnect();
      if (profGain) profGain.disconnect();
      if (profAnalyser) profAnalyser.disconnect();
      if (waveGain) waveGain.disconnect();
      if (autoDuckingGain) autoDuckingGain.disconnect();
    };
  }, [isConnected, remoteStream, selectedSound, soundWaveAudioRef]);

  return { combinedStream, mixerError };
};

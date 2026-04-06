import { useEffect, useRef } from 'react';
import { audioContextManager } from '../core/audio/AudioContextManager';
import { logger } from '../utils/logger';
import { VISUALIZER_CONFIG } from '../config/constants';

const AudioVisualizerBackground = ({ active, audioStream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Se houver stream de áudio e estiver ativo, usar visualização real
    if (active && audioStream) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = audioContextManager.getAudioContext();
        }
        
        const audioContext = audioContextRef.current;
        
        // Resume o contexto se estiver suspenso
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = VISUALIZER_CONFIG.FFT_SIZE; // Aumentado para melhor resposta
        analyser.smoothingTimeConstant = VISUALIZER_CONFIG.SMOOTHING;
        
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);
        analyserRef.current = analyser;
        
        logger.log('Visualizador de áudio inicializado com sucesso');
      } catch (e) {
        logger.warn('Erro ao criar visualizador de áudio:', e);
      }
    } else {
      // Limpar analyser quando não estiver ativo
      analyserRef.current = null;
    }

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#09090b'); // --color-dark-start
      gradient.addColorStop(1, '#18181b'); // --color-dark-end
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const time = Date.now() * 0.001;
      const centerY = height / 2;

      // Calcular amplitude global do áudio
      let audioAmplitude = 0;
      
      if (analyserRef.current && active) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calcular amplitude média do áudio
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        audioAmplitude = sum / bufferLength / 255;
      }

      // Desenhar ondas estilo PS3
      const waveCount = 5;
      const baseAmplitudeMultiplier = active ? (1 + audioAmplitude * 3) : 1; // Multiplica amplitude baseado no áudio
      
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        
        // Cores suaves e minimalistas: Teal (#0D9488) e Branco Fosco
        const isCyan = w % 2 === 0;
        const baseOpacity = active ? (0.15 + audioAmplitude * 0.2) : 0.08;
        ctx.strokeStyle = isCyan 
          ? `rgba(13, 148, 136, ${baseOpacity - w * 0.02})` 
          : `rgba(255, 255, 255, ${baseOpacity - w * 0.01})`;
        ctx.lineWidth = 3 - w * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const offset = w * 0.5;
        const baseAmplitude = (50 + w * 12) * baseAmplitudeMultiplier; // Amplitude aumenta com o áudio
        
        for (let x = 0; x < width; x += 2) {
          // Ondas suaves sem distorção
          const y = centerY + 
                   Math.sin((x * 0.005) + time + offset) * baseAmplitude +
                   Math.sin((x * 0.01) + time * 1.5 - offset) * (baseAmplitude * 0.5) +
                   Math.sin((x * 0.003) + time * 0.8 + offset * 2) * (baseAmplitude * 0.3);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      // Adicionar brilho extra quando há áudio
      if (active && audioAmplitude > 0.2) {
        ctx.shadowBlur = 10 * audioAmplitude;
        ctx.shadowColor = audioAmplitude > 0.4 ? 'rgba(13, 148, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      } else {
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // NÃO fechar o audioContext aqui, pois ele pode ser compartilhado
      // com o AlunoView e ainda estar em uso
    };
  }, [active, audioStream]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
};

export default AudioVisualizerBackground;

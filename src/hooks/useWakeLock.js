import { useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

export const useWakeLock = () => {
  const wakeLockRef = useRef(null);
  const wantsLockRef = useRef(false);

  const requestWakeLock = useCallback(async () => {
    wantsLockRef.current = true;
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockRef.current !== null) {
            return; // Já está ativo
        }
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        logger.log('[WakeLock] Tela ativada (Wake Lock ativo)');
        
        lock.addEventListener('release', () => {
          logger.log('[WakeLock] Wake Lock foi liberado');
          wakeLockRef.current = null;
        });
      } catch (err) {
        logger.error(`[WakeLock Error]: ${err.name}, ${err.message}`);
      }
    } else {
        logger.warn('[WakeLock] API não suportada neste navegador.');
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    wantsLockRef.current = false;
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        logger.log('[WakeLock] Tela liberada (Wake Lock inativo)');
      } catch (err) {
        logger.error(`[WakeLock Release Error]: ${err.name}, ${err.message}`);
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wantsLockRef.current && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestWakeLock]);

  return { requestWakeLock, releaseWakeLock };
};

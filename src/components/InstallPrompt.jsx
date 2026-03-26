import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleBeforeInstall(e) {
      // Prevent automatic prompt
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
      setVisible(false)
      logger.info('App installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!visible) return null

  const onInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice && choice.outcome === 'accepted') {
      logger.info('User accepted the install prompt')
    } else {
      logger.info('User dismissed the install prompt')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  return (
    <div className="fixed bottom-3 left-3 right-3 z-[1000] flex justify-center p-4" role="dialog" aria-live="polite">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/20 flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl text-white">
        <div className="flex-1">
          <strong className="block text-lg">Instalar Focally</strong>
          <div className="text-sm opacity-90 mt-1">Instale o app no dispositivo para acesso mais rápido.</div>
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="bg-neon-cyan hover:bg-neon-cyan/80 text-black font-semibold py-2 px-4 rounded-lg transition-colors" onClick={onInstallClick}>Instalar</button>
          <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-colors" onClick={() => setVisible(false)}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

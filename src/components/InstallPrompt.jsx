import { useEffect, useState } from 'react'

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
      console.log('App installed')
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
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  return (
    <div style={containerStyle} role="dialog" aria-live="polite">
      <div style={contentStyle}>
        <div>
          <strong>Instalar Focally</strong>
          <div style={{ fontSize: 13 }}>Instale o app no dispositivo para acesso mais rápido.</div>
        </div>
        <div style={actionsStyle}>
          <button style={buttonStyle} onClick={onInstallClick}>Instalar</button>
          <button style={closeStyle} onClick={() => setVisible(false)}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  position: 'fixed',
  left: 12,
  right: 12,
  bottom: 12,
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center'
}

const contentStyle = {
  background: '#fff',
  borderRadius: 8,
  padding: '12px 16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  maxWidth: 720,
  width: '100%'
}

const actionsStyle = {
  marginLeft: 'auto',
  display: 'flex',
  gap: 8
}

const buttonStyle = {
  background: '#1f8feb',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer'
}

const closeStyle = {
  background: 'transparent',
  border: 'none',
  color: '#333',
  cursor: 'pointer'
}

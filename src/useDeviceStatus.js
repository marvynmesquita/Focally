import { useState, useEffect, useCallback } from 'react'

// Hook para detectar status de dispositivos de áudio (best-effort)
export default function useDeviceStatus() {
  const [audioInputs, setAudioInputs] = useState([])
  const [audioOutputs, setAudioOutputs] = useState([])
  const [microphoneAvailable, setMicrophoneAvailable] = useState(false)
  const [microphonePermission, setMicrophonePermission] = useState(null) // 'granted' | 'denied' | 'prompt' | null

  const updateDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioInputs(devices.filter(d => d.kind === 'audioinput'))
      setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'))
    } catch (e) {
      console.warn('Erro ao enumerar dispositivos:', e)
    }
  }, [])

  const checkMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophoneAvailable(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicrophoneAvailable(true)
      setMicrophonePermission('granted')
      // stop tracks
      stream.getTracks().forEach(t => t.stop())
    } catch (err) {
      if (err && err.name === 'NotAllowedError') {
        setMicrophonePermission('denied')
      } else if (err && err.name === 'NotFoundError') {
        setMicrophonePermission('denied')
        setMicrophoneAvailable(false)
      } else {
        setMicrophonePermission('prompt')
      }
    }
  }, [])

  useEffect(() => {
    updateDevices()
    // listen to devicechange
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', updateDevices)
      return () => navigator.mediaDevices.removeEventListener('devicechange', updateDevices)
    }
  }, [updateDevices])

  useEffect(() => {
    // best-effort initial microphone check, don't spam prompt if permission not yet granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then((res) => {
        setMicrophonePermission(res.state)
        if (res.state === 'granted') {
          setMicrophoneAvailable(true)
        }
        res.onchange = () => setMicrophonePermission(res.state)
      }).catch(() => {
        // permissions API may not be available; leave it null
      })
    }
  }, [])

  return {
    audioInputs,
    audioOutputs,
    microphoneAvailable,
    microphonePermission,
    updateDevices,
    checkMicrophone
  }
}

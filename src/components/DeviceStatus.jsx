import React, { useState } from 'react'
import useDeviceStatus from '../useDeviceStatus'

export default function DeviceStatus() {
  const { audioInputs, audioOutputs, microphoneAvailable, microphonePermission, checkMicrophone } = useDeviceStatus()
  const [testing, setTesting] = useState(false)

  const onTestMic = async () => {
    setTesting(true)
    try {
      await checkMicrophone()
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="device-status">
      <h4>Dispositivos</h4>
      <div>Microfones detectados: {audioInputs.length}</div>
      <div>Saídas de áudio (possíveis fones): {audioOutputs.length}</div>
      <div>Microfone disponível: {microphoneAvailable ? 'Sim' : 'Não'}</div>
      <div>Permissão do microfone: {microphonePermission ?? 'desconhecida'}</div>
      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={onTestMic} disabled={testing}>
          {testing ? 'Testando...' : 'Testar microfone (pedirá permissão)'}
        </button>
      </div>
      <small style={{ display: 'block', marginTop: 8 }}>
        Observação: detecção de "fones conectados" é limitada; navegadores expõem apenas
        a lista de saídas de áudio. Para testes finais, verifique em <em>Configurações de som</em> do sistema.
      </small>
    </div>
  )
}

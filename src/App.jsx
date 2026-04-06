import { useState, useEffect } from 'react'
import './index.css'
import InstallPrompt from './components/InstallPrompt'
import ViewRouter from './components/ViewRouter'
import ErrorBoundary from './components/ErrorBoundary'
import GlassCard from './components/GlassCard'
import AudioVisualizerBackground from './components/AudioVisualizerBackground'
import { logger } from './utils/logger'
import { validateSessionCode } from './utils/sessionCode'

function App() {
  const [mode, setMode] = useState(null)
  const [prefilledCode, setPrefilledCode] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const urlMode = params.get('mode')
      const urlCode = params.get('code')

      if (urlMode === 'aluno') {
        setMode('aluno')
        if (validateSessionCode(urlCode)) {
          setPrefilledCode(urlCode)
        }
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        )
      }
    } catch (e) {
      logger.error('Erro ao ler parâmetros da URL:', e)
    }
  }, [])

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden text-white font-sans'>
      <AudioVisualizerBackground active={false} />

      <InstallPrompt />

      <div className="w-full max-w-4xl z-10">
        {!mode ? (
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-gray-200">
              Focally
            </h1>
            <p className="text-gray-400 mb-12 text-lg font-medium tracking-wide">O portal para o foco profundo</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              <GlassCard
                hoverEffect={true}
                onClick={() => setMode('professor')}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent-primary/20 group-hover:border-accent-primary/30 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 group-hover:text-accent-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Professor</h2>
                <p className="text-gray-400 text-sm">Transmita áudio e guie a sessão de foco.</p>
              </GlassCard>

              <GlassCard
                hoverEffect={true}
                onClick={() => setMode('aluno')}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Aluno</h2>
                <p className="text-gray-400 text-sm">Conecte-se e entre na zona de foco.</p>
              </GlassCard>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setMode(null)}
              className="self-start mb-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Voltar ao Início
            </button>

            <div className="w-full">
              <ErrorBoundary>
                <ViewRouter mode={mode} prefilledCode={prefilledCode} />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react'; // Importar useEffect
import ProfessorView from './ProfessorView';
import AlunoView from './AlunoView';
import './index.css';
import InstallPrompt from './components/InstallPrompt'

function App() {
  const [mode, setMode] = useState(null);
  // NOVO: Estado para pré-preencher o código
  const [prefilledCode, setPrefilledCode] = useState(null);

  // NOVO: Efeito para ler a URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      const urlCode = params.get('code');

      if (urlMode === 'aluno') {
        setMode('aluno');
        if (urlCode && /^\d{6}$/.test(urlCode)) {
          setPrefilledCode(urlCode);
        }
        // Limpa a URL para que o usuário possa recarregar a página sem
        // ficar preso no modo aluno.
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error("Erro ao ler parâmetros da URL:", e);
    }
  }, []); // Executa apenas uma vez no carregamento

  return (
    <div className="app-container">
      <InstallPrompt />
      <img src="/image/logo.png" alt="Focally Logo" className='logo' />
      
      {!mode ? (
        <div>
          <div className="mode-selector">
            <button 
              className="mode-button" 
              onClick={() => setMode('professor')}
            >
              Sou Professor
            </button>
            <button 
              className="mode-button" 
              onClick={() => setMode('aluno')}
            >
              Sou Aluno
            </button>
          </div>
        </div>
      ) : (
        <div className="view-container">
          <button 
            className="button button-secondary"
            onClick={() => setMode(null)}
            style={{ marginBottom: '20px' }}
          >
            ← Voltar à Seleção
          </button>
          {mode === 'professor' ? (
            <ProfessorView />
          ) : (
            // MODIFICADO: Passa o código pré-preenchido para AlunoView
            <AlunoView prefilledCode={prefilledCode} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
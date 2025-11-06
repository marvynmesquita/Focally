import { useState } from 'react';
import ProfessorView from './ProfessorView';
import AlunoView from './AlunoView';
import './index.css';

function App() {
  const [mode, setMode] = useState(null);

  return (
    <div className="app-container">
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
          {mode === 'professor' ? <ProfessorView /> : <AlunoView />}
        </div>
      )}
    </div>
  );
}

export default App;


import { QRCodeSVG } from 'qrcode.react';

/**
 * Componente para exibir QR Code do código de sessão
 * @param {string} sessionCode - Código de sessão de 6 dígitos
 */
function QRCodeDisplay({ sessionCode }) {
  if (!sessionCode) return null;

  // NOVO: Obtém a URL base do site e monta a URL de "join"
  const baseUrl = window.location.origin;
  const joinUrl = `${baseUrl}/?mode=aluno&code=${sessionCode}`;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      margin: '20px 0',
      padding: '20px',
      background: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>Código de Sessão</h3>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        letterSpacing: '8px',
        color: '#667eea',
        marginBottom: '20px',
        fontFamily: 'monospace'
      }}>
        {sessionCode}
      </div>
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <QRCodeSVG 
          value={joinUrl} // MODIFICADO: Usa a URL completa
          size={200}
          level="H" // Nível de correção alto, bom para URLs
          includeMargin={true}
        />
      </div>
      <p style={{ 
        marginTop: '15px', 
        fontSize: '14px', 
        color: '#666',
        textAlign: 'center'
      }}>
        Escaneie o QR Code ou digite o código acima
      </p>
    </div>
  );
}

export default QRCodeDisplay;
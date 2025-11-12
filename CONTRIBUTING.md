# 🤝 Guia de Contribuição - Focally

Obrigado por se interessar em contribuir para o Focally! Este guia ajudará você a entender o projeto e como contribuir.

---

## 📚 Começando

### 1. Entenda o Projeto

Antes de começar a codificar, leia:

1. **[README.md](./README.md)** - Visão geral do projeto
2. **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Documentação técnica detalhada
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Diagramas e fluxos visuais
4. **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Como configurar o Firebase

### 2. Configure o Ambiente

```bash
# Clone o repositório
git clone https://github.com/marvynmesquita/Focally.git
cd Focally

# Instale dependências
npm install

# Configure o Firebase (siga FIREBASE_SETUP.md)
# Edite src/firebase/config.js com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
# Acesse http://localhost:4000
```

### 3. Conheça a Estrutura

```
src/
├── App.jsx                    # Componente raiz (seleção de modo)
├── ProfessorView.jsx          # Interface do professor
├── AlunoView.jsx              # Interface do aluno
├── useWebRTC.js               # Hook principal (lógica WebRTC)
├── components/
│   ├── InstallPrompt.jsx      # Banner PWA
│   ├── QRCodeDisplay.jsx      # QR Code
│   └── SessionCodeInput.jsx   # Input com scanner
├── firebase/
│   ├── config.js              # Configuração Firebase
│   └── signaling.js           # Sinalização
└── utils/
    └── sessionCode.js         # Utilidades
```

---

## 🎯 Tipos de Contribuições

### 🐛 Reportar Bugs

Encontrou um bug? Ótimo! Abra uma issue com:

1. **Título descritivo** (ex: "Áudio não conecta em NAT restritivo")
2. **Descrição do problema** (o que aconteceu)
3. **Passos para reproduzir**
4. **Comportamento esperado** vs **comportamento atual**
5. **Ambiente** (navegador, SO, versão do app)
6. **Logs** (console errors, screenshots)

**Exemplo:**
```markdown
## Título: Erro de permissão de microfone no Safari

### Descrição
No Safari iOS, o app não consegue acessar o microfone mesmo após permitir.

### Passos para reproduzir
1. Abrir app em Safari iOS
2. Clicar "Iniciar Transmissão"
3. Permitir acesso ao microfone
4. Microfone não captura áudio

### Esperado
Áudio capturado e transmitido

### Atual
Erro: "NotAllowedError: Permission denied"

### Logs
```
[Error] NotAllowedError: Permission denied
```

### Ambiente
- Safari 17 em iOS 17.2
- iPhone 14 Pro
```

### ✨ Sugerir Melhorias

Tem uma ideia? Compartilhe!

Abra uma issue com:
1. **Título** da feature
2. **Descrição detalhada** do que quer
3. **Por quê** isso seria útil
4. **Como** deveria funcionar

**Exemplo:**
```markdown
## Título: Adicionar controle de ganho de microfone

### Descrição
Permitir que o professor ajuste o ganho (volume) do microfone antes de transmitir.

### Por quê
Alguns microfones capturam muito baixo ou muito alto, dificultando o áudio.

### Funcionalidade esperada
1. Na ProfessorView, após "Iniciar Transmissão"
2. Adicionar slider: "Ganho de Microfone" (0-100)
3. Preview do áudio com ganho aplicado
4. Salvar preferência em localStorage
```

### 💻 Contribuir com Código

#### Antes de começar

1. **Crie uma branch** para sua feature/fix:
   ```bash
   git checkout -b feature/sua-feature
   # ou
   git checkout -b fix/seu-bug
   ```

2. **Faça commits significativos**:
   ```bash
   git add src/components/MeuComponente.jsx
   git commit -m "Adicionar componente MeuComponente"
   ```

3. **Teste suas mudanças**:
   ```bash
   npm run dev      # Verificar funcionamento
   npm run build    # Verificar build
   npm run preview  # Testar em produção
   ```

#### Normas de Código

**JavaScript/React:**
- Use nomes descritivos para variáveis/funções
- Adicione comentários para lógica complexa
- Use `const`/`let`, evite `var`
- Uma função = uma responsabilidade
- Máximo 200 linhas por arquivo (dividir se necessário)

**Exemplo:**
```javascript
// ✅ BOM
const generateSessionCode = () => {
  // Gera número aleatório entre 100000 e 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ❌ EVITAR
const gen = () => Math.floor(Math.random() * 900000 + 100000);
```

**CSS:**
- Use classes significativas
- Prefira Flexbox/Grid ao ao invés de floats
- Mobile-first responsive design
- Evite `!important`

**JSX:**
```jsx
// ✅ BOM - Componente bem estruturado
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Efeito aqui
  }, [prop1]);

  return (
    <div className="my-component">
      <h1>{prop1}</h1>
      {prop2 && <p>{prop2}</p>}
    </div>
  );
}

// ❌ EVITAR - Lógica complexa no JSX
function BadComponent({ data }) {
  return (
    <div>
      {data && data.length > 0 ? (
        data.map((item) => {
          const processed = item.value * 2 + (item.extra || 0);
          return <span key={item.id}>{processed}</span>;
        })
      ) : (
        <span>No data</span>
      )}
    </div>
  );
}
```

---

## 📋 Checklist para Pull Request

Antes de abrir um PR, verifique:

- [ ] **Código testado** - Funciona localmente (`npm run dev`)
- [ ] **Build funciona** - `npm run build` sem erros
- [ ] **Sem warnings** - Console limpo de warnings
- [ ] **Código formatado** - Segue convenções do projeto
- [ ] **Comentários adicionados** - Se lógica é complexa
- [ ] **Documentação atualizada** - Se API ou estrutura mudou
- [ ] **Branch atualizada** - `git pull origin main` antes de push
- [ ] **Commit messages claras** - Descrevem bem a mudança

### Exemplo de bom PR

```markdown
## Título: Adicionar filtro de ruído ao áudio do professor

## Descrição
Implementa Web Audio API para remover ruído de fundo do áudio capturado.

## Tipo de Mudança
- [ ] Bug fix
- [x] Nova funcionalidade
- [ ] Melhoria
- [ ] Documentação

## Como Testar?
1. npm run dev
2. Selecionar "Sou Professor"
3. Clicar "Iniciar Transmissão"
4. Novo slider "Redução de Ruído" aparece
5. Ajustar slider e ouir diferença no aluno

## Screenshots/Videos
[Se aplicável, adicione aqui]

## Notas
- Usa API nativa do navegador (Web Audio API)
- Compatível com todos os navegadores modernos
- Performance: negligenciável (~0.5% CPU)

## Checklist
- [x] Código testado
- [x] Build sem erros
- [x] Documentação atualizada (DOCUMENTATION.md)
- [x] Sem console warnings
```

---

## 🔍 Processo de Review

### O que esperamos

1. **Funcionalidade** - Faz o que promete?
2. **Qualidade** - Código está bem escrito?
3. **Testes** - Testou em múltiplos cenários?
4. **Performance** - Não degrada a app?
5. **Documentação** - Está claro para outros?

### Dicas para melhor review

- **Pequenos PRs** são mais fáceis de revisar (< 400 linhas mudadas)
- **Descrição clara** economiza tempo
- **Screenshots/videos** ajudam a entender mudanças visuais
- **Responda aos comentários** com contexto

---

## 🚀 Ideias Comuns para Contribuir

### 🟢 Fácil (Bom para iniciantes)

- [ ] Melhorar mensagens de erro (mais claras e úteis)
- [ ] Adicionar mais sons de fundo (white noise, brown noise, etc)
- [ ] Melhorar CSS/design (cores, spacing, responsividade)
- [ ] Adicionar comentários ao código
- [ ] Melhorar README com exemplos
- [ ] Corrigir typos ou gramatical

### 🟡 Médio

- [ ] Adicionar temas (light/dark mode)
- [ ] Implementar histórico de sessões
- [ ] Melhorar indicador de qualidade de áudio
- [ ] Adicionar gráfico de latência em tempo real
- [ ] Suportar múltiplos alunos simultaneamente
- [ ] Melhorar tratamento de erro com retry automático

### 🔴 Avançado

- [ ] Implementar criptografia P2P
- [ ] Adicionar suporte a vídeo (além de áudio)
- [ ] Implementar servidor de sinalização alternativo
- [ ] Otimizar WebRTC codec/bitrate
- [ ] Adicionar analytics/observability
- [ ] Implementar suporte a múltiplas salas

---

## 📝 Commit Message Guide

Use este formato para commit messages claras:

```
[tipo]: descrição breve

descrição detalhada (opcional)

closes #123
```

**Tipos:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças de documentação
- `style:` - Formatação, sem mudança lógica
- `refactor:` - Restruturação sem mudança de comportamento
- `perf:` - Melhoria de performance
- `test:` - Adição de testes
- `chore:` - Atualizações de dependências, build, etc

**Exemplos:**
```bash
git commit -m "feat: adicionar filtro de ruído ao áudio"
git commit -m "fix: corrigir timeout de conexão em NAT restritivo"
git commit -m "docs: adicionar diagrama de arquitetura"
git commit -m "refactor: extrair lógica de sinalização para função"
git commit -m "perf: memoizar componente QRCodeDisplay"
```

---

## 🐛 Debugging

### Chrome DevTools

1. **F12** ou **Cmd+Option+I** (Mac)
2. **Application tab**:
   - Service Workers - Ver status do SW
   - Cache Storage - Ver cache do app
   - IndexedDB - Se aplicável
   - Cookies - Session data
3. **Network tab**:
   - Ver requisições HTTP
   - Ver WebSocket connections (se usasse)
   - Simular throttle para testar offline
4. **Console**:
   - Ver logs (adicione `console.log()` no código)
   - Testar API interativamente

### WebRTC Debugging

```javascript
// Adicionar ao code para ver conexão RTC
pc.addEventListener('connectionstatechange', () => {
  console.log('RTC Connection State:', pc.connectionState);
});

pc.addEventListener('iceconnectionstatechange', () => {
  console.log('ICE Connection State:', pc.iceConnectionState);
  console.log('Ice Gathering State:', pc.iceGatheringState);
});

// Ver stats de conexão
pc.getStats().then(report => {
  report.forEach(stats => {
    if (stats.type === 'inbound-rtp' || stats.type === 'outbound-rtp') {
      console.log('RTP Stats:', stats);
    }
  });
});
```

### Firebase Debugging

```bash
# Ativar logs do Firebase
firebase.database.enableLogging(true);
```

Veja console para todas as operações do Firebase Realtime Database.

---

## 📚 Recursos Úteis

- **WebRTC**: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **React Hooks**: https://react.dev/reference/react/hooks
- **Firebase Realtime Database**: https://firebase.google.com/docs/database
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **PWA**: https://web.dev/progressive-web-apps/
- **Vite**: https://vitejs.dev/

---

## 💬 Comunidade

- **Dúvidas?** Abra uma issue com tag `[Pergunta]`
- **Discussões?** Crie uma Discussion no GitHub
- **Chat?** [Se houver um discord/slack, adicione aqui]

---

## 🙏 Agradecimentos

Obrigado por considerar contribuir para o Focally! Suas contribuições fazem a diferença.

Se tiver qualquer dúvida, não hesite em perguntar. Estamos aqui para ajudar! 🚀


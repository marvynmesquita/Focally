# 📚 Documentação Técnica - Focally

Documentação completa da arquitetura, componentes e fluxos do aplicativo Focally.

## 📑 Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Componentes](#componentes)
3. [Hooks Personalizados](#hooks-personalizados)
4. [Firebase & Sinalização](#firebase--sinalização)
5. [Utilitários](#utilitários)
6. [Fluxos de Dados](#fluxos-de-dados)
7. [Configuração do Ambiente](#configuração-do-ambiente)

---

## Arquitetura Geral

### Visão Geral

O Focally é um aplicativo PWA de transmissão de áudio em tempo real construído com:

- **Frontend**: React 18 com Vite
- **Comunicação P2P**: WebRTC (RTCPeerConnection)
- **Sinalização**: Firebase Realtime Database
- **Cache/Offline**: Service Worker + Workbox
- **PWA**: vite-plugin-pwa com manifest e icons

### Fluxo de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│              (Seletor de Modo: Professor/Aluno)             │
└────────────┬──────────────────────────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
    ┌─────────────────────┐          ┌──────────────────┐
    │  ProfessorView.jsx  │          │  AlunoView.jsx   │
    │  (Transmissor)      │          │  (Receptor)      │
    │                     │          │                  │
    │ • Captura áudio     │          │ • Recebe áudio   │
    │ • Gera código       │          │ • Conecta via    │
    │ • Compartilha QR    │          │   código/QR      │
    └──────────┬──────────┘          └────────┬─────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
                    ┌──────────────────────┐
                    │   useWebRTC Hook     │
                    │  (Lógica WebRTC)     │
                    └──────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ RTCPeerC │  │ Firebase │  │  Stream  │
         │Connection│  │ Signaling│  │ Manager  │
         └──────────┘  └──────────┘  └──────────┘
```

---

## Componentes

### `App.jsx`

**Responsabilidade**: Componente raiz da aplicação. Gerencia a seleção de modo e roteamento básico.

**Recursos**:
- Seletor de modo (Professor/Aluno)
- Leitura de parâmetros da URL (`?mode=aluno&code=XXXXXX`)
- Suporte a links compartilháveis (link direto para conectar)
- Exibição do `InstallPrompt` (PWA)

**Props que recebe**:
- Nenhuma (é o componente raiz)

**Estado**:
```javascript
const [mode, setMode] = useState(null);           // null | 'professor' | 'aluno'
const [prefilledCode, setPrefilledCode] = useState(null); // Código da URL para pré-preenchimento
```

**Efeitos**:
- Lê `window.location.search` no mount para extrair parâmetros da URL
- Limpa a URL após ler os parâmetros (para permitir recarregar sem ficar preso no modo)

**Fluxo**:
```
1. Carrega → Lê URL → Se mode=aluno, pré-preenche código
2. Exibe seletor ou view (Professor/Aluno)
3. Limpa parâmetros da URL
```

---

### `ProfessorView.jsx`

**Responsabilidade**: Interface do professor (transmissor). Captura áudio do microfone e transmite via WebRTC.

**Recursos**:
- Botão "Iniciar Transmissão" (solicita acesso ao microfone)
- Exibição de código de sessão de 6 dígitos
- Cópia de código para clipboard
- Exibição de QR Code para compartilhamento
- Indicador de status em tempo real
- Mensagem de erro clara

**Props que recebe**:
- Nenhuma (usa `useWebRTC('professor')` internamente)

**Estado do Hook**:
```javascript
const {
  status,           // String: status atual (Aguardando..., Conectado, etc)
  sessionCode,      // String: código de sessão (ex: "123456")
  error,            // String ou null: mensagem de erro
  isConnected,      // Boolean: true se aluno conectado
  startTransmission // Function: inicia captura e transmissão
} = useWebRTC('professor');
```

**Componentes Usados**:
- `QRCodeDisplay` - Exibe QR Code do código de sessão
- `InstallPrompt` - Banner de instalação PWA (em App.jsx)

**Interface**:
```
┌─────────────────────────────────────┐
│ Modo: Professor (Transmissor)       │
├─────────────────────────────────────┤
│ Status: [Aguardando... / Conectado] │
├─────────────────────────────────────┤
│ [Iniciar Transmissão] (antes)       │
│ OU                                  │
│ Código: 123456                      │
│ [Copiar]                            │
│                                     │
│ [QR Code aqui]                      │
│                                     │
│ "Compartilhe este QR Code..."       │
└─────────────────────────────────────┘
```

**Fluxo**:
```
1. Usuário clica "Iniciar Transmissão"
2. useWebRTC:
   - Solicita acesso ao microfone
   - Captura stream de áudio
   - Cria RTCPeerConnection
   - Gera código de sessão
   - Salva código no localStorage (para reuso)
   - Aguarda conexão de aluno
3. Exibe código e QR Code
4. Quando aluno conecta: status muda para "Conectado" / "Transmitindo"
```

---

### `AlunoView.jsx`

**Responsabilidade**: Interface do aluno (receptor). Recebe áudio via WebRTC e oferece controles.

**Recursos**:
- Input para código de sessão (digitação manual)
- Scanner de QR Code
- Pré-preenchimento de código (via URL ou prop)
- Seletor de som de fundo (onda sonora)
- Controles de volume (professor + onda sonora)
- Indicador de status em tempo real
- Mensagens de erro

**Props que recebe**:
```javascript
prefilledCode // String: código já preenchido (via URL)
```

**Estado Local**:
```javascript
const [professorVolume, setProfessorVolume] = useState(1);     // 0-1 (0% a 100%)
const [soundWaveVolume, setSoundWaveVolume] = useState(0.2);   // 0-1 (0% a 100%)
const [selectedSound, setSelectedSound] = useState('');        // '' | 'white_noise' | 'brown_noise' | etc
```

**Refs**:
```javascript
const professorAudioRef = useRef(null);    // <audio> element para professor
const soundWaveAudioRef = useRef(null);    // <audio> element para onda sonora
```

**Componentes Usados**:
- `SessionCodeInput` - Input com scanner QR + validação

**Interface**:
```
┌─────────────────────────────────────┐
│ Modo: Aluno (Receptor)              │
├─────────────────────────────────────┤
│ Status: [Aguardando / Conectado]    │
├─────────────────────────────────────┤
│ Código: [123456] [Copiar] [QR]      │
│ [Conectar]                          │
├─────────────────────────────────────┤
│ Professor Volume: ▬▬▬▬────           │ 75%
│ Onda Sonora: ▬▬────────             │ 20%
│ Som: [Selecione...] [▼]             │
└─────────────────────────────────────┘
```

**Áudio**:
```html
<!-- Não é exibido visualmente, apenas toca -->
<audio ref={professorAudioRef} autoPlay />
<audio ref={soundWaveAudioRef} loop />
```

**Fluxo**:
```
1. Usuário digita ou escaneia código (via SessionCodeInput)
2. Clica "Conectar"
3. useWebRTC:
   - Cria RTCPeerConnection
   - Conecta ao Firebase com código
   - Aguarda offer do professor
   - Envia answer
   - Estabelece conexão P2P
   - Recebe stream de áudio
4. Audio element conectado a remoteStream
5. Status muda para "Conectado"
6. Usuário pode:
   - Ajustar volume do professor
   - Selecionar e ajustar volume da onda sonora
```

---

### `InstallPrompt.jsx`

**Responsabilidade**: Banner de instalação PWA. Aparece em navegadores compatíveis com beforeinstallprompt.

**Props que recebe**:
- Nenhuma

**Estado**:
```javascript
const [canInstall, setCanInstall] = useState(false);
const [deferredPrompt, setDeferredPrompt] = useState(null);
```

**Eventos Escutados**:
- `beforeinstallprompt` - Disparado quando o app pode ser instalado

**Interface**:
```
┌─────────────────────────────────────┐
│ 📲 Instalar Focally                 │
│ Acesso rápido na sua tela inicial   │
│ [Instalar] [Fechar]                 │
└─────────────────────────────────────┘
(posicionado fixed bottom, z-index: 1000)
```

---

### `QRCodeDisplay.jsx`

**Responsabilidade**: Renderiza QR Code do código de sessão.

**Props que recebe**:
```javascript
sessionCode // String: código de sessão (ex: "123456")
```

**Funcionalidade**:
- Monta URL de "join": `${baseUrl}/?mode=aluno&code=${sessionCode}`
- Renderiza QR Code SVG (usando `qrcode.react`)
- Nível de correção: Alto (H) - bom para URLs longas

**QR Code Gerado**:
```
Quando sessionCode = "123456"
URL codificada: https://focally.onrender.com/?mode=aluno&code=123456

┌─────────────────┐
│ ▀▀▀ ▄▄▄ ▀▀▀    │
│ █   █░█   █    │
│ █   ▄▄▄   █    │
│ ▀▀▀ ▀▀▀ ▀▀▀    │
└─────────────────┘
```

---

### `SessionCodeInput.jsx`

**Responsabilidade**: Input com validação, suporte a scanner de QR Code.

**Props que recebe**:
```javascript
onConnect // Function(code): chamada quando código é validado
disabled  // Boolean: desabilita o input/botões
initialCode // String: código inicial para pré-preenchimento
```

**Estado Local**:
```javascript
const [code, setCode] = useState(initialCode);
const [showQRScanner, setShowQRScanner] = useState(false);
const [error, setError] = useState('');
```

**Componentes Usados**:
- `Html5QrcodeScanner` (html5-qrcode library) - Scanner de QR Code via câmera

**Interface**:
```
┌─────────────────────────────────────┐
│ Código de Sessão:                   │
│ [      123456      ] [Colar] [QR▼] │
├─────────────────────────────────────┤
│ [Conectar]                          │
│                                     │
│ (Ou clique QR para escanear)        │
│                                     │
│ ┌─────────────────────────┐         │
│ │  📷 Câmera               │ <- se QR ativo
│ │   (mostra câmera)      │         │
│ └─────────────────────────┘         │
└─────────────────────────────────────┘
```

**Validação**:
- Aceita apenas 6 dígitos numéricos
- QR Code pode conter URL completa ou apenas código
- Extrai código automaticamente de URLs

**Fluxo do Scanner**:
```
1. Usuário clica botão QR
2. Solicita acesso à câmera
3. Html5QrcodeScanner inicia
4. Detecta QR Code
5. Extrai URL ou código
6. Valida (6 dígitos)
7. Chama onConnect(code)
8. Input preenchido com código
```

---

## Hooks Personalizados

### `useWebRTC(mode)`

**Responsabilidade**: Gerencia toda a lógica de conexão WebRTC, sinalização e streams.

**Importação**:
```javascript
import { useWebRTC } from './useWebRTC';
```

**Uso**:
```javascript
const {
  status,
  sessionCode,
  error,
  isConnected,
  remoteStream,
  connectWithSessionCode,
  startTransmission,
  cleanup
} = useWebRTC('professor' | 'aluno');
```

**Parâmetro**:
- `mode: string` - `'professor'` ou `'aluno'`

**Retorno**:

| Propriedade | Tipo | Descrição |
|-----------|------|-----------|
| `status` | String | Status atual (ex: "Aguardando...", "Conectado") |
| `sessionCode` | String | Código de sessão de 6 dígitos |
| `error` | String\|null | Mensagem de erro (se houver) |
| `isConnected` | Boolean | True se P2P conectado |
| `remoteStream` | MediaStream\|null | Stream de áudio remoto (aluno only) |
| `connectWithSessionCode(code)` | Function | Conecta com código (aluno only) |
| `startTransmission()` | Function | Inicia captura de microfone (professor only) |
| `cleanup()` | Function | Limpa recursos (streams, conexões, listeners) |

**Funcionamento Interno**:

#### Para Professor:
```
1. startTransmission() chamado
   ├─ getUserMedia() solicita acesso ao microfone
   ├─ Captura stream de áudio
   ├─ Cria sessionCode randomizado
   ├─ Salva em localStorage
   ├─ createSession() no Firebase
   └─ Aguarda offers de alunos

2. Quando aluno envia offer (via Firebase)
   ├─ Cria RTCPeerConnection para cada aluno
   ├─ Adiciona track de áudio à conexão
   ├─ setRemoteDescription(offer)
   ├─ createAnswer()
   └─ sendAnswer() no Firebase

3. Aguarda candidates (ICE)
   ├─ Recebe candidate do aluno
   └─ addIceCandidate(candidate)

4. Quando ICE conectado
   ├─ Status: "Transmitindo"
   ├─ isConnected: true
   └─ Transmite áudio continuamente
```

#### Para Aluno:
```
1. connectWithSessionCode(code) chamado
   ├─ Valida código (6 dígitos)
   ├─ Cria RTCPeerConnection
   ├─ listenForOffers() no Firebase
   └─ Aguarda offer do professor

2. Quando offer recebido (via Firebase)
   ├─ setRemoteDescription(offer)
   ├─ createAnswer()
   ├─ sendAnswer() no Firebase
   └─ listenForAnswerCandidates()

3. Recebe candidates e ontrack
   ├─ ontrack: recebe stream de áudio
   ├─ remoteStream atualizado
   ├─ Status: "Conectado"
   └─ isConnected: true

4. áudio reproduzido via <audio srcObject={remoteStream} />
```

**Configuração RTC**:
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },      // Google STUN
    { urls: 'stun:stun1.l.google.com:19302' },     // Google STUN
    { urls: 'stun:stun.relay.metered.ca:80' },     // Metered STUN
    // Múltiplos servidores TURN para NAT/Firewall
    { urls: "turn:...", username: "...", credential: "..." },
    // ...
  ]
}
```

**Storage**:
- Professor: `localStorage.getItem('focally_session_code')` - reutiliza código se recarregar
- Aluno: Não usa localStorage (sempre começa novo)

**Limpeza**:
- `cleanup()` deve ser chamada no `useEffect` de desmontagem
- Para professor: para stream, fecha conexões P2P, deleta dados no Firebase
- Para aluno: para stream, fecha conexão P2P, desinscreve listeners

---

## Firebase & Sinalização

### Estrutura do Realtime Database

```
focally-root/
├── sessions/
│   ├── "123456"/                 # Código de sessão
│   │   ├── professorId: "prof_xxx"
│   │   ├── status: "active"
│   │   ├── createdAt: 1699776000000
│   │   └── offers/
│   │       └── "student_yyy": { ... offer SDP ... }
│   │
│   └── "654321"/
│       └── ...
│
├── offers/
│   └── "123456/student_yyy":     # Offer do aluno
│       ├── type: "offer"
│       ├── sdp: "v=0\no=..."
│       └── candidates: []
│
├── answers/
│   └── "123456/student_yyy":     # Answer do professor
│       ├── type: "answer"
│       ├── sdp: "v=0\no=..."
│       └── candidates: []
│
└── candidates/
    └── "123456/student_yyy":     # ICE Candidates
        └── [{ candidate: "...", ... }, ...]
```

### Funções de Sinalização (`src/firebase/signaling.js`)

#### `createSession(sessionCode)`
**Descrição**: Cria uma nova sessão no Firebase para o professor

```javascript
// Escreve:
// sessions/{sessionCode}/professorId = current_user_id
// sessions/{sessionCode}/status = "active"
```

#### `sendOffer(sessionCode, studentId, offer)`
**Descrição**: Envia offer do aluno para o Firebase

```javascript
// Escreve:
// offers/{sessionCode}/{studentId} = {
//   type: "offer",
//   sdp: offer.sdp,
//   candidates: []
// }
```

#### `listenForAnswer(sessionCode, studentId, callback)`
**Descrição**: Aguarda answer do professor (aluno)

```javascript
// Lê:
// answers/{sessionCode}/{studentId}
// Chama callback quando disponível
```

#### `listenForOffers(sessionCode, callback)`
**Descrição**: Aguarda offers de alunos (professor)

```javascript
// Lê:
// offers/{sessionCode}/*
// Chama callback para cada novo offer
```

#### `sendAnswer(sessionCode, studentId, answer)`
**Descrição**: Envia answer do professor para o Firebase

```javascript
// Escreve:
// answers/{sessionCode}/{studentId} = {
//   type: "answer",
//   sdp: answer.sdp,
//   candidates: []
// }
```

#### `cleanupSession(sessionCode)`
**Descrição**: Deleta sessão do Firebase (professor desconecta)

```javascript
// Deleta:
// sessions/{sessionCode}
// offers/{sessionCode}/*
// answers/{sessionCode}/*
```

---

## Utilitários

### `sessionCode.js`

#### `generateSessionCode()`
```javascript
/**
 * Gera um código de sessão de 6 dígitos aleatório
 * @returns {string} Ex: "123456"
 */
export const generateSessionCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

**Alcance**: 100000 até 999999 (1 milhão de códigos possíveis)

#### `validateSessionCode(code)`
```javascript
/**
 * Valida se uma string é um código de sessão válido
 * @param {string} code - Código a validar
 * @returns {boolean} True se válido (6 dígitos numéricos)
 */
export const validateSessionCode = (code) => {
  return /^\d{6}$/.test(code);
};
```

**Regex**: `/^\d{6}$/` - Exatamente 6 dígitos

---

## Fluxos de Dados

### Fluxo de Transmissão (Professor → Aluno)

```
Professor                          Firebase                         Aluno
   │                                  │                               │
   ├─ Clica "Iniciar"                │                               │
   ├─ Solicita acesso microfone      │                               │
   ├─ Captura stream                 │                               │
   ├─ Gera código (ex: "123456")     │                               │
   ├─ Cria RTCPeerConnection         │                               │
   │                                  ├─ createSession("123456")     │
   │                                  │                               │
   │                      ◄──────────────────────────────────────────┤ Digita/Escaneia "123456"
   │                                  │                               │
   │  ◄─────────── listenForOffers────┤                               │
   │                                  │                               ├─ connectWithSessionCode()
   │                                  │                               ├─ Cria RTCPeerConnection
   │                                  │                               ├─ createOffer()
   │                                  │                               │
   │                      ◄────────────────────── sendOffer ◄────────┤
   │                                  │                               │
   ├─ Recebe offer                   │                               │
   ├─ setRemoteDescription(offer)    │                               │
   ├─ createAnswer()                 │                               │
   │                                  │                               │
   ├──────────── sendAnswer ─────────────────────────────► │
   │                                  │                               ├─ Recebe answer
   │                                  │                               ├─ setRemoteDescription()
   │                                  │                               │
   │ ◄─────────── ICE Candidates ────────────► │
   │ (simultâneo, via Firebase)      │                               │
   │                                  │                               │
   │  (Quando ICE conectado)          │                  (Quando ICE conectado)
   │ ┌─────────────────────────────────────────────────────────┐
   │ │             Conexão P2P Estabelecida!                  │
   │ │  (Audio tracks fluem diretamente entre peers)          │
   │ └─────────────────────────────────────────────────────────┘
   │                                  │                               │
   ├─ addTrack(audioTrack)           │                               │
   │  ◄────────────────────────────────────────────────────────────┤ ontrack: recebe stream
   │                                  │                               │
   │  Transmitindo áudio... ─────────────────────────────────────────► Reproduzindo áudio
```

### Ciclo de Vida - Professor

```
1. CARREGAMENTO
   └─ ProfessorView renderizado
   └─ useWebRTC('professor') criado

2. AGUARDANDO CONEXÃO
   ├─ sessionCode vazio
   ├─ status: "Aguardando..."
   └─ Aguarda clique em "Iniciar Transmissão"

3. TRANSMISSÃO INICIADA
   ├─ startTransmission() chamado
   ├─ getUserMedia() solicitado
   ├─ status: "Solicitando acesso..."
   └─ Usuário permite/nega acesso

4. STREAM CAPTURADO
   ├─ status: "Conectado"
   ├─ sessionCode gerado
   ├─ Salvo em localStorage
   ├─ Firebase: createSession()
   ├─ RTCPeerConnection criada
   ├─ Audio track adicionada
   └─ Aguardando aluno conectar

5. ALUNO CONECTADO
   ├─ Offer recebido
   ├─ Answer criada e enviada
   ├─ ICE conectando...
   ├─ status: "Transmitindo"
   ├─ isConnected: true
   └─ Áudio transmitindo

6. DESCONEXÃO
   ├─ Usuário sai ou recarrega
   ├─ useEffect cleanup() executado
   ├─ Streams pausadas/paradas
   ├─ RTCPeerConnection fechada
   ├─ Firebase: cleanupSession()
   └─ LocalStorage: código deletado
```

### Ciclo de Vida - Aluno

```
1. CARREGAMENTO
   └─ AlunoView renderizado
   └─ useWebRTC('aluno') criado

2. AGUARDANDO CÓDIGO
   ├─ SessionCodeInput exibido
   ├─ status: "Aguardando..."
   └─ Pré-preenchido se vindo de URL/QR

3. CÓDIGO INSERIDO
   ├─ connectWithSessionCode(code) chamado
   ├─ Validação: /^\d{6}$/
   ├─ RTCPeerConnection criada
   ├─ createOffer() chamado
   ├─ sendOffer() ao Firebase
   └─ status: "Conectando..."

4. AGUARDANDO ANSWER
   ├─ listenForAnswer() escutando Firebase
   ├─ ICE candidates sendo coletados
   └─ ontrack aguardando...

5. CONECTADO
   ├─ Answer recebida
   ├─ setRemoteDescription(answer)
   ├─ ICE conectado
   ├─ ontrack: remoteStream atualizado
   ├─ status: "Conectado"
   ├─ isConnected: true
   └─ Áudio começando a tocar

6. REPRODUZINDO
   ├─ <audio srcObject={remoteStream} autoPlay />
   ├─ Usuário pode controlar volume
   ├─ Pode selecionar som de fundo
   └─ Áudio contínuo do professor

7. DESCONEXÃO
   ├─ Usuário sai ou recarrega
   ├─ useEffect cleanup() executado
   ├─ Streams pausadas/paradas
   ├─ RTCPeerConnection fechada
   └─ Listeners desinscritos
```

---

## Configuração do Ambiente

### Variáveis de Ambiente

#### Porta do Dev Server
```bash
# Via variável de ambiente
PORT=3000 npm run dev

# Ou via .env na raiz
echo "PORT=3000" > .env
npm run dev
```

#### Firebase (Obrigatório)
Edite `src/firebase/config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID",
};
```

Siga [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para instruções completas.

### Dependências Principais

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.14.1",
    "qrcode.react": "^1.0.1",
    "html5-qrcode": "^2.3.4"
  },
  "devDependencies": {
    "vite": "^5.4.21",
    "@vitejs/plugin-react": "^4.0.0",
    "vite-plugin-pwa": "^1.1.0"
  }
}
```

### Scripts NPM

```bash
# Desenvolvimento
npm run dev                # Inicia dev server em localhost:4000

# Build
npm run build              # Cria dist/ para produção

# Produção Local
npm run preview            # Serve dist/ em localhost:4000
npm start                  # Alias para preview

# Validação
npm run type-check         # TypeScript check (se configurado)
```

### Estrutura de Pastas

```
Focally/
├── src/
│   ├── App.jsx                      # Componente raiz
│   ├── ProfessorView.jsx            # Interface professor
│   ├── AlunoView.jsx                # Interface aluno
│   ├── useWebRTC.js                 # Hook WebRTC
│   ├── index.css                    # Estilos globais
│   ├── main.jsx                     # Ponto de entrada React
│   ├── components/
│   │   ├── InstallPrompt.jsx        # Banner PWA
│   │   ├── QRCodeDisplay.jsx        # Exibe QR Code
│   │   └── SessionCodeInput.jsx     # Input com scanner
│   ├── firebase/
│   │   ├── config.js                # Configuração Firebase
│   │   └── signaling.js             # Funções de sinalização
│   └── utils/
│       └── sessionCode.js           # Utilitários de código
├── public/
│   ├── manifest.webmanifest         # PWA manifest
│   ├── image/
│   │   ├── logo.png                 # Logo original
│   │   ├── logo-192.png             # Icon PWA
│   │   ├── logo-512.png             # Icon PWA
│   │   ├── screenshot-wide.png      # Screenshot PWA
│   │   └── screenshot-narrow.png    # Screenshot PWA
│   └── audio/
│       ├── white_noise.mp3          # Som de fundo
│       └── brown_noise.mp3          # Som de fundo
├── index.html                       # HTML raiz
├── vite.config.js                   # Configuração Vite + PWA
├── package.json                     # Dependências
├── README.md                        # Documentação geral
├── DOCUMENTATION.md                 # Esta documentação
├── FIREBASE_SETUP.md                # Setup do Firebase
└── dist/                            # Build (após npm run build)
```

---

## Troubleshooting

### Problema: Firebase não configurado
**Solução**: Siga [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) e edite `src/firebase/config.js`

### Problema: Microfone não funciona
**Solução**: 
- Verificar permissões do navegador
- Usar HTTPS (exceto localhost)
- Testar em outro navegador

### Problema: Aluno não conecta
**Solução**:
- Verificar código de sessão (6 dígitos)
- Firebase estar ativo e Firebase Realtime Database criada
- Ambos na mesma rede (pode ter problemas em NAT estrito)
- Tentar adicionar servidores TURN em `useWebRTC.js`

### Problema: Áudio atrasado
**Solução**:
- Latência normal é 100-300ms
- Se > 500ms, pode ser problema de rede
- Tentar servidor TURN diferente

### Problema: Service Worker interferindo em dev
**Solução**:
- DevTools → Application → Service Workers → Unregister
- Limpar Cache Storage
- `npm run dev` desregistra automaticamente em modo DEV

---

## Licença

Projeto MVPeducacional. Veja LICENSE para detalhes.


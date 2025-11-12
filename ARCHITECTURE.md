# 🏗️ Arquitetura do Focally - Guia Visual

Guia visual da arquitetura, fluxos de dados e componentes do Focally.

---

## 1️⃣ Visão Geral da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                      FOCALLY - PWA                              │
│              (Progressive Web App com React + WebRTC)           │
└─────────────────────────────────────────────────────────────────┘

                         App.jsx
                           │
                    ┌──────┴──────┐
                    │             │
              ProfessorView    AlunoView
              (Transmissor)   (Receptor)
                    │             │
                    └──────┬──────┘
                           │
                    useWebRTC Hook
                (Gerencia WebRTC + Firebase)
                           │
                ┌──────────┼──────────┐
                │          │          │
            RTCPeerC    Firebase    MediaStream
            onnection   Signaling   Management
```

---

## 2️⃣ Stack Tecnológico

```
┌────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                  │
│                                                             │
│  React 18 Components (JSX):                               │
│  ├─ App.jsx (Seleção de modo)                             │
│  ├─ ProfessorView.jsx (Interface professor)               │
│  ├─ AlunoView.jsx (Interface aluno)                       │
│  ├─ InstallPrompt.jsx (PWA banner)                        │
│  ├─ QRCodeDisplay.jsx (QR Code)                           │
│  └─ SessionCodeInput.jsx (Input com scanner)              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    CAMADA DE LÓGICA                        │
│                                                             │
│  Hooks e Utilitários:                                     │
│  ├─ useWebRTC.js (Gerenciamento WebRTC)                  │
│  ├─ sessionCode.js (Geração/validação de códigos)        │
│  └─ firebase/signaling.js (Sinalização via Firebase)     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    CAMADA DE REDE                          │
│                                                             │
│  Protocolos e Serviços:                                   │
│  ├─ WebRTC (P2P - Áudio em tempo real)                   │
│  ├─ Firebase Realtime Database (Sinalização)             │
│  ├─ HTTP/HTTPS (Assets, manifest)                        │
│  └─ Service Worker (Offline, cache)                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    FERRAMENTAS & BUILD                      │
│                                                             │
│  ├─ Vite 5.4 (Build tool, dev server)                    │
│  ├─ vite-plugin-pwa (PWA generation)                     │
│  ├─ Workbox (Service Worker, cache strategies)           │
│  └─ npm (Package manager)                                │
└────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Fluxo de Transmissão (Professor → Aluno)

### Timeline Completa

```
TEMPO ┃ PROFESSOR                      ┃ FIREBASE                ┃ ALUNO
──────╋────────────────────────────────╋───────────────────────╋──────────────────────
  T0  ┃ Clica "Iniciar"                ┃                       ┃
      ┃ getUserMedia() solicitado      ┃                       ┃
      ┃ ❌ Usuário nega acesso         ┃                       ┃
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T1  ┃ ✅ Acesso concedido            ┃                       ┃
      ┃ stream = {audio track}         ┃                       ┃
      ┃ status = "Conectando"          ┃                       ┃
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T2  ┃ sessionCode = "123456"         ┃                       ┃
      ┃ localStorage.set(code)         ┃                       ┃
      ┃ Exibe QR Code e código        ┃ createSession()       ┃
      ┃                                ├──────────────────────► │
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
      ┃ RTCPeerConnection criada       ┃                       ┃
      ┃ addTrack(audioStream)          ┃                       ┃
      ┃ listenForOffers("123456")      ┃                       ┃
      ┃ status = "Aguardando aluno"    ┃                       ┃
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T3  ┃                                ┃                       ┃ Input: "123456"
      ┃                                ┃                       ┃ Clica "Conectar"
      ┃                                ┃                       ┃ RTCPeerConnection criada
      ┃                                ┃                       ┃ createOffer()
      ┃                                ┃                       ├──────────────────────►
      ┃                                ┃ sendOffer()           ┃
      ┃                                ◄──────────────────────┤
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T4  ┃ Offer recebida                 ┃                       ┃
      ┃ setRemoteDescription(offer)    ┃                       ┃
      ┃ createAnswer()                 ┃                       ┃
      ┃ sendAnswer()                   ┃                       ┃
      ┃                                ├──────────────────────► │
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
      ┃                                ┃                       ┃ Answer recebida
      ┃                                ┃                       ┃ setRemoteDescription()
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T5  ┃ ICE Candidates trocados        ┃ Candidates           ┃
      ┃ (simultaneamente)              ┃ (Ambas direções)     ┃
      ┃ ◄────────────────────────────────────────────────────► │
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T6  ┃ ICE: connected                 ┃                       ┃ ICE: connected
      ┃ status = "Transmitindo"        ┃                       ┃ status = "Conectado"
      ┃ isConnected = true             ┃                       ┃ isConnected = true
──────┼────────────────────────────────┼───────────────────────┼──────────────────────
  T7  ┃ 🎤 Áudio transmitindo          ┃                       ┃ 🔊 Áudio recebendo
      ┃ (P2P Direct)                   ┃                       ┃ (P2P Direct)
      ┃ ════════════════════════════════════════════════════════════
      ┃ Áudio de alta qualidade, baixa latência (100-300ms)
      ┃
  T8  ┃ Usuário sai                    ┃                       ┃
      ┃ cleanup()                      ┃ cleanupSession()      ┃
      ├────────────────────────────────┼───────────────────────┤
      ┃ RTCPeerConnection fechada      ┃ Deleta dados          ┃ Conexão fechada
      ┃ localStorage.remove(code)      ┃ Listeners removidos   ┃
```

---

## 4️⃣ Estrutura de Dados no Firebase

```
focally-root (Realtime Database)
│
├── 📁 sessions/
│   └── "123456"/                    ← Código de sessão
│       ├── professorId: "prof_abc123"
│       ├── status: "active"
│       └── createdAt: 1699776000000
│
├── 📁 offers/
│   └── "123456"/                    ← Offers por código
│       └── "student_xyz"/            ← ID do aluno
│           ├── type: "offer"
│           ├── sdp: "v=0\no=- 12345..."
│           └── candidates: [
│               { candidate: "...", ... },
│               { candidate: "...", ... }
│           ]
│
├── 📁 answers/
│   └── "123456"/                    ← Answers por código
│       └── "student_xyz"/            ← ID do aluno
│           ├── type: "answer"
│           ├── sdp: "v=0\no=- 67890..."
│           └── candidates: [...]
│
└── 📁 candidates/
    └── "123456"/
        └── "student_xyz": [...]     ← ICE Candidates
```

---

## 5️⃣ Estado do useWebRTC Hook

```
┌─────────────────────────────────────────────────────┐
│         useWebRTC(mode) - Estado Interno             │
└─────────────────────────────────────────────────────┘

Estado React (useState):
├─ sessionCode: string           # "123456" ou ""
├─ error: string | null          # Mensagem de erro
├─ isConnected: boolean          # true se P2P conectado
├─ status: string                # "Aguardando...", "Conectado", etc
└─ (remoteStream: só aluno)      # MediaStream de áudio

Referências (useRef):
├─ peerConnectionRef             # RTCPeerConnection (aluno)
├─ peerConnectionsRef (Map)      # RTCPeerConnection[] (professor)
├─ localStreamRef                # MediaStream (áudio capturado)
├─ remoteStreamRef               # MediaStream (áudio remoto - aluno)
├─ sessionCodeRef                # Cópia do sessionCode
├─ unsubscribeRef                # Função para desinscrever Firebase
└─ studentIdRef                  # ID do aluno (aluno only)

Callbacks:
├─ startTransmission()           # Professor: inicia captura
├─ connectWithSessionCode(code)  # Aluno: conecta com código
├─ handleOffer(offer, studentId) # Professor: recebe offer
├─ handleAnswer(answer)          # Aluno: recebe answer
├─ handleCandidate(candidate)    # Ambos: recebem ICE candidate
└─ cleanup()                     # Ambos: limpa recursos
```

---

## 6️⃣ Ciclo de Vida de um Componente View

```
PROFESSOR VIEW                          ALUNO VIEW
─────────────────────────────────────────────────────────

1. MONTAGEM (mount)
   ├─ useWebRTC('professor')           useWebRTC('aluno')
   ├─ status: "Aguardando..."          status: "Aguardando..."
   ├─ sessionCode: null                sessionCode: null
   └─ isConnected: false               isConnected: false

2. USUÁRIO INTERAGE
   ├─ Clica "Iniciar"          Digita/Escaneia "123456"
   ├─ startTransmission()              connectWithSessionCode()

3. PROCESSAMENTO
   ├─ getUserMedia()                   createOffer()
   ├─ sessionCode gerado               sendOffer()
   ├─ RTCPeerConnection criada         Aguarda answer

4. SINALIZAÇÃO
   ├─ listenForOffers()                setRemoteDescription()
   ├─ Aguarda aluno                    Aguarda professor

5. CONEXÃO
   ├─ Offer recebida                   Answer recebida
   ├─ Answer criada                    ICE conectando...
   ├─ ICE trocado                      ontrack: stream recebido

6. ATIVO
   ├─ Transmitindo áudio        ✅      Reproduzindo áudio
   ├─ status: "Conectado"              status: "Conectado"
   └─ isConnected: true                isConnected: true

7. DESMONTAGEM (unmount)
   ├─ cleanup() chamado
   ├─ Streams paradas
   ├─ RTCPeerConnection fechada
   ├─ Firebase listeners removidos
   └─ Estado resetado
```

---

## 7️⃣ Fluxo de PWA (Service Worker)

```
┌──────────────────────────────────────────────────┐
│          SERVICE WORKER & PWA LIFECYCLE          │
└──────────────────────────────────────────────────┘

INSTALAÇÃO
   │
   ├─ 1. Navegador detecta manifest.webmanifest
   ├─ 2. Valida ícones, screenshots, metadados
   ├─ 3. Service Worker registrado (sw.js)
   ├─ 4. Workbox precache assets
   └─ ✅ App pronto para instalação

PRIMEIRA VISITA
   │
   ├─ 1. Service Worker instala
   ├─ 2. Precache lista (7 arquivos, 761 KiB)
   ├─ 3. Aguarda activação
   └─ ✅ Cache preparado

SEGUNDA VISITA (e subsequentes)
   │
   ├─ 1. SW ativo: intercepta requisições
   ├─ 2. Estratégias de cache:
   │   ├─ /audio/* → Cache First (30 dias)
   │   ├─ /image/* → Cache First (30 dias)
   │   ├─ /api/* → Network First (1 dia)
   │   └─ index.html → Network First
   ├─ 3. Offline: usa cache
   ├─ 4. Online: atualiza cache
   └─ ✅ App funciona offline

AUTO-UPDATE
   │
   ├─ 1. Novo build detectado
   ├─ 2. Nova versão do SW baixada
   ├─ 3. SW waits (standby)
   ├─ 4. Usuário recarrega página
   ├─ 5. Ativa nova versão
   └─ ✅ App atualizado com novo cache

INSTALAÇÃO NO DISPOSITIVO
   │
   ├─ 1. beforeinstallprompt disparado
   ├─ 2. Banner: "Instalar Focally?" (InstallPrompt.jsx)
   ├─ 3. Usuário clica "Instalar"
   ├─ 4. App adicionado à tela inicial / drawer
   ├─ 5. Ícone e nome exibidos
   └─ ✅ App instalado como app nativo

OFFLINE
   │
   ├─ Rede indisponível
   ├─ Service Worker: intercepta requisições
   ├─ Cache hit: serve do cache
   ├─ Cache miss: mostra erro
   └─ ✅ Funcionalidade parcial offline
```

---

## 8️⃣ Componentes e Suas Responsabilidades

```
APP.JSX (Raiz)
├─ Responsabilidade: Seleção de modo, roteamento básico
├─ State: mode, prefilledCode
├─ Filhos: ProfessorView, AlunoView, InstallPrompt
└─ Ciclo: Lê URL → Seleção → View → Volta

   PROFESSORVIEW
   ├─ Responsabilidade: Interface de transmissão
   ├─ Hooks: useWebRTC('professor')
   ├─ Filhos: QRCodeDisplay
   ├─ UI: Botão iniciar, código, QR, status
   └─ Fluxo: Iniciar → Capturar → Aguardar → Transmitir

   ALUNOVIEW
   ├─ Responsabilidade: Interface de recepção
   ├─ Hooks: useWebRTC('aluno')
   ├─ Filhos: SessionCodeInput
   ├─ State: Volume professor, volume som, seleção som
   ├─ UI: Input código, scanner QR, sliders volume, seletor som
   └─ Fluxo: Conectar → Receber → Reproduzir

      INSTALLPROMPT (PWA Banner)
      ├─ Responsabilidade: Prompt de instalação
      ├─ Evento: beforeinstallprompt
      ├─ UI: Banner fixo + botões
      └─ Ação: Instala app no dispositivo

      QRCODEDISPLAY
      ├─ Responsabilidade: Renderizar QR Code
      ├─ Input: sessionCode
      ├─ URL: ${baseUrl}/?mode=aluno&code=${code}
      └─ Output: QR SVG renderizado

      SESSIONCODEINPUT
      ├─ Responsabilidade: Input com validação + scanner
      ├─ State: code, showQRScanner, error
      ├─ Validation: /^\d{6}$/
      ├─ Scanner: Html5QrcodeScanner
      └─ Callback: onConnect(code)
```

---

## 9️⃣ Matriz de Comunicação

```
               Professor           Firebase            Aluno
          ──────────────────────────────────────────────────────
Iniciar  │     START                  │                │
Sessão   │ generateCode()             │                │
         │ createSession()──────────────────►          │
         │                            │                │
Aguardar │                            │                │
Offer    │ listenForOffers() ◄────────┼────────────────┤ sendOffer()
         │                            │                │
Enviar   │ createAnswer()             │                │
Answer   │ sendAnswer()──────────────────────►         │
         │                            │ receive ───────┤
         │                            │                │
ICE      │ addIceCandidate()◄────────────────────────► addIceCandidate()
Cand.    │ (Trocados via Firebase)    │                │
         │                            │                │
Áudio    │◄───────────────────────────────────────────►│
         │    Direto P2P (sem Firebase)                │
         │    100-300ms latência                       │
         │                            │                │
Fechar   │ cleanup()                  │                │
Sessão   │ cleanupSession()───────────┼──────────────► cleanup()
         │                            │                │
```

---

## 🔟 Fluxo de Desenvolvimento

```
Editar código (src/)
        ↓
npm run dev
        ↓
Vite compila + hot reload
        ↓
Service Worker desregistrado em DEV
        ↓
Testa localmente
        ↓
Tudo bem? → npm run build
        ↓
Produção build (dist/)
        ↓
Valida no npm run preview
        ↓
Push para git
        ↓
Render/Deploy detecta
        ↓
Build em produção
        ↓
✅ Live em https://focally.onrender.com
```

---

## 📝 Diagrama de Sequência - Conexão Completa

```
Professor           App             Firebase        Browser        Aluno
   │                │                  │               │             │
   ├──"Iniciar"────────────────────────┤               │             │
   │                │                  │               │             │
   ├─ getUserMedia()│                  │               │             │
   │                ├─ solicita microfone             │             │
   │                │◄──────────────────────── SIM ────┤             │
   │                │                  │               │             │
   │                ├─ sessionCode="123456"            │             │
   │                ├─────────────────────► createSession()         │
   │                │                  │               │             │
   │                ├─ listenForOffers()              │             │
   │                │◄───────────────────┤             │             │
   │                │                  │               │  "conectar"│
   │                │                  │               │◄────────────┤
   │                │                  │               │             │
   │                │                  │  ◄────sendOffer()          │
   │                │◄─────────────────────────────────┤             │
   │                │                  │               │             │
   ├─ createAnswer()                    │               │             │
   ├──────────────────────sendAnswer()──────────────────┤             │
   │                │                  │               ├─setRemoteDescription()
   │                │                  │               │             │
   │─ ICE Cand. ───────────────────────────────────────────► ICE Cand.
   │                │                  │               │             │
   │                │                  │ (Trocados via Firebase)    │
   │                │                  │               │             │
   │ (ICE conectado)                    │               │ (ICE conectado)
   │                │                  │               │             │
   ├──── Audio ─────────────────────────────────────────────►  🔊 Audio
   │   Track P2P    │                  │               │    Playing  │
   │   Direct       │                  │               │             │
   │   100-300ms    │                  │               │             │
```

---

## 🎯 Resumo: Por onde começar?

1. **Entender a estrutura**: Este arquivo + `DOCUMENTATION.md`
2. **Ver o código**: Comece por `App.jsx`
3. **Entender WebRTC**: Leia `useWebRTC.js`
4. **Aprender Firebase**: Veja `firebase/signaling.js`
5. **Configurar**: Siga `FIREBASE_SETUP.md`
6. **Executar**: `npm install && npm run dev`
7. **Testar**: Abra em dois abas: professor + aluno

---

**Necessita mais informações?** Veja [DOCUMENTATION.md](./DOCUMENTATION.md) para detalhes técnicos completos.


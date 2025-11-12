# 🎧 Focally - MVP de Transmissão de Áudio Assistiva

Aplicativo de tecnologia assistiva para transmissão de áudio em tempo real usando React e WebRTC, desenvolvido para auxiliar alunos com TDAH.

> **🚀 [Começar Rápido](./QUICKSTART.md)** | **📚 [Documentação](./DOCUMENTATION.md)** | **🏗️ [Arquitetura](./ARCHITECTURE.md)** | **🆘 [Troubleshooting](./TROUBLESHOOTING.md)** | **🤝 [Contribuir](./CONTRIBUTING.md)**

## 📋 Descrição

O Focally permite que um professor transmita o áudio do seu microfone em tempo real para um aluno, minimizando distrações auditivas. O MVP utiliza WebRTC para comunicação P2P de baixa latência e Firebase Realtime Database para sinalização automática através de código de sessão.

## 🚀 Tecnologias

- **React 18** - Framework JavaScript
- **Vite** - Build tool e dev server
- **WebRTC** - Comunicação em tempo real P2P
- **Firebase Realtime Database** - Sinalização automática
- **QR Code** - Compartilhamento fácil de código de sessão

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. **Configure o Firebase** (obrigatório):
   - Siga as instruções em [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Configure as credenciais em `src/firebase/config.js`

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra o navegador em `http://localhost:4000` (ou na porta definida em `PORT`)

**Nota:** A porta padrão é `4000`. Para alterar, defina a variável de ambiente `PORT`:
```bash
PORT=3000 npm run dev
```

Ou crie um arquivo `.env` na raiz do projeto:
```
PORT=3000
```

## 🎯 Como Usar

### Modo Professor (Transmissor)

1. Selecione "Sou Professor"
2. Clique em "Iniciar Transmissão" e permita o acesso ao microfone
3. Um **código de sessão de 6 dígitos** será gerado automaticamente
4. Compartilhe o código ou **QR Code** com o aluno
5. A conexão será estabelecida automaticamente quando o aluno se conectar
6. O status mudará para "Transmitindo" quando conectado

### Modo Aluno (Receptor)

1. Selecione "Sou Aluno"
2. Digite o **código de 6 dígitos** recebido do professor ou escaneie o **QR Code**
3. Clique em "Conectar"
4. O áudio começará a tocar automaticamente quando a conexão for estabelecida

## 📁 Estrutura do Projeto

```
Focally/
├── src/
│   ├── App.jsx                    # Componente principal com seletor de modo
│   ├── ProfessorView.jsx          # Interface do professor (transmissor)
│   ├── AlunoView.jsx              # Interface do aluno (receptor)
│   ├── useWebRTC.js               # Hook personalizado para lógica WebRTC
│   ├── firebase/
│   │   ├── config.js              # Configuração do Firebase
│   │   └── signaling.js           # Funções de sinalização
│   ├── components/
│   │   ├── QRCodeDisplay.jsx      # Componente para exibir QR Code
│   │   ├── SessionCodeInput.jsx   # Input de código de sessão
│   │   └── InstallPrompt.jsx      # Banner de instalação PWA
│   ├── utils/
│   │   └── sessionCode.js         # Utilitários para código de sessão
│   ├── main.jsx                   # Ponto de entrada da aplicação
│   └── index.css                  # Estilos globais
├── public/
│   ├── manifest.webmanifest       # PWA manifest
│   ├── image/                     # Logos e screenshots
│   └── audio/                     # Sons de fundo (white_noise, etc)
├── index.html
├── package.json
├── vite.config.js
├── FIREBASE_SETUP.md              # Instruções de configuração do Firebase
├── DOCUMENTATION.md               # Documentação técnica completa
└── README.md
```

## 📖 Documentação

### 🚀 Começar Rápido

👉 **[QUICKSTART.md](./QUICKSTART.md)** - **COMECE AQUI!**
- Instalação em 5 minutos
- Teste imediato com 2 abas
- Respostas a perguntas frequentes
- Próximos passos conforme seu perfil

### 📚 Documentação Técnica Completa

Para entender em detalhes a arquitetura, componentes e fluxos de dados do aplicativo, consulte **[DOCUMENTATION.md](./DOCUMENTATION.md)** que contém:

- 🏗️ **Arquitetura Geral** - Visão geral de como os componentes se conectam
- 🧩 **Componentes** - Documentação de cada componente React (props, estado, interface)
- 🎣 **Hooks Personalizados** - Detalhes do `useWebRTC` e suas funcionalidades
- 🔗 **Firebase & Sinalização** - Estrutura do Realtime Database e funções de sinalização
- 🛠️ **Utilitários** - Funções auxiliares e validações
- 📊 **Fluxos de Dados** - Diagramas ASCII dos fluxos de transmissão e ciclos de vida
- ⚙️ **Configuração** - Variáveis de ambiente, dependências, estrutura de pastas
- 🐛 **Troubleshooting** - Soluções para problemas comuns

**Para desenvolvedores que querem**:
- Entender como funciona WebRTC no projeto
- Adicionar novos componentes ou funcionalidades
- Debugar problemas de conexão
- Estender a aplicação

### 📋 Documentação Completa

| Documento | Objetivo |
|-----------|----------|
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Documentação técnica completa (arquitetura, componentes, hooks, fluxos) |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Diagramas visuais, fluxos de dados e ciclos de vida |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Guia para contribuir com código, normas e process de PR |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Soluções para problemas comuns (conexão, áudio, Firebase, PWA) |
| **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** | Setup passo-a-passo do Firebase Realtime Database (obrigatório) |
| **[DEPLOY.md](./DEPLOY.md)** | Instruções para deploy em produção |

## �🔧 Funcionalidades do MVP

- ✅ Seleção de modo (Professor/Aluno)
- ✅ Captura de áudio do microfone
- ✅ Transmissão de áudio via WebRTC
- ✅ **Código de sessão de 6 dígitos** para conexão fácil
- ✅ **QR Code** para compartilhamento rápido
- ✅ **Sinalização automática** via Firebase Realtime Database
- ✅ Indicadores de status em tempo real
- ✅ Tratamento de erros básico
- ✅ Interface responsiva e intuitiva

## ⚠️ Limitações do MVP

- **Requer Firebase**: É necessário configurar o Firebase Realtime Database
- **Sem Autenticação**: Não há sistema de autenticação ou controle de acesso
- **Sem Servidor TURN**: Apenas servidores STUN são utilizados. Em redes com NAT/Firewall restritivos, pode ser necessário adicionar servidores TURN
- **Sem Equalização**: Não há processamento de áudio avançado
- **Scanner QR Code**: A funcionalidade de escanear QR Code via câmera requer biblioteca adicional (por enquanto, use a digitação manual)

## 🛠️ Próximos Passos

- [x] Implementar servidor de sinalização (Firebase Realtime Database)
- [x] Adicionar código de sessão de 6 dígitos
- [x] Adicionar QR Code para compartilhamento
- [ ] Implementar scanner de QR Code via câmera
- [ ] Adicionar autenticação de usuários
- [ ] Implementar servidor TURN para conexões mais complexas
- [ ] Adicionar equalização de áudio
- [ ] Melhorar tratamento de erros e reconexão automática
- [ ] Adicionar suporte a múltiplos alunos
- [ ] Implementar controle de volume e mute
- [ ] Adicionar expiração automática de sessões

## 📝 Notas Técnicas

- O WebRTC utiliza servidores STUN públicos do Google para descobrir endereços IP públicos
- A latência típica é de 100-300ms, dependendo da conexão de rede
- Requer HTTPS em produção (exceto localhost)
- Funciona melhor em navegadores modernos (Chrome, Firefox, Edge, Safari)
- O código de sessão é gerado aleatoriamente (6 dígitos numéricos)
- As sessões são armazenadas temporariamente no Firebase Realtime Database

## 🔐 Configuração do Firebase

**IMPORTANTE**: Antes de usar o aplicativo, você precisa configurar o Firebase. 

Siga as instruções detalhadas em [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## 📄 Licença

Este projeto é um MVP educacional e de pesquisa.

## 📲 PWA (Progressive Web App)

O Focally é agora um **PWA certificado**, permitindo instalação no dispositivo, funcionalidade offline e acesso mais rápido!

### ✨ Recursos PWA

- ✅ **Instalação em dispositivo** — Acesso mais rápido sem abrir navegador
- ✅ **Funciona offline** — Recursos cacheados estão disponíveis offline
- ✅ **Ícone customizado** — Logo exibido na tela inicial/drawer
- ✅ **Interface standalone** — App roda sem barra de endereços (como app nativo)
- ✅ **Atualização automática** — Service Worker garante sempre ter versão mais recente
- ✅ **Cache inteligente** — Estratégias otimizadas por tipo de conteúdo
- ✅ **Suporte multiplataforma** — Desktop, Android, iOS

### 📥 Como instalar

#### Desktop (Chrome, Edge, Firefox)
1. Acesse: https://focally.onrender.com
2. Um banner de instalação aparecerá na parte inferior da tela
3. Clique em "Instalar" para adicionar à área de trabalho
4. Alternativamente, clique no ícone de menu e procure por "Instalar app"

#### Mobile (Android Chrome)
1. Abra https://focally.onrender.com no Chrome
2. Um banner de instalação aparecerá na parte inferior
3. Toque em "Instalar" 
4. Confirme a instalação
5. O app aparecerá na tela inicial

#### iOS (Safari)
1. Abra https://focally.onrender.com no Safari
2. Toque em "Compartilhar" (botão com seta) na parte inferior
3. Scroll até encontrar "Adicionar à Tela Inicial"
4. Dê um nome (sugerido: "Focally")
5. Toque em "Adicionar"
6. O app será adicionado à tela inicial

### 🛠️ Testar PWA em desenvolvimento

Se quiser testar o PWA localmente:

#### 1. Preparar o ambiente
```bash
# Limpar cache anterior
npm run build
```

#### 2. Servir para testes
```bash
npm run preview
# Abra http://localhost:4000 no navegador
```

#### 3. Verificar no DevTools (Chrome/Firefox)
- Abra DevTools: F12 ou Cmd+Option+I (Mac)
- Vá até "Application" ou "Storage"
- **Manifest**: Verifique em Application → Manifest (deve mostrar nome, ícones, descrição)
- **Service Workers**: Deve estar registrado com status "activated and running"
- **Cache Storage**: Verifique em Cache Storage (deve haver cache de assets/audio/imagens)

#### 4. Testar instalação
- Procure pelo ícone de "Instalar" na barra de endereços
- Se não aparecer, clique no menu ⋮ e procure "Instalar app"
- Clique para instalar no seu dispositivo

### 🔧 Desenvolvimento e Service Worker

#### Service Worker em modo desenvolvimento
O app **desregistra automaticamente** os Service Workers em modo `npm run dev` para evitar conflitos com hot reload. Isso garante que mudanças no código sejam refletidas imediatamente.

#### Limpar cache manualmente (se necessário)
1. DevTools → Application → Service Workers → Clique em "Unregister"
2. Vá até "Cache Storage" → Delete todas as caches do Focally
3. Vá até "Cookies" → Delete dados do site
4. Recarregue a página (Cmd+Shift+R ou Ctrl+Shift+R)

#### Desabilitar Service Worker temporariamente
No DevTools → Application → Service Workers, marque "Offline" para simular funcionalidade offline.

### 📊 Estratégias de Cache (Workbox)

O app usa **Workbox** para gerenciar cache com estratégias otimizadas:

| Tipo | Estratégia | Duração | Limite |
|------|-----------|---------|--------|
| **Audio** (`/audio/*`) | Cache First | 30 dias | 20 arquivos |
| **Imagens** (`/image/*`, `/assets/*`) | Cache First | 30 dias | 60 arquivos |
| **API** (`/api/*`) | Network First | 1 dia | 30 requisições |

**O que isso significa:**
- **Cache First**: Usa versão em cache se disponível, atualiza periodicamente
- **Network First**: Tenta rede primeiro, usa cache se offline
- Garante acesso rápido a recursos frequentes
- Funcionalidade offline parcial com recursos cacheados

### 🔍 Verificar configuração PWA

A configuração PWA está em `vite.config.js`:
```javascript
VitePWA({
  registerType: 'autoUpdate',  // Auto-registra SW e atualiza
  workbox: {
    runtimeCaching: [
      // Configurações de cache por tipo de conteúdo
    ]
  },
  manifest: {
    name: "Focally",
    // Metadados do app
  }
})
```

A manifest está em `public/manifest.webmanifest` com:
- Nome e descrição
- Ícones (192×192 e 512×512)
- Screenshots (wide: 810×540, narrow: 540×720)
- Tema de cores e display mode

### ⚡ Performance

Após instalar, o app:
- **Carrega 50-70% mais rápido** (assets do cache)
- **Usa menos dados** (menos downloads repetidos)
- **Funciona offline** (recursos cacheados disponíveis)
- **Experiência como app nativo** (sem UI do navegador)

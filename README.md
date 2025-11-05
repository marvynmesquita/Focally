# 🎧 Focally - MVP de Transmissão de Áudio Assistiva

Aplicativo de tecnologia assistiva para transmissão de áudio em tempo real usando React e WebRTC, desenvolvido para auxiliar alunos com TDAH.

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
│   │   └── SessionCodeInput.jsx   # Input de código de sessão
│   ├── utils/
│   │   └── sessionCode.js         # Utilitários para código de sessão
│   ├── main.jsx                   # Ponto de entrada da aplicação
│   └── index.css                  # Estilos globais
├── index.html
├── package.json
├── vite.config.js
├── FIREBASE_SETUP.md              # Instruções de configuração do Firebase
└── README.md
```

## 🔧 Funcionalidades do MVP

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

# 🚀 Guia de Início Rápido - Focally

Começar a usar o Focally em 5 minutos!

---

## ⚡ Instalação Rápida

### 1️⃣ Clone e Instale

```bash
git clone https://github.com/marvynmesquita/Focally.git
cd Focally
npm install
```

### 2️⃣ Configure Firebase (Obrigatório ⚠️)

**Tempo estimado: 3-5 minutos**

1. Abra [console.firebase.google.com](https://console.firebase.google.com)
2. Crie novo projeto (ou use existente)
3. Adicione app Web
4. Crie **Realtime Database** em modo teste
5. Copie credenciais
6. Cole em `src/firebase/config.js`

💡 **Veja [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para instruções detalhadas**

### 3️⃣ Inicie o Servidor

```bash
npm run dev
# Acesse http://localhost:4000
```

✅ **Pronto! App funcionando localmente**

---

## 🎮 Primeiros Passos - Como Usar

### Teste com 2 Abas do Navegador

**Aba 1 (Professor)**:
1. Acesse http://localhost:4000
2. Clique **"Sou Professor"**
3. Clique **"Iniciar Transmissão"**
4. Permita acesso ao microfone
5. ✅ Código gerado! Exemplo: `123456`

**Aba 2 (Aluno)**:
1. Acesse http://localhost:4000 em nova aba
2. Clique **"Sou Aluno"**
3. Digite código: `123456` (do professor)
4. Clique **"Conectar"**
5. 🔊 **Pronto! Ouvindo áudio do professor**

---

## 📝 Estrutura do Projeto em 60 Segundos

```
src/
├── App.jsx               ← Seletor de modo
├── ProfessorView.jsx     ← Transmissor
├── AlunoView.jsx         ← Receptor
├── useWebRTC.js          ← Lógica principal ⭐
├── components/           ← UI components
├── firebase/             ← Firebase setup
└── utils/                ← Utilitários

Documentação:
├── README.md             ← Visão geral
├── DOCUMENTATION.md      ← Técnico (componentes, hooks)
├── ARCHITECTURE.md       ← Diagramas e fluxos
├── CONTRIBUTING.md       ← Como contribuir
├── TROUBLESHOOTING.md    ← Problemas e soluções
└── FIREBASE_SETUP.md     ← Setup do Firebase
```

---

## 🔑 Conceitos Principais em 3 Pontos

### 1️⃣ Código de Sessão (6 dígitos)
- Professor gera automaticamente
- Aluno digita ou escaneia QR
- Ambos se conectam via Firebase Realtime Database

### 2️⃣ WebRTC P2P (Ponto a Ponto)
- Após conexão inicial: áudio flui direto
- Sem passar pelo servidor
- Latência: 100-300ms (normal)

### 3️⃣ PWA (Progressive Web App)
- Funciona offline com cache
- Instala como app nativo
- Service Worker automático

---

## 📚 Documentação por Necessidade

### 👨‍💻 Sou Desenvolvedor

**Quero entender o código:**
1. Leia [DOCUMENTATION.md](./DOCUMENTATION.md) - Componentes, hooks
2. Veja [ARCHITECTURE.md](./ARCHITECTURE.md) - Fluxos e diagramas
3. Explore código em `src/useWebRTC.js`

**Quero contribuir:**
1. Leia [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Faça fork do projeto
3. Crie branch para sua feature
4. Abra PR com descrição clara

### 🆘 Tenho um Problema

**Não conecta?** → Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) seção "Conexão"

**Áudio ruim?** → Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) seção "Áudio"

**Firebase error?** → Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) seção "Firebase"

**PWA não funciona?** → Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) seção "PWA"

### 🚀 Quero Deploy em Produção

1. Leia [DEPLOY.md](./DEPLOY.md)
2. Configure variáveis de ambiente
3. Deploy em plataforma escolhida
4. Teste em produção

### 📦 Quero Usar em Produção

**Pré-requisitos:**
- ✅ Firebase Realtime Database configurado
- ✅ HTTPS (obrigatório para microfone)
- ✅ Navegadores modernos (Chrome, Firefox, Edge, Safari)

**Endereço de produção:**
- https://focally.onrender.com (demo)
- Ou deploy seu próprio (veja DEPLOY.md)

---

## 🛠️ Scripts NPM Comuns

```bash
# Desenvolvimento
npm run dev                # ↳ Inicia em localhost:4000

# Build
npm run build              # ↳ Cria dist/ para produção
npm run preview            # ↳ Preview do build

# Aliases
npm start                  # ↳ Mesmo que: npm run preview
```

---

## 🤔 Perguntas Frequentes

### P: Funciona offline?
**R:** Sim! PWA com Service Worker cacheia recursos. Offline: funcionalidade parcial.

### P: Quantos alunos por professor?
**R:** MVP suporta 1 aluno. Múltiplos alunos é feature futura.

### P: Requer autenticação?
**R:** Não, qualquer pessoa com código pode conectar. Segurança: via código de sessão.

### P: Por que preciso do Firebase?
**R:** Sinalização automática entre professor e aluno. Sem servidor próprio: Firebase é mais simples.

### P: Posso usar servidor de sinalização diferente?
**R:** Sim! Edite `src/firebase/signaling.js` e implemente seu próprio backend.

### P: Funciona em redes com NAT restritivo?
**R:** Depende. Pode precisar de servidor TURN. Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### P: Qual a latência esperada?
**R:** 100-300ms (normal para WebRTC). Se > 500ms: problema de rede.

### P: Suporta vídeo?
**R:** MVP é só áudio. Vídeo é feature futura planejada.

---

## 🐛 Encontrou Bug?

1. **Reproduza o problema** (siga passos exatos)
2. **Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
3. Se não resolver:
   - Abra issue no GitHub
   - Inclua: navegador, OS, passos para reproduzir, console errors, screenshots

---

## 📚 Recursos Úteis

| Recurso | Link |
|---------|------|
| WebRTC | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API |
| React Hooks | https://react.dev/reference/react/hooks |
| Firebase Realtime DB | https://firebase.google.com/docs/database |
| Web Audio API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API |
| PWA | https://web.dev/progressive-web-apps/ |
| Vite | https://vitejs.dev/guide/ |

---

## 🎯 Próximos Passos

### Para Usuários
1. ✅ Instale o app (PWA)
2. ✅ Configure Firebase
3. ✅ Teste com 2 abas
4. ✅ Use em produção
5. 🔄 Relata bugs/melhorias

### Para Desenvolvedores
1. ✅ Clone repo
2. ✅ Leia [DOCUMENTATION.md](./DOCUMENTATION.md)
3. ✅ Explore código
4. ✅ Teste mudanças
5. 📤 Contribua (veja [CONTRIBUTING.md](./CONTRIBUTING.md))

### Para Empresas/Instituições
1. 📞 Entre em contato
2. 📋 Customize conforme necessário
3. 🚀 Deploy em sua infra
4. 📞 Suporte contínuo
5. 📈 Evolução conjunta

---

## ✅ Checklist: Pronto para Usar?

- [ ] `npm install` executado
- [ ] Firebase configurado (credenciais em config.js)
- [ ] `npm run dev` rodando sem erros
- [ ] Testei com 2 abas (professor + aluno)
- [ ] Áudio funciona
- [ ] Consegui instalar PWA
- [ ] Li [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Se todos ✅, você está pronto! 🚀

---

## 📞 Suporte

- **Dúvidas técnicas**: Abra issue no GitHub
- **Bugs**: Reporte em [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) primeiro
- **Contribuições**: Siga [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Email**: (Se houver contato)

---

**Feliz desenvolvimento! 🎉**

Qualquer dúvida, consulte a [documentação completa](./DOCUMENTATION.md) ou [troubleshooting](./TROUBLESHOOTING.md).


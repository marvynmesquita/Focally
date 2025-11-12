# 🔧 Troubleshooting - Focally

Guia completo para solucionar problemas comuns no Focally.

---

## 📋 Índice Rápido

- [Problemas de Conexão](#conexão)
- [Problemas de Áudio](#áudio)
- [Problemas de Firebase](#firebase)
- [Problemas de PWA](#pwa)
- [Problemas de Desenvolvimento](#desenvolvimento)
- [Problemas de Performance](#performance)

---

## 🔴 Conexão

### ❌ "Não consigo conectar - Error: timeout"

**Causa comum**: NAT/Firewall restritivo, sem servidores TURN funcionando

**Soluções**:
1. **Verificar STUN/TURN**:
   ```javascript
   // Em useWebRTC.js, verificar rtcConfig.iceServers
   // Deve ter múltiplos servidores TURN
   ```

2. **Testar conectividade**:
   - Ambos professor e aluno na **mesma rede WiFi** (teste rápido)
   - Se funcionar: problema é NAT/Firewall
   - Se não funcionar: problema é outro

3. **Adicionar mais TURN**:
   ```javascript
   // src/useWebRTC.js - adicionar ao rtcConfig
   {
     urls: "turn:seu-turn-server.com:3478",
     username: "usuario",
     credential: "senha"
   }
   ```

4. **Usar VPN** para teste (se ambos conectarem via VPN, confirma NAT)

### ❌ "Código de sessão não funciona"

**Causas**:
- Código inválido (não 6 dígitos)
- Firebase não configurado
- Sessão expirou
- Professionalista/aluno desconectaram

**Soluções**:
1. **Verificar formato**:
   ```javascript
   // Valida 6 dígitos numéricos
   /^\d{6}$/.test("123456") // ✅ true
   /^\d{6}$/.test("12345")  // ❌ false (5 dígitos)
   ```

2. **Verificar Firebase**:
   ```bash
   # Abrir console e verificar
   firebase.database().ref('sessions').once('value')
     .then(snap => console.log('Sessions:', snap.val()))
   ```

3. **Verificar timeout** (código expira?):
   - Professores devem manter aba aberta
   - Fechar aba = código inválido
   - Aluno tem ~10 minutos para conectar

4. **Regenerar código**:
   - Professor: Recarregar página e clicar "Iniciar" novamente
   - Novo código será gerado

### ❌ "Conexão instável / cai frequentemente"

**Causas**:
- Rede instável
- WebRTC ICE negotiation falhando
- Servidor TURN sobrecarregado

**Soluções**:
1. **Verificar ICE candidates**:
   ```javascript
   // Em console, durante conexão
   pc.addEventListener('icecandidate', (event) => {
     console.log('ICE candidate:', event.candidate);
   });
   ```

2. **Testar rede**:
   - Executar speedtest em ambos (latência < 100ms ideal)
   - Se > 500ms: problema de rede

3. **Tentar reboot**:
   - Professor: Recarregar página + "Iniciar" novamente
   - Aluno: Digitar código novamente

4. **Verificar server TURN**:
   - Se estiver sobrecarregado: trocar servidor
   - Usar múltiplos servers em `rtcConfig`

---

## 🔴 Áudio

### ❌ "Não consigo capturar o microfone"

**Causas**: Permissão negada, nenhum microfone disponível, uso em HTTP inseguro

**Soluções**:
1. **Verificar permissão do navegador**:
   - Chrome: ícone de câmera/microfone na barra de endereço
   - Se bloqueado: Clique → Permitir → Recarregar

2. **Verificar microfone físico**:
   ```bash
   # macOS
   System Preferences → Sound → Input → Verificar microfone
   
   # Windows
   Settings → Sound → Input → Testar microfone
   
   # Linux
   pavucontrol (pulseaudio) ou alsamixer
   ```

3. **Testar em site confiável**:
   - https://test.webrtc.org/ para testar WebRTC
   - Se falhar lá também: problema do navegador/sistema

4. **Usar HTTPS em produção**:
   - `getUserMedia()` requer HTTPS (exceto localhost)
   - Focally.onrender.com → ✅ HTTPS
   - http://meu-servidor.com → ❌ Será bloqueado

5. **Tentar outro navegador**:
   - Safari às vezes restringe
   - Chrome/Firefox mais permissivos

### ❌ "Captur microfone mas áudio não transmite"

**Causas**: RTCPeerConnection não está transmitindo track, outro problema

**Soluções**:
1. **Verificar se aluno recebeu áudio**:
   - Aluno: DevTools → Application → Network
   - Deve mostrar requisições para Firebase e ICE candidates
   - Deve ter **ontrack** event disparado

2. **Verificar stream no professor**:
   ```javascript
   // Em console do professor
   localStreamRef.current?.getTracks().forEach(track => {
     console.log('Track:', track.label, track.enabled);
   });
   ```

3. **Verificar se track foi adicionado**:
   ```javascript
   // Em useWebRTC.js
   localStreamRef.current?.getAudioTracks().forEach(track => {
     pc.addTrack(track, localStreamRef.current);
   });
   ```

4. **Verificar RTC connection state**:
   ```javascript
   console.log('PC State:', pc.connectionState);  // Deve ser "connected"
   console.log('ICE State:', pc.iceConnectionState); // Deve ser "connected"
   ```

### ❌ "Ouço feedback/echo"

**Causas**: Aluno ouvindo seu próprio microfone

**Soluções**:
1. **Usar fone de ouvido** (mais comum)
   - Elimina feedback imediatamente
   - Recomendado para qualquer conversa

2. **Ajustar volume**:
   - AlunoView tem slider de volume
   - Reduzir volume do professor

3. **Mover microfone** do aluno
   - Se usando speaker, mover afastado dos alto-falantes

4. **Testar com fone**:
   - Se feedback desaparece: problema de hardware
   - Se persiste: verificar configuração de áudio

### ❌ "Áudio muito baixo / muito alto"

**Causas**: Ganho de microfone baixo, volume do player baixo

**Soluções**:

**Professor (voz baixa)**:
1. **Verificar microfone**:
   - Testar em outro app (WhatsApp, Zoom)
   - Se baixo em todos: problema do microfone

2. **Aproximar microfone da boca**:
   - Distância ideal: 15-30cm

3. **Usar microfone melhor**:
   - Microfones USB são melhores que integrados

**Aluno (ouve baixo)**:
1. **Ajustar slider de volume**:
   - AlunoView tem slider "Professor Volume"
   - Mover para direita (100%)

2. **Aumentar volume do sistema**:
   - Som do dispositivo ao máximo

3. **Verificar áudio element**:
   ```javascript
   // Em console
   document.querySelector('audio').volume = 1; // 100%
   ```

### ❌ "Áudio com pops / cliques / distorção"

**Causas**: Codec incompatível, taxa de amostragem errada, compressão excessiva

**Soluções**:
1. **Verificar codec negociado**:
   ```javascript
   pc.getStats().then(report => {
     report.forEach(stats => {
       if (stats.type === 'inbound-rtp') {
         console.log('Codec:', stats.mimeType); // ex: audio/opus
       }
     });
   });
   ```

2. **Opus é ideal**:
   - Se recebendo outro codec: verificar oferta WebRTC

3. **Reduzir ruído**:
   - Usar fone com cancelamento de ruído
   - Reduzir barulho de fundo

4. **Testar bitrate**:
   ```javascript
   pc.getStats().then(report => {
     report.forEach(stats => {
       if (stats.type === 'outbound-rtp') {
         const bitrate = stats.bytesSent * 8 / elapsed_ms;
         console.log('Bitrate:', bitrate, 'kbps');
       }
     });
   });
   ```

---

## 🔴 Firebase

### ❌ "Firebase não configurado"

**Mensagem**: "⚠️ Firebase não configurado!" na interface

**Solução**:
1. **Siga [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**
2. **Edite `src/firebase/config.js`** com suas credenciais:
   ```javascript
   const firebaseConfig = {
     apiKey: "sua-api-key",
     authDomain: "seu-project.firebaseapp.com",
     databaseURL: "https://seu-project-default-rtdb.firebaseio.com",
     projectId: "seu-project",
     storageBucket: "seu-project.firebasestorage.app",
     messagingSenderId: "seu-id",
     appId: "seu-app-id",
   };
   ```

3. **Recarregar página** depois de editar

### ❌ "Firebase error: Database not found"

**Causa**: Realtime Database não criada

**Solução**:
1. **Ir a [console.firebase.google.com](https://console.firebase.google.com)**
2. **Selecionar projeto**
3. **Build → Realtime Database**
4. **Create Database**
5. **Selecionar região** (ex: us-east-1)
6. **Start in test mode**
7. **Aguardar criação (~1 min)**
8. **Copiar databaseURL** para config.js

### ❌ "Firebase error: Permission denied"

**Causas**: Regras de segurança muito restritivas

**Solução - Modo Teste (INSEGURO, apenas dev)**:
1. **Ir a Realtime Database → Rules**
2. **Substituir por**:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. **Publish**

⚠️ **NUNCA usar isso em produção!** Segurança crítica.

**Solução - Produção (SEGURO)**:
```json
{
  "rules": {
    "sessions": {
      "$sessionCode": {
        ".write": true,
        ".read": true,
        "professorId": {
          ".validate": "newData.isString()"
        }
      }
    },
    "offers": {
      "$sessionCode": {
        ".write": true,
        ".read": true
      }
    },
    "answers": {
      "$sessionCode": {
        ".write": true,
        ".read": true
      }
    }
  }
}
```

### ❌ "Firebase Realtime Database vazia / sem dados"

**Causas**: Conexão não estabelecida, dados apagados

**Verificar**:
```javascript
// Em console do navegador
firebase.database().ref('sessions').once('value')
  .then(snap => {
    console.log('Sessions:', snap.val()); // Null se vazio
  });
```

**Solução**:
1. **Verificar conexão Firebase**:
   ```javascript
   firebase.database().ref('.info/connected')
     .on('value', snap => {
       console.log('Firebase connected:', snap.val()); // true/false
     });
   ```

2. **Se não conectado**: Verificar credenciais em config.js

3. **Se vazio é normal**: Dados são deletados quando professor desconecta

---

## 🔴 PWA

### ❌ "Não posso instalar o app"

**Causas**: Service Worker não registrado, manifest inválido, não é PWA válida

**Soluções**:
1. **Verificar PWA Requirements**:
   - Acessar app em **HTTPS** (https://focally.onrender.com)
   - Usar navegador moderno (Chrome, Edge, Firefox, Safari)

2. **Verificar Service Worker**:
   - DevTools → Application → Service Workers
   - Deve estar **registered** e **activated**

3. **Verificar Manifest**:
   - DevTools → Application → Manifest
   - Deve mostrar nome, ícones, descrição

4. **Tentar recarregar**:
   - Limpar cache: DevTools → Application → Clear storage
   - Recarregar página (Cmd+Shift+R ou Ctrl+Shift+R)

5. **Tentar outro navegador**:
   - Safari: Compartilhar → Adicionar à Tela Inicial
   - Chrome: Ícone de menu → Instalar app

### ❌ "App instalado mas não funciona offline"

**Causas**: Service Worker não cacheando, recursos não precacheados

**Soluções**:
1. **Verificar cache**:
   - DevTools → Application → Cache Storage
   - Deve ter múltiplas caches (precache, runtime)

2. **Verificar service worker**:
   ```javascript
   // Em console
   navigator.serviceWorker.controller?.postMessage({type: 'SKIP_WAITING'});
   ```

3. **Forçar atualizar**:
   - DevTools → Application → Service Workers
   - Clique "Update"

4. **Limpar tudo e reinstalar**:
   - Desinstalar app do dispositivo
   - Limpar dados: Settings → Apps → Focally → Clear Storage
   - Ir ao site novamente
   - Instalar de novo

### ❌ "App atualiza continuamente / versão desatualizada"

**Causas**: Múltiplos Service Workers, cache antigo

**Soluções**:
1. **Desregistrar todos SWs**:
   - DevTools → Application → Service Workers
   - Clique "Unregister" em todos

2. **Limpar todas as caches**:
   - DevTools → Application → Cache Storage
   - Deletar todas as caches

3. **Limpar dados do site**:
   - DevTools → Application → Storage → Clear site data

4. **Fechar aba, abrir nova aba**:
   - Ir ao site novamente
   - Deve carregar versão nova

---

## 🔴 Desenvolvimento

### ❌ "MIME Type Error: Expected JavaScript but got text/html"

**Causa**: Service Worker de produção interferindo em desenvolvimento

**Solução**:
```bash
# Opção 1: Desregistrar SW manualmente
# DevTools → Application → Service Workers → Unregister

# Opção 2: Código automático (já está em main.jsx)
# Verifica import.meta.env.DEV e desregistra SWs

# Opção 3: Usar incógnito
# Chrome/Edge: Ctrl+Shift+N (não tem SWs anteriores)
```

### ❌ "npm run dev não inicia"

**Causas**: Porta em uso, erro de sintaxe, dependência faltando

**Soluções**:
1. **Verificar porta**:
   ```bash
   # macOS/Linux
   lsof -i :4000
   kill -9 PID
   
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID PID_AQUI /F
   ```

2. **Verificar sintaxe**:
   ```bash
   npm run build  # Vai mostrar erros de compilação
   ```

3. **Reinstalar dependências**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **Verificar Node.js**:
   ```bash
   node --version  # Deve ser v16+
   ```

### ❌ "npm run build falha"

**Causas**: Erro de TypeScript, import inválido, dependência circular

**Soluções**:
1. **Ver erro completo**:
   ```bash
   npm run build 2>&1 | head -50
   ```

2. **Verificar imports**:
   - Certificar que arquivos existem
   - Usar caminhos relativos corretos

3. **Limpar e rebuildar**:
   ```bash
   rm -rf dist node_modules package-lock.json
   npm install
   npm run build
   ```

### ❌ "Hot reload não funciona"

**Causa**: Arquivo salvo mas página não atualiza

**Soluções**:
1. **Recarregar manualmente**:
   - Cmd+R ou Ctrl+R

2. **Verificar que salvo corretamente**:
   - Arquivo deve ser salvo (disco, não RAM)

3. **Reiniciar dev server**:
   ```bash
   Ctrl+C  # Parar servidor
   npm run dev  # Reiniciar
   ```

4. **Verificar console**:
   - DevTools → Console
   - Podem haver erros no arquivo

---

## 🔴 Performance

### ❌ "App lento / muita latência de áudio"

**Causas**: Conexão lenta, codec ineficiente, latência de rede

**Soluções**:
1. **Verificar latência**:
   ```bash
   ping -c 5 google.com  # Latência da rede
   ```
   - < 100ms: Bom
   - 100-300ms: Aceitável
   - > 500ms: Ruim

2. **Verificar bitrate**:
   ```javascript
   pc.getStats().then(report => {
     report.forEach(stats => {
       if (stats.type === 'inbound-rtp') {
         console.log('Bitrate:', stats.bytesReceived, 'bytes');
       }
     });
   });
   ```

3. **Otimizações**:
   - Usar fone de ouvido (reduz feedback)
   - Limitar taxa de amostragem se necessário
   - Usar codec Opus

### ❌ "Uso de dados muito alto"

**Causas**: Áudio em bitrate alto, múltiplas conexões

**Soluções**:
1. **Verificar bitrate**:
   - Áudio típico: 16-64 kbps (muito baixo)
   - Se > 128 kbps: verificar codec

2. **Verificar múltiplas conexões**:
   - Professor com múltiplos alunos usa mais dados
   - Normal e esperado

3. **Limitar alunos** se necessário

---

## 📞 Ainda Não Resolveu?

1. **Consulte [DOCUMENTATION.md](./DOCUMENTATION.md)** para detalhes técnicos
2. **Abra uma issue** no GitHub com:
   - Reprodução exata do problema
   - Console errors (screenshots)
   - Seu ambiente (browser, OS, versão app)
3. **Adicione logs detalhados** para análise

---

## 🎯 Checklist de Troubleshooting

Antes de reportar issue, verifique:

- [ ] Firebase está configurado e conectado
- [ ] Ambos professor e aluno em rede estável
- [ ] Usando HTTPS em produção (http://localhost é OK)
- [ ] Navegadores modernos e atualizados
- [ ] Permissões de microfone concedidas
- [ ] Service Worker está ativo
- [ ] Cache cleared (`Cmd+Shift+R`)
- [ ] Testou em incógnito
- [ ] Testou em outro navegador
- [ ] Testou com fone de ouvido (áudio)

Se ainda não funcionar, você está pronto para abrir uma issue detalhada! 🚀


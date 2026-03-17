# 🚀 Guia de Deploy (Flutter Web)

Este aplicativo foi reescrito para Flutter Web. Abaixo estão as instruções para publicá-lo na internet.

## Configuração no Render (Automático)

A maneira mais fácil de fazer o deploy contínuo (CI/CD) ao realizar commits na master é utilizar o Render.
O arquivo `render.yaml` já está configurado na raiz para:

1. Clonar o SDK do Flutter dinamicamente.
2. Executar `flutter build web`.
3. Servir a pasta resultante `build/web` como um Site Estático.

**Como ativar no Render:**
1. Crie uma conta em [Render.com](https://render.com)
2. Clique em "New" -> "Blueprint"
3. Conecte o repositório Github deste projeto.
4. O Render lerá o `render.yaml` e fará o deploy e a hospedagem gratuita automaticamente.

---

## Alternativa: Firebase Hosting

Como o app usa o Firebase Realtime Database para a sinalização WebRTC, hospedar pelo Firebase também é ideal.

### 1. Inicializar e Preparar
No terminal, na raiz do projeto:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```
*(Quando perguntado qual pasta usar como diretório público, digite `build/web`)*

### 2. Realizar o Build
Compile a versão final do app Flutter para a web:
```bash
flutter build web
```

### 3. Fazer o Deploy
```bash
firebase deploy --only hosting
```

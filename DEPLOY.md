# 🚀 Guia de Deploy no Render

## Configuração no Render

### 1. Configurações do Serviço Web

No painel do Render, configure:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
- `PORT` = `4000` (ou a porta que você desejar)
- `NODE_ENV` = `production`

### 2. Verificações

- ✅ Certifique-se de que o `PORT` está definido nas variáveis de ambiente
- ✅ O Build Command deve fazer `npm run build` para gerar os arquivos estáticos
- ✅ O Start Command deve usar `npm start` que executa `vite preview` (servidor de produção)

### 3. Notas Importantes

- O Render detectará automaticamente a porta se `PORT` estiver definido
- O servidor Vite preview escuta em `0.0.0.0` para aceitar conexões externas
- Certifique-se de que o Firebase está configurado corretamente

### 4. Alternativa: Usar render.yaml

Se preferir usar o arquivo `render.yaml`, ele já está configurado no projeto. Basta conectar o repositório no Render e ele usará as configurações do arquivo.

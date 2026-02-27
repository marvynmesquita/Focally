# 🔥 Configuração do Firebase

O Focally usa Firebase Realtime Database para comunicação em tempo real entre professor e aluno através do código de sessão.

## Passo a Passo para Configuração

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto" ou use um projeto existente
3. Siga as instruções para criar o projeto

### 2. Configurar Realtime Database

1. No menu lateral, clique em **Realtime Database**
2. Clique em **Criar banco de dados**
3. Escolha a localização do banco (ex: `us-central1`)
4. **IMPORTANTE**: Escolha o modo **Modo de teste** (Test mode) para desenvolvimento
   - Para produção, configure regras de segurança apropriadas

### 3. Obter Credenciais de Configuração

1. No menu lateral, clique em **Configurações do projeto** (ícone de engrenagem)
2. Role até a seção **Seus apps**
3. Clique no ícone **Web** (`</>`)
4. Registre o app com um nome (ex: "Focally Web")
5. **Copie as credenciais** que aparecem

### 4. Configurar no Projeto

1. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`
2. Substitua os valores `YOUR_*` pelas credenciais copiadas:

```env
VITE_FIREBASE_API_KEY="SUA_API_KEY_AQUI"
VITE_FIREBASE_AUTH_DOMAIN="SEU_PROJECT_ID.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://SEU_PROJECT_ID-default-rtdb.firebaseio.com/"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_PROJECT_ID.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"
```

### 5. Configurar Regras de Segurança (Produção)

Para produção, configure regras de segurança no Realtime Database:

1. No Firebase Console, vá em **Realtime Database** > **Regras**
2. Substitua as regras por:

```json
{
  "rules": {
    "sessions": {
      "$sessionCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['offer', 'answer']) || newData.hasChildren(['offer']) || newData.hasChildren(['answer'])"
      }
    }
  }
}
```

**Nota**: Essas regras permitem leitura/escrita para qualquer sessão. Para produção, considere adicionar autenticação.

### 6. Testar

1. Execute `npm install` para instalar as dependências
2. Execute `npm run dev`
3. Teste criando uma sessão como professor e conectando como aluno

## Estrutura de Dados no Firebase

O Firebase armazena os dados da seguinte forma:

```
sessions/
  └── 123456/          (código de sessão)
      ├── offer        (SDP Offer do professor)
      ├── answer       (SDP Answer do aluno)
      └── createdAt    (timestamp)
```

## Troubleshooting

### Erro: "Firebase: Error (auth/unauthorized)"
- Verifique se as variáveis de ambiente (`.env`) estão preenchidas e com os nomes corretos com prefixo `VITE_`
- Certifique-se de que o Realtime Database está criado

### Erro: "Permission denied"
- Verifique as regras de segurança do Realtime Database
- Certifique-se de que está usando modo de teste ou que as regras permitem leitura/escrita

### Sessões não aparecem
- Verifique o console do navegador para erros
- Certifique-se de que o Firebase está inicializado corretamente

## Limites do Plano Gratuito

O Firebase oferece um plano gratuito (Spark) com:
- 1 GB de armazenamento
- 10 GB de transferência por mês
- 100 conexões simultâneas

Para uso em produção com muitos usuários, considere o plano Blaze (pay-as-you-go).


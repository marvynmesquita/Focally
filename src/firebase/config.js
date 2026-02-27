// Importar Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// IMPORTANTE: Substitua estas configurações pelas suas credenciais do Firebase
// Para obter essas credenciais:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto ou use um existente
// 3. Vá em Project Settings > General > Your apps
// 4. Adicione um app Web e copie as credenciais
// 5. IMPORTANTE: Crie um Realtime Database no modo de teste

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Verificar se as configurações foram preenchidas
const isConfigValid = 
  firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "your_api_key_here" &&
  firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.projectId !== "your_project_id" &&
  firebaseConfig.databaseURL && firebaseConfig.databaseURL !== "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/";

if (!isConfigValid) {
  console.error(`
    ⚠️ FIREBASE NÃO CONFIGURADO!
    
    Por favor, configure o Firebase antes de usar o aplicativo:
    1. Siga as instruções em FIREBASE_SETUP.md
    2. Edite este arquivo (src/firebase/config.js)
    3. Substitua os valores "YOUR_*" pelas suas credenciais reais
    
    O aplicativo não funcionará até que o Firebase seja configurado.
  `);
}

// Inicializar Firebase (garantir que seja inicializado apenas uma vez)
let app;
let database;

try {
  if (isConfigValid) {
    // Verificar se já existe uma app inicializada
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Usar a app existente
      app = getApp();
      console.log('Firebase: usando instância existente');
    } else {
      // Criar nova app
      app = initializeApp(firebaseConfig);
      console.log('Firebase inicializado com sucesso');
    }
    database = getDatabase(app);
  } else {
    // Criar objetos mock para evitar erros durante o desenvolvimento
    database = null;
    console.warn('Firebase não inicializado - configure as credenciais primeiro');
  }
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  database = null;
}

export { database };
export const isFirebaseConfigured = isConfigValid;


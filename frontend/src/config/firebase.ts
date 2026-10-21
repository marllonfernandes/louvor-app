import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { appLogger } from '../utils/logger';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;

// Configuração mínima e essencial para conexão direta com o Google Cloud Firestore
const firebaseConfig = {
  apiKey,
  projectId,
  authDomain
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
let isFirestoreAvailable = false;
const isRealApiKeyFormat = typeof apiKey === 'string' && apiKey.startsWith('AIza');

try {
  if (apiKey && projectId) {
    if (!isRealApiKeyFormat) {
      appLogger.warn(
        'FIRESTORE',
        `Chave de API com formato incomum (${apiKey.substring(0, 10)}...). Verifique se é uma Web API Key.`
      );
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    // Inicializa a autenticação PRIMEIRO, pois Firestore pode lançar erro se o databaseId for inválido
    try {
      auth = getAuth(app);
    } catch (authErr) {
      appLogger.error('AUTH', 'Erro ao inicializar Firebase Auth', authErr);
    }
    
    // Conecta explicitamente ao database 'app-unida' com suporte a ignoreUndefinedProperties
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true
      }, databaseId);
      isFirestoreAvailable = true;
    } catch (dbErr) {
      try {
        db = getFirestore(app, databaseId);
        isFirestoreAvailable = true;
      } catch (fallbackErr) {
        appLogger.error('FIRESTORE', 'Erro ao inicializar Firestore DB', fallbackErr);
      }
    }
    
    appLogger.info('FIRESTORE', `Firebase SDK inicializado com sucesso (Projeto: ${projectId}, DB: ${databaseId})`);
  } else {
    appLogger.info('SISTEMA', 'VITE_FIREBASE_API_KEY ou VITE_FIREBASE_PROJECT_ID não definidos. Operando em modo LocalStorage.');
  }
} catch (error) {
  appLogger.error('FIRESTORE', 'Erro fatal na inicialização do Firebase SDK', error);
  isFirestoreAvailable = false;
}

export { app, db, auth, googleProvider, isFirestoreAvailable, isRealApiKeyFormat, firebaseConfig, databaseId };



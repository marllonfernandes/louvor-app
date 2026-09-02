import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

// Configuração mínima e essencial para conexão direta com o Google Cloud Firestore
const firebaseConfig = {
  apiKey,
  projectId,
  authDomain: `${projectId}.firebaseapp.com`
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
      console.warn(
        `[Firebase Config] AVISO: A chave informada ("${apiKey.substring(0, 10)}...") não parece ser uma Web API Key válida do Google Cloud / Firebase (que começa com "AIzaSy..."). ` +
        `Se esta chave for um Private Key ID de Service Account, o Firestore rejeitará a conexão e o aplicativo usará dados locais/mock. ` +
        `Obtenha a Web API Key em: GCP Console > APIs e Serviços > Credenciais > Chaves de API.`
      );
    }

    if (!getApps().length) {
      console.log('🔥 [Firebase Debug] Inicializando um novo App com firebaseConfig:', { ...firebaseConfig, apiKey: '***' });
      app = initializeApp(firebaseConfig);
    } else {
      console.log('🔥 [Firebase Debug] Usando app existente.');
      app = getApps()[0];
    }
    
    // Inicializa a autenticação PRIMEIRO, pois Firestore pode lançar erro se o databaseId for inválido
    console.log('🔥 [Firebase Debug] Inicializando Auth...');
    try {
      auth = getAuth(app);
      console.log('🔥 [Firebase Debug] Auth inicializado com sucesso?', auth !== null);
    } catch (authErr) {
      console.error('❌ [Firebase Debug] Erro ao inicializar Auth:', authErr);
    }
    
    // Conecta explicitamente ao database 'app-unida'
    console.log('🔥 [Firebase Debug] Inicializando Firestore com databaseId:', databaseId);
    try {
      db = getFirestore(app, databaseId);
      isFirestoreAvailable = true;
      console.log('🔥 [Firebase Debug] Firestore inicializado com sucesso.');
    } catch (dbErr) {
      console.error('❌ [Firebase Debug] Erro ao inicializar Firestore:', dbErr);
    }
    
    if (import.meta.env.DEV) {
      console.log(`🔥 [Firebase] SDK inicializado com sucesso para o projeto: ${projectId} (Database: ${databaseId})`);
    }
  } else {
    console.error('❌ [Firebase Debug] FALTANDO VARIÁVEIS! apiKey:', !!apiKey, 'projectId:', !!projectId);
    console.info('[Firebase] VITE_FIREBASE_API_KEY ou VITE_FIREBASE_PROJECT_ID não definidos. Operando em modo LocalStorage.');
  }
} catch (error) {
  console.error('❌ [Firestore] Erro na inicialização do Firebase SDK:', error);
  isFirestoreAvailable = false;
}

export { app, db, auth, googleProvider, isFirestoreAvailable, isRealApiKeyFormat, firebaseConfig, databaseId };



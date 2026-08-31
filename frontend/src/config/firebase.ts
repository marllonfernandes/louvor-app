import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração mínima e essencial para conexão direta com o Google Cloud Firestore
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirestoreAvailable = false;

try {
  // Verifica se temos chaves de ambiente configuradas ou inicializa a instância
  const hasRealConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
  
  if (hasRealConfig || !getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // Disponível quando houver API_KEY real injetada
    isFirestoreAvailable = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
  }
} catch (error) {
  console.warn('[Firestore] Modo Local / Offline ativo:', error);
  isFirestoreAvailable = false;
}

export { app, db, isFirestoreAvailable, firebaseConfig };

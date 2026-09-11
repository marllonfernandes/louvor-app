import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, isFirestoreAvailable } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Processa retorno de login por redirecionamento caso o popup tenha usado fallback
    getRedirectResult(auth).catch((err: any) => {
      if (err && err.code !== 'auth/popup-closed-by-user') {
        console.error('[Auth] Erro no redirect de autenticação:', err);
        setError(formatAuthError(err));
      }
    });

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      setCurrentUser(user);
      
      if (user && isFirestoreAvailable && db) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const usersRef = collection(db, 'users');
          const emailQuery = user.email ? query(usersRef, where('email', '==', user.email)) : null;

          const urlParams = new URLSearchParams(window.location.search);
          const inviteToken = urlParams.get('inviteToken');
          
          if (inviteToken) {
            // Process invite token
            const tokenQuery = query(usersRef, where('inviteToken', '==', inviteToken));
            const tokenSnap = await getDocs(tokenQuery);
            if (!tokenSnap.empty) {
              const inviteDoc = tokenSnap.docs[0];
              const inviteData = inviteDoc.data();
              
              const newUserProfile: User = {
                id: user.uid,
                uid: user.uid,
                name: inviteData.name || user.displayName || 'Sem Nome',
                email: user.email || inviteData.email || '',
                phone: inviteData.phone || '',
                role: inviteData.role || 'Membro',
                roles: inviteData.roles || [],
                systemRole: inviteData.systemRole === 'Member' ? 'Viewer' : (inviteData.systemRole || 'Viewer'),
                active: true,
                avatar: user.photoURL || undefined
              };
              
              // Move data to new UID and delete old invite document
              await setDoc(userDocRef, newUserProfile);
              await deleteDoc(inviteDoc.ref);
              
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }

          const [userDocSnap, querySnapshot] = await Promise.all([
            getDoc(userDocRef),
            emailQuery ? getDocs(emailQuery) : Promise.resolve({ empty: true, docs: [] })
          ]);
          
          if (!userDocSnap.exists()) {
            // Se não existir pelo UID, checa o resultado da busca por email (Convite criado pelo Líder)
            if (user.email && !querySnapshot.empty) {
              const inviteDoc = (querySnapshot as any).docs[0];
              const inviteData = inviteDoc.data();
              
              const newUserProfile: User = {
                id: user.uid,
                uid: user.uid,
                name: inviteData.name || user.displayName || 'Sem Nome',
                email: user.email,
                phone: inviteData.phone || '',
                role: inviteData.role || 'Membro',
                roles: inviteData.roles || [],
                systemRole: inviteData.systemRole === 'Member' ? 'Viewer' : (inviteData.systemRole || 'Viewer'),
                active: true,
                avatar: user.photoURL || undefined
              };
              
              await setDoc(userDocRef, newUserProfile);
            } else if (!user.email) {
              setError('Seu login não forneceu um email válido.');
              if (auth) await firebaseSignOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
              setLoading(false);
              return;
            } else {
              setError('Você não tem permissão para acessar o aplicativo. Solicite ao líder que o convide pelo seu email.');
              if (auth) await firebaseSignOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
              setLoading(false);
              return;
            }
          }

          // Assinatura em tempo real às alterações no documento do usuário logado
          unsubUserDoc = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              let systemRole = data.systemRole;
              
              // Migração em memória para usuários antigos
              if (systemRole === 'Member' || !systemRole) {
                if (data.roles?.includes('Líder') || data.role?.includes('Líder')) {
                  systemRole = 'Editor';
                } else {
                  systemRole = 'Viewer';
                }
              }
              
              setUserProfile({ id: snap.id, uid: user.uid, ...data, systemRole } as User);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          }, (err) => {
            console.warn('Erro no listener em tempo real do perfil:', err);
            setLoading(false);
          });

        } catch (err) {
          console.error("Erro ao buscar perfil do usuário", err);
          setError('Erro ao carregar seu perfil.');
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsubscribe();
    };
  }, []);

  const formatAuthError = (err: any): string => {
    if (!err) return 'Erro desconhecido na autenticação.';
    switch (err.code) {
      case 'auth/unauthorized-domain':
        return 'Este domínio não está autorizado no Firebase Console. Adicione a URL atual em Firebase Console > Authentication > Settings > Authorized Domains.';
      case 'auth/popup-blocked':
        return 'O navegador bloqueou a abertura da janela de login. Por favor, permita popups para este site.';
      case 'auth/popup-closed-by-user':
        return 'A janela de autenticação foi fechada antes da conclusão.';
      case 'auth/network-request-failed':
        return 'Falha de conexão com a rede. Verifique sua internet.';
      case 'auth/cancelled-popup-request':
        return 'Operação anterior de login cancelada.';
      case 'auth/user-not-found':
        return 'Nenhum usuário encontrado com este e-mail.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Verifique a senha ou redefina-a.';
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos. Verifique suas credenciais.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado. Faça login ou solicite a recuperação de senha.';
      case 'auth/weak-password':
        return 'A senha deve conter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'O formato do e-mail inserido é inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas malsucedidas. Por favor, aguarde alguns instantes antes de tentar novamente.';
      default:
        return err.message || 'Falha na autenticação.';
    }
  };

  const clearError = () => setError(null);

  const loginWithGoogle = async () => {
    setError(null);
    if (!auth) {
      setError('Autenticação não configurada.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // 1. Usuário fechou a janela ou cancelou a operação: não exibe erro alarmante
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('[Auth] Login cancelado pelo usuário.');
        return;
      }

      // 2. Se o popup foi bloqueado pelo navegador (comum no iOS / Webviews / PWA), tenta redirecionamento
      if (err?.code === 'auth/popup-blocked') {
        try {
          console.info('[Auth] Popup bloqueado, tentando login com redirecionamento...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error('[Auth] Falha no redirecionamento:', redirectErr);
        }
      }

      console.error('[Auth] Erro no login com Google:', err);
      setError(formatAuthError(err));
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    if (!auth) {
      setError('Autenticação não configurada.');
      throw new Error('Autenticação não configurada.');
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error('[Auth] Erro no login com Email:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, password: string, name?: string) => {
    setError(null);
    if (!auth) {
      setError('Autenticação não configurada.');
      throw new Error('Autenticação não configurada.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name.trim() });
      }
    } catch (err: any) {
      console.error('[Auth] Erro no cadastro com Email:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!auth) {
      setError('Autenticação não configurada.');
      throw new Error('Autenticação não configurada.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('[Auth] Erro na recuperação de senha:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        clearError,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

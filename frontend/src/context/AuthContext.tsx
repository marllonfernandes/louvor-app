import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, isFirestoreAvailable } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
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

  const loginWithGoogle = async () => {
    setError(null);
    if (!auth) {
      setError('Autenticação não configurada.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha no login com Google.');
    }
  };

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, error, loginWithGoogle, logout }}>
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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && isFirestoreAvailable && db) {
        try {
          // Realiza as consultas no banco de dados em paralelo para agilizar a verificação
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
              
              setUserProfile(newUserProfile);
              window.history.replaceState({}, document.title, window.location.pathname);
              setLoading(false);
              return; // Done processing invite
            }
          }

          const [userDocSnap, querySnapshot] = await Promise.all([
            getDoc(userDocRef),
            emailQuery ? getDocs(emailQuery) : Promise.resolve({ empty: true, docs: [] })
          ]);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            let systemRole = data.systemRole;
            
            // Migração em memória para usuários antigos
            if (systemRole === 'Member' || !systemRole) {
              if (data.roles?.includes('Líder') || data.role?.includes('Líder')) {
                systemRole = 'Editor';
              } else {
                systemRole = 'Viewer';
              }
            }
            
            setUserProfile({ id: userDocSnap.id, ...data, systemRole } as User);
          } else {
            // 2. Se não existir pelo UID, checa o resultado da busca por email (Convite criado pelo Líder)
            if (user.email) {
              if (!querySnapshot.empty) {
                // Migrar o convite para o UID definitivo
                const inviteDoc = (querySnapshot as any).docs[0];
                const inviteData = inviteDoc.data();
                
                const newUserProfile: User = {
                  id: user.uid,
                  name: inviteData.name || user.displayName || 'Sem Nome',
                  email: user.email,
                  phone: inviteData.phone || '',
                  role: inviteData.role || 'Membro',
                  roles: inviteData.roles || [],
                  systemRole: inviteData.systemRole === 'Member' ? 'Viewer' : (inviteData.systemRole || 'Viewer'),
                  active: true,
                  avatar: user.photoURL || undefined
                };
                
                // Cria na coleção users com o UID
                await setDoc(userDocRef, newUserProfile);
                setUserProfile(newUserProfile);
                
                // Opcional: deletar o documento de convite original?
                // await deleteDoc(inviteDoc.ref);
              } else {
                // Usuário não foi convidado
                setError('Você não tem permissão para acessar o aplicativo. Solicite ao líder que o convide pelo seu email.');
                if (auth) await firebaseSignOut(auth);
                setCurrentUser(null);
                setUserProfile(null);
              }
            } else {
              setError('Seu login não forneceu um email válido.');
              if (auth) await firebaseSignOut(auth);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar perfil do usuário", err);
          setError('Erro ao carregar seu perfil.');
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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

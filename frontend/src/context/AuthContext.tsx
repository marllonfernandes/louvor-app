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
import { isValidAvatarUrl, isSamePersonName } from '../utils/avatar';

const INVITE_STORAGE_KEY = 'louvor_pending_invite_token';

export function getPendingInviteToken(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('inviteToken');
    if (fromUrl) {
      localStorage.setItem(INVITE_STORAGE_KEY, fromUrl);
      sessionStorage.setItem(INVITE_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(INVITE_STORAGE_KEY) || sessionStorage.getItem(INVITE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPendingInviteToken(token: string): void {
  try {
    localStorage.setItem(INVITE_STORAGE_KEY, token);
    sessionStorage.setItem(INVITE_STORAGE_KEY, token);
  } catch {}
}

export function clearPendingInviteToken(): void {
  try {
    localStorage.removeItem(INVITE_STORAGE_KEY);
    sessionStorage.removeItem(INVITE_STORAGE_KEY);
  } catch {}
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  pendingLinkingUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  linkMemberWithPhoneOrCode: (phoneOrCode: string) => Promise<boolean>;
  cancelLinking: () => Promise<void>;
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
  const [pendingLinkingUser, setPendingLinkingUser] = useState<FirebaseUser | null>(null);
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

          const pendingToken = getPendingInviteToken();
          
          if (pendingToken) {
            // Processa o token de convite preservado (inclusive após redirecionamento no iOS Safari)
            const tokenQuery = query(usersRef, where('inviteToken', '==', pendingToken));
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
                avatar: user.photoURL || inviteData.avatar || undefined
              };
              
              await setDoc(userDocRef, newUserProfile);
              if (inviteDoc.id !== user.uid) {
                try {
                  await deleteDoc(inviteDoc.ref);
                } catch {
                  // Ignora se não puder deletar
                }
              }
              
              clearPendingInviteToken();
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }

          const [userDocSnap, querySnapshot] = await Promise.all([
            getDoc(userDocRef),
            emailQuery ? getDocs(emailQuery) : Promise.resolve({ empty: true, docs: [] })
          ]);
          
          if (!userDocSnap.exists()) {
            // 1. Se não existir pelo UID, checa o resultado da busca por email (Convite criado pelo Líder)
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
                avatar: user.photoURL || inviteData.avatar || undefined
              };
              
              await setDoc(userDocRef, newUserProfile);
              if (inviteDoc.id !== user.uid) {
                try {
                  await deleteDoc(inviteDoc.ref);
                } catch {
                  // Ignora caso não tenha permissão de deletar documento antigo
                }
              }
              clearPendingInviteToken();
            } else {
              // 2. Tenta vinculação inteligente se o líder cadastrou o membro sem e-mail (apenas nome/celular)
              let autoLinked = false;
              if (user.displayName) {
                try {
                  const allUsersSnap = await getDocs(usersRef);
                  const candidateDocs = allUsersSnap.docs.filter(d => {
                    const dData = d.data();
                    const isUnlinked = !dData.uid || d.id !== user.uid;
                    const hasNoEmail = !dData.email || dData.email.trim() === '';
                    return isUnlinked && hasNoEmail && isSamePersonName(dData.name, user.displayName);
                  });

                  if (candidateDocs.length === 1) {
                    const inviteDoc = candidateDocs[0];
                    const inviteData = inviteDoc.data();
                    
                    const newUserProfile: User = {
                      id: user.uid,
                      uid: user.uid,
                      name: inviteData.name || user.displayName,
                      email: user.email || '',
                      phone: inviteData.phone || '',
                      role: inviteData.role || 'Membro',
                      roles: inviteData.roles || [],
                      systemRole: inviteData.systemRole === 'Member' ? 'Viewer' : (inviteData.systemRole || 'Viewer'),
                      active: true,
                      avatar: user.photoURL || inviteData.avatar || undefined
                    };

                    await setDoc(userDocRef, newUserProfile);
                    if (inviteDoc.id !== user.uid) {
                      try {
                        await deleteDoc(inviteDoc.ref);
                      } catch {}
                    }
                    autoLinked = true;
                    clearPendingInviteToken();
                  }
                } catch (autoErr) {
                  console.warn('[Auth] Erro ao tentar auto-link por nome:', autoErr);
                }
              }

              if (!autoLinked) {
                // Em vez de desconectar bruscamente, mantemos o usuário no estado de vinculação pendente
                setPendingLinkingUser(user);
                setError(
                  user.email
                    ? `O e-mail "${user.email}" não consta como membro cadastrado. Se seu líder te cadastrou apenas com celular, informe o número abaixo para liberar seu acesso.`
                    : 'Você não tem permissão para acessar o aplicativo. Solicite ao líder que o convide.'
                );
                setLoading(false);
                return;
              }
            }
          } else {
            // Se o usuário já existe e ainda não tem URL de avatar válida salva no banco, aproveita a foto do Google
            const existingData = userDocSnap.data();
            if (!isValidAvatarUrl(existingData?.avatar) && user.photoURL) {
              await setDoc(userDocRef, { avatar: user.photoURL }, { merge: true });
            }

            // Também sincroniza a foto do Google com qualquer outro registro do mesmo e-mail na coleção users
            if (user.photoURL && !(querySnapshot as any).empty) {
              for (const docSnap of (querySnapshot as any).docs) {
                const docData = docSnap.data();
                if (!isValidAvatarUrl(docData?.avatar)) {
                  try {
                    await setDoc(docSnap.ref, { avatar: user.photoURL, uid: user.uid }, { merge: true });
                  } catch {
                    // Ignora se regras de segurança restringirem escrita em outro doc
                  }
                }
              }
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
              
              setUserProfile({
                id: snap.id,
                uid: user.uid,
                ...data,
                avatar: isValidAvatarUrl(data.avatar) ? data.avatar : (user.photoURL || undefined),
                systemRole
              } as User);
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
    
    // Garante que o inviteToken presente na URL seja preservado em storage antes de qualquer redirecionamento (essencial no iPhone)
    getPendingInviteToken();

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // 1. Usuário fechou a janela ou cancelou a operação: não exibe erro alarmante
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('[Auth] Login cancelado pelo usuário.');
        return;
      }

      // 2. Se o popup falhou ou foi bloqueado (comum no iOS Safari / Webviews / PWA), usa redirecionamento
      console.info('[Auth] Popup indisponível ou bloqueado, utilizando login com redirecionamento (iOS / Mobile)...', err?.code);
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectErr: any) {
        console.error('[Auth] Falha no redirecionamento:', redirectErr);
        setError(formatAuthError(redirectErr));
      }
    }
  };

  const linkMemberWithPhoneOrCode = async (phoneOrCode: string): Promise<boolean> => {
    if (!pendingLinkingUser || !db) return false;
    const clean = phoneOrCode.trim();
    if (!clean) {
      setError('Por favor, informe seu celular ou o código de convite.');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, 'users');
      const allUsersSnap = await getDocs(usersRef);
      const cleanDigits = clean.replace(/\D/g, '');

      const matchedDoc = allUsersSnap.docs.find(d => {
        const data = d.data();
        if (data.uid && data.uid !== pendingLinkingUser.uid) return false;

        // Bate por inviteToken
        if (data.inviteToken && data.inviteToken.toLowerCase() === clean.toLowerCase()) {
          return true;
        }

        // Bate por número de celular (compara os últimos 8 ou 9 dígitos)
        if (cleanDigits.length >= 8 && data.phone) {
          const memberDigits = data.phone.replace(/\D/g, '');
          if (
            memberDigits &&
            (memberDigits === cleanDigits ||
              memberDigits.endsWith(cleanDigits) ||
              cleanDigits.endsWith(memberDigits))
          ) {
            return true;
          }
        }

        return false;
      });

      if (!matchedDoc) {
        setError('Nenhum cadastro encontrado com este celular ou código. Verifique com seu líder o número exato cadastrado.');
        setLoading(false);
        return false;
      }

      const inviteData = matchedDoc.data();
      const userDocRef = doc(db, 'users', pendingLinkingUser.uid);

      const newUserProfile: User = {
        id: pendingLinkingUser.uid,
        uid: pendingLinkingUser.uid,
        name: inviteData.name || pendingLinkingUser.displayName || 'Sem Nome',
        email: pendingLinkingUser.email || inviteData.email || '',
        phone: inviteData.phone || clean,
        role: inviteData.role || 'Membro',
        roles: inviteData.roles || [],
        systemRole: inviteData.systemRole === 'Member' ? 'Viewer' : (inviteData.systemRole || 'Viewer'),
        active: true,
        avatar: pendingLinkingUser.photoURL || inviteData.avatar || undefined
      };

      await setDoc(userDocRef, newUserProfile);
      if (matchedDoc.id !== pendingLinkingUser.uid) {
        try {
          await deleteDoc(matchedDoc.ref);
        } catch {}
      }

      clearPendingInviteToken();
      setUserProfile(newUserProfile);
      setCurrentUser(pendingLinkingUser);
      setPendingLinkingUser(null);
      setError(null);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Auth] Erro ao vincular membro:', err);
      setError('Erro ao vincular: ' + (err.message || 'Tente novamente.'));
      setLoading(false);
      return false;
    }
  };

  const cancelLinking = async () => {
    setPendingLinkingUser(null);
    setError(null);
    if (auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
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
        pendingLinkingUser,
        loading,
        error,
        linkMemberWithPhoneOrCode,
        cancelLinking,
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

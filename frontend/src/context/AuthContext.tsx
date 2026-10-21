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
import { appLogger } from '../utils/logger';
import { cleanForFirestore } from '../services/firestoreService';

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
        appLogger.error('AUTH', 'Erro no redirect de autenticação', err);
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

          const rawPendingToken = getPendingInviteToken();
          const pendingToken = rawPendingToken ? rawPendingToken.trim() : null;
          appLogger.info('AUTH', `Processando login de ${user.email || user.uid}. Token pendente: ${pendingToken || 'nenhum'}`);
          
          if (pendingToken) {
            let matchedInviteData: any = null;
            let matchedDocRef: any = null;

            // 1. Tenta query direta no Firestore por inviteToken
            try {
              const tokenQuery = query(usersRef, where('inviteToken', '==', pendingToken));
              const tokenSnap = await getDocs(tokenQuery);
              if (!tokenSnap.empty) {
                matchedDocRef = tokenSnap.docs[0].ref;
                matchedInviteData = tokenSnap.docs[0].data();
                appLogger.info('AUTH', 'Convite localizado por query direta no Firestore', { name: matchedInviteData.name });
              }
            } catch (queryErr) {
              appLogger.warn('AUTH', 'Query direta por inviteToken falhou no Firestore, tentando busca ampla...', queryErr);
            }

            // 2. Busca ampla caso a query com where seja afetada por índices ou sensibilidade de caixa
            if (!matchedInviteData) {
              try {
                const allUsersSnap = await getDocs(usersRef);
                const foundDoc = allUsersSnap.docs.find(d => {
                  const data = d.data();
                  const t = (data.inviteToken || '').toString().trim().toLowerCase();
                  return t === pendingToken.toLowerCase();
                });
                if (foundDoc) {
                  matchedDocRef = foundDoc.ref;
                  matchedInviteData = foundDoc.data();
                  appLogger.info('AUTH', 'Convite localizado por busca ampla no Firestore', { name: matchedInviteData.name });
                }
              } catch (broadErr) {
                appLogger.warn('AUTH', 'Busca ampla de convites no Firestore falhou', broadErr);
              }
            }

            // 3. Fallback: verifica se o convite foi gerado em modo LocalStorage
            if (!matchedInviteData) {
              try {
                const localMembers = JSON.parse(localStorage.getItem('louvor_app_members') || '[]');
                const localFound = localMembers.find((m: any) => 
                  (m.inviteToken || '').toString().trim().toLowerCase() === pendingToken.toLowerCase()
                );
                if (localFound) {
                  matchedInviteData = localFound;
                  appLogger.info('AUTH', 'Convite localizado nos membros salvos no LocalStorage', { name: localFound.name });
                }
              } catch (localErr) {
                appLogger.warn('AUTH', 'Erro ao checar LocalStorage para convite', localErr);
              }
            }

            // Se o convite foi encontrado em qualquer uma das fontes, criamos o perfil do membro
            if (matchedInviteData) {
              const newUserProfile: User = {
                id: user.uid,
                uid: user.uid,
                name: matchedInviteData.name || user.displayName || 'Sem Nome',
                email: user.email || matchedInviteData.email || '',
                phone: matchedInviteData.phone || '',
                role: matchedInviteData.role || 'Membro',
                roles: matchedInviteData.roles || (matchedInviteData.role ? [matchedInviteData.role] : ['Vocal']),
                systemRole: matchedInviteData.systemRole === 'Member' ? 'Viewer' : (matchedInviteData.systemRole || 'Viewer'),
                active: true,
                avatar: user.photoURL || matchedInviteData.avatar || undefined
              };
              
              const cleanedProfile = cleanForFirestore(newUserProfile);
              try {
                await setDoc(userDocRef, cleanedProfile);
                appLogger.info('AUTH', `Perfil do membro criado com sucesso via inviteToken para ${newUserProfile.name}`);
              } catch (setDocErr) {
                appLogger.error('AUTH', 'Falha ao gravar perfil do membro convidado no Firestore', setDocErr);
                throw setDocErr;
              }

              if (matchedDocRef && matchedDocRef.id !== user.uid) {
                try {
                  await deleteDoc(matchedDocRef);
                } catch {
                  // Ignora se não puder deletar
                }
              }
              
              clearPendingInviteToken();
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              appLogger.warn('AUTH', `Token de convite "${pendingToken}" não encontrado em nenhuma fonte cadastrada.`);
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
              
              await setDoc(userDocRef, cleanForFirestore(newUserProfile));
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

                    await setDoc(userDocRef, cleanForFirestore(newUserProfile));
                    if (inviteDoc.id !== user.uid) {
                      try {
                        await deleteDoc(inviteDoc.ref);
                      } catch {}
                    }
                    autoLinked = true;
                    clearPendingInviteToken();
                  }
                } catch (autoErr) {
                  appLogger.warn('AUTH', 'Erro ao tentar auto-link por nome', autoErr);
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
            appLogger.warn('AUTH', 'Erro no listener em tempo real do perfil', err);
            setLoading(false);
          });

        } catch (err) {
          appLogger.error('AUTH', 'Erro ao buscar perfil do usuário', err);
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
    setLoading(true);
    if (!auth) {
      setLoading(false);
      setError('Autenticação não configurada.');
      appLogger.error('AUTH', 'Tentativa de login com Google mas Firebase Auth não está inicializado');
      return;
    }
    
    // Garante que o inviteToken presente na URL seja preservado em storage antes de qualquer redirecionamento (essencial no iPhone)
    const token = getPendingInviteToken();
    appLogger.info('AUTH', 'Iniciando signInWithPopup com Google...', { inviteToken: token });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      appLogger.info('AUTH', `Login com Google via Popup concluído com sucesso (${result.user.email})`);
    } catch (err: any) {
      // 1. Usuário fechou a janela ou cancelou a operação: não exibe erro alarmante
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        appLogger.info('AUTH', 'Login cancelado pelo usuário');
        setLoading(false);
        return;
      }

      // 2. Se o popup falhou ou foi bloqueado (comum no iOS Safari / Webviews / PWA), usa redirecionamento
      appLogger.warn('AUTH', `Popup bloqueado ou indisponível (${err?.code}). Tentando login por redirecionamento...`, err);
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectErr: any) {
        appLogger.error('AUTH', 'Falha no redirecionamento de login', redirectErr);
        setError(formatAuthError(redirectErr));
        setLoading(false);
      }
    }
  };

  const linkMemberWithPhoneOrCode = async (phoneOrCode: string): Promise<boolean> => {
    if (!pendingLinkingUser || !db) {
      appLogger.error('AUTH', 'Tentativa de vincular sem usuário pendente ou sem Firestore disponível');
      return false;
    }
    const clean = phoneOrCode.trim();
    if (!clean) {
      setError('Por favor, informe seu celular ou o código de convite.');
      return false;
    }

    setLoading(true);
    setError(null);
    appLogger.info('AUTH', `Tentando vincular conta ${pendingLinkingUser.email} com celular/código: "${clean}"`);

    try {
      const usersRef = collection(db, 'users');
      const allUsersSnap = await getDocs(usersRef);
      const cleanDigits = clean.replace(/\D/g, '');

      let matchedInviteData: any = null;
      let matchedDocRef: any = null;

      // 1. Busca em todos os documentos do Firestore
      const matchedDoc = allUsersSnap.docs.find(d => {
        const data = d.data();
        if (data.uid && data.uid !== pendingLinkingUser.uid) return false;

        // Bate por inviteToken
        if (data.inviteToken && data.inviteToken.trim().toLowerCase() === clean.toLowerCase()) {
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

      if (matchedDoc) {
        matchedDocRef = matchedDoc.ref;
        matchedInviteData = matchedDoc.data();
        appLogger.info('AUTH', 'Membro localizado no Firestore para vinculação', { name: matchedInviteData.name });
      } else {
        // 2. Fallback: busca em membros salvos no LocalStorage (modo local/offline)
        try {
          const localMembers = JSON.parse(localStorage.getItem('louvor_app_members') || '[]');
          const localMatch = localMembers.find((m: any) => {
            if (m.inviteToken && m.inviteToken.trim().toLowerCase() === clean.toLowerCase()) {
              return true;
            }
            if (cleanDigits.length >= 8 && m.phone) {
              const memberDigits = m.phone.replace(/\D/g, '');
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

          if (localMatch) {
            matchedInviteData = localMatch;
            appLogger.info('AUTH', 'Membro localizado no LocalStorage para vinculação', { name: localMatch.name });
          }
        } catch (localErr) {
          appLogger.warn('AUTH', 'Falha ao buscar membro no LocalStorage', localErr);
        }
      }

      if (!matchedInviteData) {
        const errorMsg = 'Nenhum cadastro encontrado com este celular ou código. Verifique com seu líder o número exato cadastrado.';
        appLogger.warn('AUTH', `Falha na vinculação: nenhum membro compatível com "${clean}"`);
        setError(errorMsg);
        setLoading(false);
        return false;
      }

      const userDocRef = doc(db, 'users', pendingLinkingUser.uid);

      const newUserProfile: User = {
        id: pendingLinkingUser.uid,
        uid: pendingLinkingUser.uid,
        name: matchedInviteData.name || pendingLinkingUser.displayName || 'Sem Nome',
        email: pendingLinkingUser.email || matchedInviteData.email || '',
        phone: matchedInviteData.phone || clean,
        role: matchedInviteData.role || 'Membro',
        roles: matchedInviteData.roles || (matchedInviteData.role ? [matchedInviteData.role] : ['Vocal']),
        systemRole: matchedInviteData.systemRole === 'Member' ? 'Viewer' : (matchedInviteData.systemRole || 'Viewer'),
        active: true,
        avatar: pendingLinkingUser.photoURL || matchedInviteData.avatar || undefined
      };

      await setDoc(userDocRef, cleanForFirestore(newUserProfile));
      appLogger.info('AUTH', `Conta vinculada com sucesso! Perfil criado para ${newUserProfile.name}`);

      if (matchedDocRef && matchedDocRef.id !== pendingLinkingUser.uid) {
        try {
          await deleteDoc(matchedDocRef);
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
      appLogger.error('AUTH', 'Erro ao vincular membro', err);
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
      appLogger.error('AUTH', 'Erro no login com Email', err);
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
      appLogger.error('AUTH', 'Erro no cadastro com Email', err);
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
      appLogger.error('AUTH', 'Erro na recuperação de senha', err);
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

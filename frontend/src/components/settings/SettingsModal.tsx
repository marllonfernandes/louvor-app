import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Cloud, Server, Smartphone, RefreshCw, Sun, Moon, Palette, Database, AlertTriangle, CheckCircle2, UploadCloud, User as UserIcon, LogOut } from 'lucide-react';
import { firebaseConfig, isFirestoreAvailable, isRealApiKeyFormat } from '../../config/firebase';
import { INITIAL_EVENTS, INITIAL_SONGS, INITIAL_MEMBERS, INITIAL_TEAMS } from '../../services/mockData';
import { seedFirestoreWithInitialData } from '../../services/firestoreService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const { theme, setTheme } = useTheme();
  const { userProfile, logout } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const isAdmin = userProfile?.systemRole === 'Admin';

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração no armazenamento local do navegador?')) {
      localStorage.setItem('louvor_app_events', JSON.stringify(INITIAL_EVENTS));
      localStorage.setItem('louvor_app_songs', JSON.stringify(INITIAL_SONGS));
      localStorage.setItem('louvor_app_members', JSON.stringify(INITIAL_MEMBERS));
      localStorage.setItem('louvor_app_teams', JSON.stringify(INITIAL_TEAMS));
      onShowToast('Dados Locais Restaurados', 'O armazenamento local foi reinicializado com os dados padrão.', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const handleSeedFirestore = async () => {
    if (!confirm('Deseja gravar as músicas, escalas, membros e equipes padrão diretamente no Google Cloud Firestore?')) {
      return;
    }

    setIsSeeding(true);
    try {
      const result = await seedFirestoreWithInitialData();
      if (result.success) {
        onShowToast('Firestore Sincronizado! 🎉', result.message, 'success');
      } else {
        onShowToast('Falha na Gravação Firestore', result.message, 'error');
      }
    } catch (err: any) {
      onShowToast('Erro de Conexão', err?.message || 'Falha ao se comunicar com o Firestore.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) {
      await logout();
      onClose();
    }
  };

  const currentApiKey = firebaseConfig.apiKey || '';
  const maskedApiKey = currentApiKey.length > 8 
    ? `${currentApiKey.substring(0, 6)}...${currentApiKey.substring(currentApiKey.length - 4)}`
    : (currentApiKey || 'Não configurada');

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações"
      subtitle={isAdmin ? "Status da sincronização em nuvem e infraestrutura" : "Preferências do aplicativo"}
    >
      <div className="space-y-4 text-left">
        {/* Perfil do Usuário */}
        {userProfile && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm leading-tight">{userProfile.name}</h4>
                <p className="text-[11px] text-slate-400">{userProfile.email}</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-medium">
                    {userProfile.systemRole}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                    {userProfile.role}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* Escolha do Tema (Light / Dark) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Palette className="text-amber-400" size={18} />
            <div>
              <h4 className="font-bold text-slate-100 text-xs">Aparência do Aplicativo</h4>
              <p className="text-[10px] text-slate-400">Escolha entre o tema Escuro ou Claro</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Moon size={15} />
              <span>Tema Escuro</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sun size={15} className="text-amber-400" />
              <span>Tema Claro</span>
            </button>
          </div>
        </div>

        {isAdmin && (
          <>
            {/* Card do Firestore com Diagnóstico */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="text-blue-600 dark:text-blue-400" size={18} />
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs">Google Cloud Firestore</h4>
                    <p className="text-[10px] text-slate-400">Banco de Dados em Tempo Real</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                  {firebaseConfig.projectId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Status Conexão:</span>
                  <span className="font-semibold flex items-center gap-1 text-slate-300">
                    {isFirestoreAvailable ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        SDK Inicializado
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} className="text-amber-400" />
                        Modo Local / Offline
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">API Key Injetada:</span>
                  <span className="font-semibold text-slate-300 font-mono text-[10px]">
                    {maskedApiKey}
                  </span>
                </div>
              </div>

              {/* Alerta de formato de chave de API */}
              {currentApiKey && !isRealApiKeyFormat && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex gap-2 items-start">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Formato de Chave Detectado: Service Account Key</p>
                    <p className="text-[10px] text-amber-200/90 leading-tight">
                      A chave configurada parece ser um Private Key ID de conta de serviço. Para o Firestore no navegador, é necessária uma <strong>Web API Key</strong> (inicia com <code className="bg-amber-950/60 px-1 py-0.5 rounded">AIzaSy...</code>).
                    </p>
                  </div>
                </div>
              )}

              {/* Ação de Semear o Firestore */}
              <div className="pt-1">
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isSeeding}
                  onClick={handleSeedFirestore}
                  icon={isSeeding ? <RefreshCw size={14} className="animate-spin text-blue-400" /> : <UploadCloud size={14} className="text-blue-400" />}
                >
                  {isSeeding ? 'Gravando no Firestore...' : 'Gravar Dados Iniciais no Firestore'}
                </Button>
              </div>
            </div>

            {/* Card do Cloud Run */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Server className="text-cyan-400" size={18} />
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">Google Cloud Run Backend</h4>
                  <p className="text-[10px] text-slate-400">Servidor Node.js com SPA Fallback</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Container Docker multi-stage com deploy automático via <code className="text-blue-600 dark:text-blue-400 bg-slate-900 px-1 py-0.5 rounded">make deploy-gcp</code>.
              </p>
            </div>

            {/* Card Mobile & PWA */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="text-purple-400" size={18} />
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">App Nativo Mobile (PWA)</h4>
                  <p className="text-[10px] text-slate-400">Instalação na tela inicial</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Adicione à tela de início no Safari (iOS) ou Chrome (Android) para usar como aplicativo nativo em tela cheia com cache offline.
              </p>
            </div>

            {/* Ações de Manutenção Local */}
            <div className="pt-1">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleResetData}
                icon={<RefreshCw size={15} />}
              >
                Restaurar Demonstração (Local Storage)
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};


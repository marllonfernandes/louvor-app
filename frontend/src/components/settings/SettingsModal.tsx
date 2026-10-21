import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { 
  Sun, 
  Moon, 
  Palette, 
  LogOut, 
  Activity, 
  Copy, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle,
  Bug,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MemberAvatar } from '../ui/MemberAvatar';
import { appLogger, LogEntry } from '../../utils/logger';
import { isFirestoreAvailable } from '../../config/firebase';

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
  const { userProfile, currentUser, logout } = useAuth();
  const profileAvatar = userProfile?.avatar || currentUser?.photoURL;

  // Estado do Diagnóstico do Sistema
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'errors'>('all');
  const [copied, setCopied] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Carrega logs e escuta novos eventos
    setLogs(appLogger.getLogs());
    const unsubscribe = appLogger.subscribe(() => {
      setLogs(appLogger.getLogs());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [isOpen]);

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) {
      await logout();
      onClose();
    }
  };

  const handleCopyLogs = async () => {
    try {
      const text = appLogger.exportLogsAsText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onShowToast('Copiado para a área de transferência!', 'Relatório de diagnóstico pronto para envio no suporte.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Falha ao copiar', 'Não foi possível acessar a área de transferência.', 'error');
    }
  };

  const handleClearLogs = () => {
    if (confirm('Deseja limpar todos os registros de diagnóstico salvos localmente?')) {
      appLogger.clearLogs();
      onShowToast('Logs limpos!', 'O histórico de diagnósticos foi reiniciado.', 'info');
    }
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const errorsCount = logs.filter(l => l.level === 'error').length;
  const filteredLogs = logs.filter(l => (logFilter === 'errors' ? l.level === 'error' : true)).reverse();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações"
      subtitle="Preferências do aplicativo e conta"
    >
      <div className="space-y-4 text-left pb-4">
        {/* Perfil do Usuário */}
        {userProfile && (
          <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <MemberAvatar
                name={userProfile.name}
                avatarUrl={profileAvatar}
                size="sm"
                shape="rounded-full"
                className="w-10 h-10 ring-2 ring-primary/30"
              />
              <div>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface leading-tight">
                  {userProfile.name}
                </h4>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  {userProfile.email}
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="font-label-sm text-[10px] bg-primary-container/20 text-primary px-2 py-0.5 rounded-full font-bold">
                    {userProfile.systemRole}
                  </span>
                  <span className="font-label-sm text-[10px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full border border-outline-variant/20">
                    {userProfile.role}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-error-container/20 text-error flex items-center justify-center hover:bg-error-container/40 transition-colors active:scale-95"
              title="Sair da Conta"
            >
              <LogOut size={17} />
            </button>
          </div>
        )}

        {/* Escolha do Tema (Light / Dark) */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Palette className="text-primary" size={18} />
            <div>
              <h4 className="font-headline-sm text-sm font-bold text-on-surface">Aparência do Aplicativo</h4>
              <p className="font-body-sm text-xs text-on-surface-variant">Escolha entre o tema Escuro ou Claro</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-primary-container text-on-primary-container shadow-sm border border-primary/40'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              <Moon size={15} />
              <span>Tema Escuro</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-primary-container text-on-primary-container shadow-sm border border-primary/40'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              <Sun size={15} className="text-amber-300" />
              <span>Tema Claro</span>
            </button>
          </div>
        </div>

        {/* Diagnóstico do Sistema & Registro de Erros */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(prev => !prev)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Activity size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">Diagnóstico & Logs</h4>
                  {errorsCount > 0 ? (
                    <span className="text-[10px] bg-error-container/40 text-error px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {errorsCount} {errorsCount === 1 ? 'erro' : 'erros'}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <ShieldCheck size={10} />
                      Estável
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Conexão, integridade e relatório de suporte
                </p>
              </div>
            </div>
            <div className="text-on-surface-variant">
              {isDiagnosticOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {isDiagnosticOpen && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-outline-variant/15 animate-fade-in">
              {/* Badges Rápidas de Conectividade e Ambiente */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-surface-container-high/60 border border-outline-variant/15 p-2 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-on-surface">
                    {isOnline ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Wifi size={12} /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400">
                        <WifiOff size={12} /> Offline
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Conexão</span>
                </div>

                <div className="bg-surface-container-high/60 border border-outline-variant/15 p-2 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-on-surface">
                    <Database size={12} className={isFirestoreAvailable ? 'text-primary' : 'text-amber-400'} />
                    <span>{isFirestoreAvailable ? 'Firestore' : 'Local'}</span>
                  </div>
                  <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Armazenamento</span>
                </div>

                <div className="bg-surface-container-high/60 border border-outline-variant/15 p-2 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-on-surface">
                    <span>{import.meta.env.DEV ? 'Dev' : 'Produção'}</span>
                  </div>
                  <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Modo</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                      logFilter === 'all'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Todos ({logs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('errors')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                      logFilter === 'errors'
                        ? 'bg-error-container text-error'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Bug size={11} />
                    Erros ({errorsCount})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-bold transition-all active:scale-95 border border-outline-variant/20"
                    title="Copiar relatório completo de diagnóstico"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="p-1 rounded-lg bg-surface-container-high hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-all active:scale-95 border border-outline-variant/20"
                      title="Limpar logs locais"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista dos Logs */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredLogs.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant space-y-1 bg-surface-container-low rounded-xl border border-outline-variant/10">
                    <ShieldCheck size={26} className="mx-auto text-emerald-400/80 mb-1" />
                    <p className="text-xs font-bold text-on-surface">Nenhum registro encontrado</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {logFilter === 'errors' 
                        ? 'Nenhum erro de execução ou autenticação foi detectado.' 
                        : 'O histórico de logs está limpo.'}
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((entry) => {
                    const isExpanded = expandedLogIds.has(entry.id);
                    const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
                    const isError = entry.level === 'error';
                    const isWarn = entry.level === 'warn';

                    return (
                      <div
                        key={entry.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          isError
                            ? 'bg-error-container/10 border-error/30 text-on-surface'
                            : isWarn
                            ? 'bg-amber-500/10 border-amber-500/30 text-on-surface'
                            : 'bg-surface-container-low border-outline-variant/15 text-on-surface'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-on-surface-variant">{time}</span>
                            <span
                              className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded font-mono ${
                                isError
                                  ? 'bg-error/20 text-error'
                                  : isWarn
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-primary-container/30 text-primary'
                              }`}
                            >
                              {entry.category}
                            </span>
                          </div>

                          {entry.detail && (
                            <button
                              type="button"
                              onClick={() => toggleExpandLog(entry.id)}
                              className="text-[10px] text-primary hover:underline font-bold"
                            >
                              {isExpanded ? 'Ocultar' : 'Detalhes'}
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] font-semibold mt-1 text-on-surface leading-snug">
                          {entry.message}
                        </p>

                        {isExpanded && entry.detail && (
                          <pre className="mt-2 p-2 bg-black/40 rounded-lg text-[10px] font-mono text-on-surface-variant overflow-x-auto whitespace-pre-wrap max-h-32 border border-outline-variant/10">
                            {entry.detail}
                          </pre>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

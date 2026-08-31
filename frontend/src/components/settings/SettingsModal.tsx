import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Cloud, Server, Smartphone, RefreshCw, Sun, Moon, Palette } from 'lucide-react';
import { firebaseConfig } from '../../config/firebase';
import { INITIAL_EVENTS, INITIAL_SONGS, INITIAL_MEMBERS, INITIAL_TEAMS } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';

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

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração originais?')) {
      localStorage.setItem('louvor_app_events', JSON.stringify(INITIAL_EVENTS));
      localStorage.setItem('louvor_app_songs', JSON.stringify(INITIAL_SONGS));
      localStorage.setItem('louvor_app_members', JSON.stringify(INITIAL_MEMBERS));
      localStorage.setItem('louvor_app_teams', JSON.stringify(INITIAL_TEAMS));
      onShowToast('Dados Restaurados', 'O banco local foi reinicializado com sucesso.', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações & Cloud Run"
      subtitle="Status da sincronização em nuvem e infraestrutura"
    >
      <div className="space-y-4 text-left">
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

        {/* Card do Firestore */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="text-blue-600 dark:text-blue-400" size={18} />
              <div>
                <h4 className="font-bold text-slate-100 text-xs">Cloud Firestore / MongoDB</h4>
                <p className="text-[10px] text-slate-400">Projeto Google Cloud</p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Database:</span>
              <span className="font-semibold text-slate-300">app-unida (Enterprise)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Região:</span>
              <span className="font-semibold text-slate-300">nam5 (United States)</span>
            </div>
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
            O aplicativo possui container Docker multi-stage e backend Node.js integrado, pronto para ser publicado com <code className="text-blue-600 dark:text-blue-400 bg-slate-900 px-1 py-0.5 rounded">make deploy-gcp</code>.
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

        {/* Ações de Manutenção */}
        <div className="pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleResetData}
            icon={<RefreshCw size={15} />}
          >
            Restaurar Dados Padrão de Demonstração
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Sun, Moon, Palette, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MemberAvatar } from '../ui/MemberAvatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { theme, setTheme } = useTheme();
  const { userProfile, currentUser, logout } = useAuth();
  const profileAvatar = userProfile?.avatar || currentUser?.photoURL;

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) {
      await logout();
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações"
      subtitle="Preferências do aplicativo e conta"
    >
      <div className="space-y-4 text-left">
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
      </div>
    </BottomSheet>
  );
};

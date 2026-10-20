import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Calendar,
  Music,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Trash2,
  ChevronRight,
  Send
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { AppNotification, Member, WorshipEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  checkCurrentDevicePushSubscription,
  enableDevicePushNotifications,
  getActiveServiceWorkerRegistration,
  isIosDeviceNotStandalone,
  sendPushToSubscriptions,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotificationById
} from '../../services/notificationService';
import { isSamePersonName } from '../../utils/avatar';
import { formatDateBR } from '../../utils/worshipEvent';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  members: Member[];
  events: WorshipEvent[];
  onSelectEvent: (event: WorshipEvent) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Agora mesmo';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  members,
  events,
  onSelectEvent,
  onShowToast
}) => {
  const { userProfile } = useAuth();
  const [isPushActive, setIsPushActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  const isLeaderOrAdmin = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const iosNeedsInstall = isIosDeviceNotStandalone();

  useEffect(() => {
    if (isOpen) {
      checkCurrentDevicePushSubscription().then(setIsPushActive);
    }
  }, [isOpen]);

  const userNotifications = notifications.filter(n => {
    if (isLeaderOrAdmin) return true;
    if (!userProfile?.name) return true;
    if (n.targetMembers.includes('*')) return true;
    return n.targetMembers.some(target => isSamePersonName(target, userProfile.name));
  });

  const unreadCount = userNotifications.filter(
    n => !userProfile?.name || !n.readBy.some(r => isSamePersonName(r, userProfile.name))
  ).length;

  const handleEnablePush = async () => {
    if (!userProfile) return;
    setIsActivating(true);
    try {
      const result = await enableDevicePushNotifications(userProfile, members);
      if (result.success) {
        setIsPushActive(true);
        onShowToast('Notificações Ativadas! 🔔', result.message, 'success');
      } else {
        onShowToast('Atenção', result.message, 'info');
      }
    } catch (err: any) {
      onShowToast('Erro ao ativar', err?.message || 'Não foi possível ativar as notificações.', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!userProfile) return;
    setIsTestingPush(true);
    try {
      const reg = await getActiveServiceWorkerRegistration();
      const sub = await reg?.pushManager.getSubscription();
      const subJson = sub?.toJSON();

      if (subJson?.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        const res = await sendPushToSubscriptions(
          [
            {
              endpoint: subJson.endpoint,
              keys: {
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth
              }
            }
          ],
          {
            title: '🔔 Teste do Louvor App!',
            body: `Olá ${userProfile.name.split(' ')[0]}! Suas notificações no celular estão funcionando perfeitamente mesmo com o app fechado.`,
            tag: `louvor-test-${Date.now()}`
          }
        );

        if (res.sentCount > 0) {
          onShowToast('Notificação Enviada! 📱', 'Verifique o alerta na barra superior do seu celular.', 'success');
        } else {
          // Fallback local via ServiceWorker se o servidor estiver offline
          await reg?.showNotification('🔔 Teste do Louvor App!', {
            body: `Olá ${userProfile.name.split(' ')[0]}! Notificações ativas neste dispositivo.`,
            icon: '/pwa-192x192.png',
            badge: '/badge-96x96.png'
          });
          onShowToast('Notificação Disparada! 📱', 'Alerta exibido no dispositivo.', 'success');
        }
      } else {
        await handleEnablePush();
      }
    } catch {
      onShowToast('Erro no Teste', 'Não foi possível enviar a notificação de teste.', 'error');
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleClickNotification = async (notif: AppNotification) => {
    if (userProfile?.name) {
      await markNotificationRead(notif.id, userProfile.name);
    }
    if (notif.eventId) {
      const targetEvent = events.find(e => e.id === notif.eventId);
      if (targetEvent) {
        onClose();
        setTimeout(() => onSelectEvent(targetEvent), 200);
      }
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Notificações & Alertas"
      subtitle="Avisos de escalas, repertório, vocais e confirmações"
    >
      <div className="space-y-4 text-left">
        {/* Card de Ativação do Web Push no Celular (Funciona com App Fechado) */}
        <div
          className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
            isPushActive
              ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30'
              : 'bg-blue-50/90 dark:bg-gradient-to-br dark:from-blue-950/50 dark:to-slate-950 border-blue-300 dark:border-blue-500/35'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isPushActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                }`}
              >
                {isPushActive ? <BellRing size={18} /> : <Smartphone size={18} />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {isPushActive
                      ? 'Notificações Ativas neste Celular'
                      : 'Receber Alertas no Celular'}
                  </h4>
                  {isPushActive && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {isPushActive
                    ? 'Você será avisado na tela do celular sempre que uma escala ou música mudar, mesmo com o app fechado.'
                    : 'Ative para o celular apitar sempre que houver nova escala, mudança de louvor ou confirmação.'}
                </p>
              </div>
            </div>
          </div>

          {iosNeedsInstall && !isPushActive && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
              📲 <strong>Usando iPhone?</strong> No Safari, toque no botão <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong> para o iOS liberar notificações com o app fechado.
            </div>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            {!isPushActive ? (
              <button
                type="button"
                disabled={isActivating}
                onClick={handleEnablePush}
                className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <BellRing size={14} />
                <span>{isActivating ? 'Ativando no celular...' : 'Ativar Notificações no Celular'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isTestingPush}
                onClick={handleSendTestPush}
                className="py-2 px-3.5 rounded-full bg-white/90 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Send size={12} />
                <span>{isTestingPush ? 'Enviando teste...' : 'Testar Notificação no Meu Celular'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Cabeçalho da Lista de Notificações */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Histórico de Atualizações
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                {unreadCount} nova{unreadCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {unreadCount > 0 && userProfile?.name && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead(userNotifications, userProfile.name)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline active:scale-95 transition-all cursor-pointer"
            >
              <CheckCheck size={13} />
              <span>Marcar lidas</span>
            </button>
          )}
        </div>

        {/* Lista de Cards de Notificações */}
        {userNotifications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 dark:bg-slate-950/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/70 space-y-2">
            <Bell size={26} className="mx-auto text-slate-400 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nenhuma notificação por enquanto
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Qualquer mudança nas escalas, músicas ou confirmações aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userNotifications.map(notif => {
              const isUnread =
                !userProfile?.name ||
                !notif.readBy.some(r => isSamePersonName(r, userProfile.name));

              const iconConfig =
                notif.type === 'event_created'
                  ? {
                      icon: Calendar,
                      bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    }
                  : notif.type === 'repertoire_updated'
                  ? {
                      icon: Music,
                      bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                    }
                  : notif.type === 'presence_updated'
                  ? {
                      icon: CheckCircle2,
                      bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }
                  : {
                      icon: Sparkles,
                      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    };

              const IconComp = iconConfig.icon;
              const hasEvent = Boolean(notif.eventId && events.some(e => e.id === notif.eventId));

              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickNotification(notif)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    hasEvent ? 'cursor-pointer active:scale-[0.99]' : ''
                  } ${
                    isUnread
                      ? 'bg-blue-50/60 dark:bg-slate-900/95 border-blue-400/50 dark:border-blue-500/40 shadow-xs'
                      : 'bg-white/90 dark:bg-slate-950/75 border-slate-200/80 dark:border-slate-800/80 opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${iconConfig.bg}`}
                    >
                      <IconComp size={18} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                        )}
                        <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                          {notif.title}
                        </h5>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.body}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                        {notif.eventDate && (
                          <span>• Culto: {formatDateBR(notif.eventDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isLeaderOrAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotificationById(notif.id);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remover aviso"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {hasEvent && (
                      <ChevronRight size={15} className="text-slate-400 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

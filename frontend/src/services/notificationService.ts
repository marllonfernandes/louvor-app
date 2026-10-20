import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { db, isFirestoreAvailable } from '../config/firebase';
import {
  AppNotification,
  ConfirmationStatus,
  Member,
  PushSubscriptionItem,
  User,
  WorshipEvent
} from '../types';
import { isSamePersonName } from '../utils/avatar';
import { formatDateBR, getEventSongItems, getSongMinisters } from '../utils/worshipEvent';

const FALLBACK_VAPID_PUBLIC_KEY =
  'BCNy8yL_dyk1D-lCduCPAv5pm70BM_XDjjEQx8clv8RfZrVedAmvXNOnqbvAhmhb6qWN_j2wBNRWNWX5Bmtf9PA';

const NOTIFICATIONS_STORAGE_KEY = 'louvor_app_notifications';

type NotificationListener = (items: AppNotification[]) => void;
const localNotificationListeners = new Set<NotificationListener>();

function getLocalNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setLocalNotifications(list: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
  } catch {
    // Ignora falha de quota
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIosDeviceNotStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  return isIOS && !isStandalone;
}

export async function getActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;
    return reg || (await navigator.serviceWorker.ready);
  } catch (err) {
    console.warn('[Push] Erro ao obter ServiceWorkerRegistration:', err);
    return null;
  }
}

export async function checkCurrentDevicePushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await getActiveServiceWorkerRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub);
  } catch {
    return false;
  }
}

async function fetchVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch('/api/push/public-key');
    if (res.ok) {
      const data = await res.json();
      if (data?.publicKey) return data.publicKey;
    }
  } catch {
    // Usa chave pública embutida caso offline
  }
  return FALLBACK_VAPID_PUBLIC_KEY;
}

/**
 * Solicita permissão de notificação no celular e salva a assinatura Web Push no perfil do membro.
 */
export async function enableDevicePushNotifications(
  userProfile: User,
  members: Member[]
): Promise<{ success: boolean; message: string; subscription?: PushSubscriptionItem }> {
  if (!isPushSupported()) {
    if (isIosDeviceNotStandalone()) {
      return {
        success: false,
        message:
          'No iPhone, toque em "Compartilhar" no Safari e escolha "Adicionar à Tela de Início" para ativar as notificações.'
      };
    }
    return {
      success: false,
      message: 'Seu navegador atual não suporta notificações Web Push.'
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message: 'Permissão de notificação negada no navegador. Libere nas configurações do site no celular.'
    };
  }

  const reg = await getActiveServiceWorkerRegistration();
  if (!reg) {
    return {
      success: false,
      message: 'Não foi possível registrar o serviço de segundo plano (Service Worker).'
    };
  }

  const publicKey = await fetchVapidPublicKey();
  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  let pushSub = await reg.pushManager.getSubscription();
  if (!pushSub) {
    pushSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as unknown as BufferSource
    });
  }

  const subJson = pushSub.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    return {
      success: false,
      message: 'Falha ao gerar chaves de criptografia Push no dispositivo.'
    };
  }

  const subscriptionItem: PushSubscriptionItem = {
    endpoint: subJson.endpoint,
    expirationTime: subJson.expirationTime ?? null,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth
    },
    userAgent: navigator.userAgent.slice(0, 120),
    updatedAt: Date.now()
  };

  // Salva a assinatura no documento do usuário logado e em qualquer documento correspondente em `users`
  await saveSubscriptionForUser(userProfile, members, subscriptionItem);

  return {
    success: true,
    message: 'Notificações ativadas neste celular! Você receberá alertas mesmo com o app fechado.',
    subscription: subscriptionItem
  };
}

/**
 * Sincroniza silenciosamente a assinatura Push do aparelho caso o membro já tenha dado permissão antes.
 */
export async function syncExistingPushSubscription(userProfile: User | null, members: Member[]): Promise<void> {
  if (!userProfile || !isPushSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const reg = await getActiveServiceWorkerRegistration();
    if (!reg) return;
    const pushSub = await reg.pushManager.getSubscription();
    if (!pushSub) return;

    const subJson = pushSub.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return;

    const alreadySaved = (userProfile.pushSubscriptions || []).some(
      s => s.endpoint === subJson.endpoint
    );
    if (alreadySaved) return;

    const subscriptionItem: PushSubscriptionItem = {
      endpoint: subJson.endpoint,
      expirationTime: subJson.expirationTime ?? null,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
      },
      userAgent: navigator.userAgent.slice(0, 120),
      updatedAt: Date.now()
    };

    await saveSubscriptionForUser(userProfile, members, subscriptionItem);
  } catch {
    // Silencioso
  }
}

async function saveSubscriptionForUser(
  userProfile: User,
  members: Member[],
  subscriptionItem: PushSubscriptionItem
): Promise<void> {
  if (!isFirestoreAvailable || !db) return;

  const targetDocs = new Set<string>();
  if (userProfile.id) targetDocs.add(userProfile.id);
  if (userProfile.uid) targetDocs.add(userProfile.uid);

  for (const m of members) {
    if (
      m.id === userProfile.id ||
      (m.email && userProfile.email && m.email.trim().toLowerCase() === userProfile.email.trim().toLowerCase()) ||
      isSamePersonName(m.name, userProfile.name)
    ) {
      targetDocs.add(m.id);
    }
  }

  for (const docId of targetDocs) {
    const existingMember = members.find(m => m.id === docId);
    const currentSubs = existingMember?.pushSubscriptions || userProfile.pushSubscriptions || [];
    const filtered = currentSubs.filter(s => s.endpoint !== subscriptionItem.endpoint);
    const updatedSubs = [...filtered, subscriptionItem].slice(-5); // Mantém até 5 aparelhos por membro

    try {
      await setDoc(
        doc(db, 'users', docId),
        { pushSubscriptions: updatedSubs },
        { merge: true }
      );
    } catch (e) {
      console.warn(`[Push] Não foi possível salvar assinatura no doc ${docId}:`, e);
    }
  }
}

/**
 * Envia uma notificação Push real para uma lista de assinaturas via Backend (/api/push/send)
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionItem[],
  payload: {
    title: string;
    body: string;
    eventId?: string;
    tag?: string;
  }
): Promise<{ sentCount: number }> {
  if (!subscriptions || subscriptions.length === 0) {
    return { sentCount: 0 };
  }

  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptions,
        notification: {
          title: payload.title,
          body: payload.body,
          eventId: payload.eventId,
          tag: payload.tag || `louvor-event-${payload.eventId || Date.now()}`,
          url: payload.eventId ? `/?eventId=${encodeURIComponent(payload.eventId)}` : '/',
          timestamp: Date.now()
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { sentCount: data.sentCount || 0 };
    }
  } catch (err) {
    console.warn('[Push] Erro ao chamar /api/push/send:', err);
  }

  return { sentCount: 0 };
}

// ----------------- CENTRAL DE NOTIFICAÇÕES (HISTÓRICO EM TEMPO REAL) -----------------

export function subscribeToNotifications(callback: (notifications: AppNotification[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'notifications');
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as AppNotification))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 50);
          setLocalNotifications(list);
          callback(list);
        },
        () => {
          callback(getLocalNotifications());
        }
      );
    } catch {
      // Fallback local
    }
  }

  localNotificationListeners.add(callback);
  callback(getLocalNotifications());
  return () => {
    localNotificationListeners.delete(callback);
  };
}

export async function createAppNotification(
  notif: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>,
  actorName?: string
): Promise<AppNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newNotif: AppNotification = {
    ...notif,
    id,
    actorName,
    readBy: actorName ? [actorName] : [],
    createdAt: Date.now()
  };

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (e) {
      console.warn('[Notifications] Erro ao gravar notificação no Firestore:', e);
    }
  }

  const current = getLocalNotifications();
  const updated = [newNotif, ...current].slice(0, 50);
  setLocalNotifications(updated);
  localNotificationListeners.forEach(l => l(updated));

  return newNotif;
}

export async function markNotificationRead(notificationId: string, readerName: string): Promise<void> {
  if (!readerName) return;

  if (isFirestoreAvailable && db) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(readerName)
      });
    } catch {
      // Fallback local
    }
  }

  const current = getLocalNotifications();
  const updated = current.map(n =>
    n.id === notificationId && !n.readBy.includes(readerName)
      ? { ...n, readBy: [...n.readBy, readerName] }
      : n
  );
  setLocalNotifications(updated);
  localNotificationListeners.forEach(l => l(updated));
}

export async function markAllNotificationsRead(notifications: AppNotification[], readerName: string): Promise<void> {
  if (!readerName) return;
  const unread = notifications.filter(
    n => !n.readBy.some(r => isSamePersonName(r, readerName))
  );
  await Promise.all(unread.map(n => markNotificationRead(n.id, readerName)));
}

export async function clearNotificationById(notificationId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch {
      // Ignora erro
    }
  }
  const updated = getLocalNotifications().filter(n => n.id !== notificationId);
  setLocalNotifications(updated);
  localNotificationListeners.forEach(l => l(updated));
}

// ----------------- DETECTOR INTELIGENTE DE MUDANÇAS EM EVENTOS -----------------

function collectSubscriptionsForMembers(
  targetMemberNames: string[],
  members: Member[],
  excludeActorName?: string
): PushSubscriptionItem[] {
  const subs: PushSubscriptionItem[] = [];
  const includeAll = targetMemberNames.includes('*');

  for (const m of members) {
    if (!m.pushSubscriptions || m.pushSubscriptions.length === 0) continue;

    // Não envia push para a própria pessoa que acabou de fazer a edição
    if (excludeActorName && isSamePersonName(m.name, excludeActorName)) {
      continue;
    }

    const isTargeted =
      includeAll ||
      targetMemberNames.some(targetName => isSamePersonName(m.name, targetName));

    if (isTargeted) {
      subs.push(...m.pushSubscriptions);
    }
  }

  return subs;
}

/**
 * Dispara notificação no Sininho e Web Push no celular quando um evento é criado ou editado.
 */
export async function notifyEventSaved(
  previousEvent: WorshipEvent | undefined,
  savedEvent: WorshipEvent,
  members: Member[],
  actorName?: string
): Promise<void> {
  const scheduledNames = Object.keys(savedEvent.confirmed || {});
  const targetMembers = scheduledNames.length > 0 ? scheduledNames : ['*'];
  const dateFormatted = formatDateBR(savedEvent.date);

  let title = '';
  let body = '';
  let type: AppNotification['type'] = 'event_updated';

  if (!previousEvent) {
    type = 'event_created';
    title = `📅 Nova Escala: ${savedEvent.title}`;
    body = `Culto agendado para ${dateFormatted} às ${savedEvent.time}${
      savedEvent.team ? ` (${savedEvent.team})` : ''
    }. Confira a escala e confirme sua presença!`;
  } else {
    // Verifica o que mudou entre previousEvent e savedEvent
    const prevItems = getEventSongItems(previousEvent);
    const nextItems = getEventSongItems(savedEvent);

    const prevMinistersSig = prevItems
      .map(it => `${it.songId}:${getSongMinisters(it).map(m => `${m.name}(${m.action})`).join(',')}`)
      .join('|');
    const nextMinistersSig = nextItems
      .map(it => `${it.songId}:${getSongMinisters(it).map(m => `${m.name}(${m.action})`).join(',')}`)
      .join('|');

    const prevSongsSig = prevItems.map(it => `${it.songId}:${it.harpaNumber || ''}`).join('|');
    const nextSongsSig = nextItems.map(it => `${it.songId}:${it.harpaNumber || ''}`).join('|');

    if (prevMinistersSig !== nextMinistersSig) {
      type = 'repertoire_updated';
      title = `🎤 Vocais Atualizados: ${savedEvent.title}`;
      body = `${actorName || 'Um integrante'} atualizou os vocais/ministrantes dos louvores de ${dateFormatted}.`;
    } else if (prevSongsSig !== nextSongsSig) {
      type = 'repertoire_updated';
      title = `🎵 Repertório Atualizado: ${savedEvent.title}`;
      body = `A lista de louvores do culto de ${dateFormatted} (${savedEvent.time}) foi atualizada (${nextItems.length} louvores).`;
    } else if (previousEvent.date !== savedEvent.date || previousEvent.time !== savedEvent.time) {
      type = 'event_updated';
      title = `⏰ Data/Horário Alterado: ${savedEvent.title}`;
      body = `O evento foi atualizado para ${dateFormatted} às ${savedEvent.time}.`;
    } else {
      type = 'event_updated';
      title = `🔔 Escala Atualizada: ${savedEvent.title}`;
      body = `${actorName || 'A liderança'} atualizou os detalhes do evento de ${dateFormatted} às ${savedEvent.time}.`;
    }
  }

  // 1. Salva na Central de Notificações (Firestore + Local)
  await createAppNotification(
    {
      title,
      body,
      eventId: savedEvent.id,
      eventTitle: savedEvent.title,
      eventDate: savedEvent.date,
      type,
      targetMembers
    },
    actorName
  );

  // 2. Dispara Web Push para os celulares dos membros escalados (mesmo com o app fechado)
  const subscriptions = collectSubscriptionsForMembers(targetMembers, members, actorName);
  await sendPushToSubscriptions(subscriptions, {
    title,
    body,
    eventId: savedEvent.id,
    tag: `louvor-event-${savedEvent.id}`
  });
}

/**
 * Dispara notificação quando um integrante confirma ou recusa presença na escala.
 */
export async function notifyPresenceChanged(
  event: WorshipEvent,
  memberName: string,
  status: ConfirmationStatus,
  justification: string | undefined,
  members: Member[]
): Promise<void> {
  const dateFormatted = formatDateBR(event.date);

  const title =
    status === 'accepted'
      ? `✅ Presença Confirmada: ${event.title}`
      : status === 'declined'
      ? `❌ Ausência na Escala: ${event.title}`
      : `⏳ Status Pendente: ${event.title}`;

  const body =
    status === 'accepted'
      ? `${memberName} confirmou presença na escala de ${dateFormatted} às ${event.time}.`
      : status === 'declined'
      ? `${memberName} informou que não poderá ir em ${dateFormatted}${
          justification ? ` (Motivo: "${justification}")` : '.'
        }`
      : `${memberName} alterou o status para pendente em ${dateFormatted}.`;

  // Destinatários: integrantes escalados no evento + líderes/admins
  const scheduledNames = Object.keys(event.confirmed || {});
  const leaderNames = members
    .filter(
      m =>
        m.systemRole === 'Admin' ||
        m.systemRole === 'Editor' ||
        m.roles?.includes('Líder') ||
        m.role?.includes('Líder')
    )
    .map(m => m.name);

  const targetMembers = Array.from(new Set([...scheduledNames, ...leaderNames]));

  await createAppNotification(
    {
      title,
      body,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      type: 'presence_updated',
      targetMembers
    },
    memberName
  );

  const subscriptions = collectSubscriptionsForMembers(targetMembers, members, memberName);
  await sendPushToSubscriptions(subscriptions, {
    title,
    body,
    eventId: event.id,
    tag: `louvor-presence-${event.id}-${Date.now()}`
  });
}

export type ConfirmationStatus = 'accepted' | 'declined' | 'pending';

export type EventType = 'culto' | 'ensaio' | 'congresso' | 'especial' | 'jovens' | 'ceia' | 'batismo' | 'outro';

export interface SongVocalAssignment {
  name: string;
  action?: 'canta' | 'ministra';
}

export interface EventSongItem {
  songId: string;
  block?: string; // Ex: 'Abertura', 'Ceia', 'Batismo', 'Ministração'
  ministerName?: string; // Primeiro integrante (compatibilidade mantida)
  ministerAction?: 'canta' | 'ministra'; // Ação do primeiro integrante
  ministers?: SongVocalAssignment[]; // Lista de 1 ou 2 integrantes que vão cantar ou ministrar
  isHarpa?: boolean; // Indica se é um hino da Harpa Cristã adicionado diretamente
  harpaNumber?: string; // Número do hino da Harpa Cristã (ex: "301")
  harpaTitle?: string; // Nome do hino da Harpa Cristã (ex: "Vem Cear")
  harpaKey?: string; // Tom opcional do hino da Harpa Cristã (ex: "C")
}

export interface WorshipEvent {
  id: string;
  title: string;
  type?: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  team?: string;
  confirmed: Record<string, ConfirmationStatus>; // { [userId]: 'accepted' | 'declined' | 'pending' }
  justifications?: Record<string, string>; // { [userId]: 'Trabalho' }
  songIds?: string[]; // IDs das músicas escaladas para este culto (compatibilidade mantida)
  songItems?: EventSongItem[]; // Músicas estruturadas com momentos/blocos e ministrante do vocal
  songBlocksOrder?: string[]; // Ordem personalizada dos blocos (ex: ['Abertura', 'Batismo', 'Ceia'])
  notes?: string;
  createdAt?: number;
}

export type SongCategory = 'Adoração' | 'Celebração' | 'Ministração' | 'Abertura' | 'Santa Ceia' | 'Geral';

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  key: string;
  bpm?: number;
  category?: SongCategory;
  group?: string; // Ex: "Congresso Varões"
  cifraUrl?: string;
  lyrics?: string;
  notes?: string;
  createdAt?: number;
}

export interface RepertoireGroupSummary {
  name: string;
  songCount: number;
  songIds: string[];
}

export interface AdoptionSong {
  id: string;
  title: string;
  artist: string;
  url?: string;
  suggestedKey?: string;
  suggestedCategory?: SongCategory;
  notes?: string;
  suggestedByUserId?: string;
  suggestedByMemberName?: string;
  createdAt: number;
  votes: string[]; // IDs dos usuários que votaram
  status: 'voting' | 'approved' | 'rejected';
  approvedAt?: number;
  approvedByUserId?: string;
  approvedByMemberName?: string;
}

export type MemberRole = 
  | 'Líder'
  | 'Ministro de Louvor'
  | 'Vocal' 
  | 'Backing Vocal'
  | 'Teclado' 
  | 'Violão' 
  | 'Guitarra' 
  | 'Baixo' 
  | 'Bateria' 
  | 'Saxofone / Metais'
  | 'Sonoplastia' 
  | 'Mídia / Projeção'
  | 'Outro';

export interface PushSubscriptionItem {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  updatedAt?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  eventId?: string;
  eventTitle?: string;
  eventDate?: string;
  type: 'event_created' | 'event_updated' | 'presence_updated' | 'repertoire_updated';
  actorName?: string;
  targetMembers: string[]; // Nomes dos integrantes destinatários (ou '*' para todos)
  readBy: string[]; // Nomes/IDs dos integrantes que já visualizaram
  createdAt: number;
}

export interface Member {
  id: string; // Document ID (anteriormente tratado apenas como Auth UID, mas agora pode ser mem_xxx)
  uid?: string; // Auth UID real, após o usuário aceitar o convite e se cadastrar
  inviteToken?: string; // Token gerado para o link mágico de convite
  systemRole?: 'Admin' | 'Editor' | 'Viewer';
  name: string;
  role: string; // Formato amigável (ex: "Líder, Violão")
  roles?: string[]; // Múltiplas funções selecionadas
  phone: string;
  email?: string;
  active?: boolean;
  avatar?: string;
  pushSubscriptions?: PushSubscriptionItem[];
}

export type User = Member;

export interface Team {
  id: string;
  name: string;
  members: string[]; // IDs dos membros
  color?: string;
  description?: string;
}

export type TabType = 'inicio' | 'agenda' | 'playlist' | 'team' | 'metrics' | 'settings';

export interface SyncStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastSyncedAt?: Date;
  pendingChangesCount: number;
}

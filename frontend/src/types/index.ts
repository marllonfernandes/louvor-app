export type ConfirmationStatus = 'accepted' | 'declined' | 'pending';

export type EventType = 'culto' | 'ensaio' | 'especial' | 'jovens' | 'ceia' | 'outro';

export interface WorshipEvent {
  id: string;
  title: string;
  type?: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  team?: string;
  confirmed: Record<string, ConfirmationStatus>; // { [userId]: 'accepted' | 'declined' | 'pending' }
  songIds?: string[]; // IDs das músicas escaladas para este culto
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
  cifraUrl?: string;
  lyrics?: string;
  notes?: string;
  createdAt?: number;
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
}

export type User = Member;

export interface Team {
  id: string;
  name: string;
  members: string[]; // IDs dos membros
  color?: string;
  description?: string;
}

export type TabType = 'agenda' | 'playlist' | 'team' | 'metrics' | 'settings';

export interface SyncStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastSyncedAt?: Date;
  pendingChangesCount: number;
}

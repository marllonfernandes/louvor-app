import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db, isFirestoreAvailable } from '../config/firebase';
import { WorshipEvent, Song, Member, Team, ConfirmationStatus, AdoptionSong, TeamNotice } from '../types';
import { INITIAL_EVENTS, INITIAL_SONGS, INITIAL_MEMBERS, INITIAL_TEAMS, INITIAL_ADOPTION_SONGS, INITIAL_NOTICES } from './mockData';
import { isValidAvatarUrl, isSamePersonName } from '../utils/avatar';
import { appLogger } from '../utils/logger';

const STORAGE_KEYS = {
  EVENTS: 'louvor_app_events',
  SONGS: 'louvor_app_songs',
  ADOPTION_SONGS: 'louvor_app_adoption_songs',
  MEMBERS: 'louvor_app_members',
  TEAMS: 'louvor_app_teams',
  NOTICES: 'louvor_app_notices',
};

// Listeners locais para sincronização reativa quando em modo LocalStorage
type Listener<T> = (data: T) => void;
const localListeners = {
  events: new Set<Listener<WorshipEvent[]>>(),
  songs: new Set<Listener<Song[]>>(),
  adoptionSongs: new Set<Listener<AdoptionSong[]>>(),
  members: new Set<Listener<Member[]>>(),
  teams: new Set<Listener<Team[]>>(),
  notices: new Set<Listener<TeamNotice[]>>()
};

// Funções utilitárias de LocalStorage
function getLocal<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    appLogger.error('SISTEMA', 'Erro ao salvar no localStorage', err);
  }
}

// Variável para garantir log de conexão apenas uma vez ao inicializar
let hasLoggedFirestoreConnection = false;

function logFirestoreConnectionOnce(collectionName: string, docCount: number) {
  if (!hasLoggedFirestoreConnection) {
    hasLoggedFirestoreConnection = true;
    appLogger.info('FIRESTORE', `Conexão em tempo real ativa! (${collectionName}: ${docCount} documentos recebidos)`);
  }
}
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}

// ----------------- EVENTOS -----------------

export function subscribeToEvents(callback: (events: WorshipEvent[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'events');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorshipEvent));
        logFirestoreConnectionOnce('events', list.length);
        setLocal(STORAGE_KEYS.EVENTS, list);
        callback(list);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar eventos em tempo real: ${error.message}`, error);
        callback(getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS));
      });
      return unsubscribe;
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de eventos', err);
    }
  }

  localListeners.events.add(callback);
  callback(getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS));
  return () => {
    localListeners.events.delete(callback);
  };
}

export async function saveEvent(event: Omit<WorshipEvent, 'id'> & { id?: string }): Promise<string> {
  const id = event.id || `ev_${Date.now()}`;
  const newEvent: WorshipEvent = { ...event, id, createdAt: event.createdAt || Date.now() };
  const cleaned = cleanForFirestore(newEvent);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'events', id), cleaned);
      appLogger.info('FIRESTORE', `Evento ${id} salvo com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao salvar evento', e);
      throw e;
    }
  }

  const list = getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const index = list.findIndex(e => e.id === id);
  const updated = index >= 0 ? list.map(e => e.id === id ? newEvent : e) : [newEvent, ...list];
  setLocal(STORAGE_KEYS.EVENTS, updated);
  localListeners.events.forEach(l => l(updated));

  return id;
}

export async function saveBatchEvents(eventsList: (Omit<WorshipEvent, 'id'> & { id?: string })[]): Promise<number> {
  let count = 0;
  for (const item of eventsList) {
    await saveEvent(item);
    count++;
  }
  return count;
}

export async function updateEventStatus(eventId: string, memberName: string, status: ConfirmationStatus, justification?: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      const ref = doc(db, 'events', eventId);
      const updates: Record<string, any> = {
        [`confirmed.${memberName}`]: status
      };
      
      if (justification !== undefined) {
        if (justification) {
          updates[`justifications.${memberName}`] = justification;
        } else {
          updates[`justifications.${memberName}`] = null; // Removed when not provided or status changes
        }
      }

      await updateDoc(ref, updates);
      appLogger.info('FIRESTORE', `Presença de ${memberName} atualizada para ${status} no evento ${eventId}`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao atualizar presença no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const updated = list.map(ev => {
    if (ev.id === eventId) {
      const newConfirmed = {
        ...(ev.confirmed || {}),
        [memberName]: status
      };
      
      const newJustifications = {
        ...(ev.justifications || {})
      };
      
      if (justification) {
        newJustifications[memberName] = justification;
      } else if (justification === '') {
        delete newJustifications[memberName];
      }

      return {
        ...ev,
        confirmed: newConfirmed,
        justifications: newJustifications
      };
    }
    return ev;
  });
  setLocal(STORAGE_KEYS.EVENTS, updated);
  localListeners.events.forEach(l => l(updated));
}

export async function deleteEvent(eventId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      appLogger.info('FIRESTORE', `Evento ${eventId} excluído com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar evento no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const updated = list.filter(e => e.id !== eventId);
  setLocal(STORAGE_KEYS.EVENTS, updated);
  localListeners.events.forEach(l => l(updated));
}

// ----------------- MÚSICAS / REPERTÓRIO PRINCIPAL -----------------

export function subscribeToSongs(callback: (songs: Song[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'songs');
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));
        logFirestoreConnectionOnce('songs', list.length);
        setLocal(STORAGE_KEYS.SONGS, list);
        callback(list);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar músicas: ${error.message}`, error);
        callback(getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS));
      });
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de músicas', err);
    }
  }

  localListeners.songs.add(callback);
  callback(getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS));
  return () => {
    localListeners.songs.delete(callback);
  };
}

export async function saveSong(song: Omit<Song, 'id'> & { id?: string }): Promise<string> {
  const id = song.id || `song_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const newSong: Song = { ...song, id, createdAt: song.createdAt || Date.now() };
  const cleaned = cleanForFirestore(newSong);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'songs', id), cleaned);
      appLogger.info('FIRESTORE', `Música ${id} salva com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao salvar música', e);
      throw e;
    }
  }

  const list = getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS);
  const index = list.findIndex(s => s.id === id);
  const updated = index >= 0 ? list.map(s => s.id === id ? newSong : s) : [newSong, ...list];
  setLocal(STORAGE_KEYS.SONGS, updated);
  localListeners.songs.forEach(l => l(updated));

  return id;
}

export async function saveBatchSongs(songsList: (Omit<Song, 'id'> & { id?: string })[]): Promise<number> {
  let count = 0;
  for (const item of songsList) {
    await saveSong(item);
    count++;
  }
  return count;
}

export async function deleteSong(songId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'songs', songId));
      appLogger.info('FIRESTORE', `Música ${songId} excluída com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar música no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS);
  const updated = list.filter(s => s.id !== songId);
  setLocal(STORAGE_KEYS.SONGS, updated);
  localListeners.songs.forEach(l => l(updated));
}

export async function deleteRepertoireGroup(groupName: string, deleteSongsToo: boolean): Promise<{ affectedCount: number }> {
  const list = getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS);
  const targetSongs = list.filter(s => s.group === groupName);

  if (deleteSongsToo) {
    for (const s of targetSongs) {
      if (isFirestoreAvailable && db) {
        try {
          await deleteDoc(doc(db, 'songs', s.id));
        } catch (e) {
          appLogger.error('FIRESTORE', `Erro ao excluir música ${s.id} do grupo ${groupName}`, e);
        }
      }
    }
    const updated = list.filter(s => s.group !== groupName);
    setLocal(STORAGE_KEYS.SONGS, updated);
    localListeners.songs.forEach(l => l(updated));
    return { affectedCount: targetSongs.length };
  } else {
    for (const s of targetSongs) {
      if (isFirestoreAvailable && db) {
        try {
          await updateDoc(doc(db, 'songs', s.id), { group: null });
        } catch (e) {
          appLogger.error('FIRESTORE', `Erro ao desvincular música ${s.id} do grupo ${groupName}`, e);
        }
      }
    }
    const updated = list.map(s => {
      if (s.group === groupName) {
        const copy = { ...s };
        delete copy.group;
        return copy;
      }
      return s;
    });
    setLocal(STORAGE_KEYS.SONGS, updated);
    localListeners.songs.forEach(l => l(updated));
    return { affectedCount: targetSongs.length };
  }
}

export async function assignSongsToGroup(songIds: string[], groupName: string): Promise<void> {
  const list = getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS);
  for (const id of songIds) {
    if (isFirestoreAvailable && db) {
      try {
        await updateDoc(doc(db, 'songs', id), { group: groupName || null });
      } catch (e) {
        appLogger.error('FIRESTORE', `Erro ao atualizar grupo da música ${id}`, e);
      }
    }
  }
  const updated = list.map(s => {
    if (songIds.includes(s.id)) {
      return { ...s, group: groupName || undefined };
    }
    return s;
  });
  setLocal(STORAGE_KEYS.SONGS, updated);
  localListeners.songs.forEach(l => l(updated));
}

// ----------------- MÚSICAS PARA ADOÇÃO (SUGESTÕES & VOTAÇÃO) -----------------

export function subscribeToAdoptionSongs(callback: (songs: AdoptionSong[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'adoption_songs');
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdoptionSong));
        logFirestoreConnectionOnce('adoption_songs', list.length);
        setLocal(STORAGE_KEYS.ADOPTION_SONGS, list);
        callback(list);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar músicas de adoção: ${error.message}`, error);
        callback(getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS));
      });
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de adoções', err);
    }
  }

  localListeners.adoptionSongs.add(callback);
  callback(getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS));
  return () => {
    localListeners.adoptionSongs.delete(callback);
  };
}

export async function saveAdoptionSong(song: Omit<AdoptionSong, 'id'> & { id?: string }): Promise<string> {
  const id = song.id || `adopt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const newAdoptionSong: AdoptionSong = {
    ...song,
    id,
    createdAt: song.createdAt || Date.now(),
    votes: song.votes || [],
    status: song.status || 'voting'
  };
  const cleaned = cleanForFirestore(newAdoptionSong);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'adoption_songs', id), cleaned);
      appLogger.info('FIRESTORE', `Sugestão ${id} salva com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao salvar música para adoção', e);
      throw e;
    }
  }

  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const index = list.findIndex(s => s.id === id);
  const updated = index >= 0 ? list.map(s => s.id === id ? newAdoptionSong : s) : [newAdoptionSong, ...list];
  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));

  return id;
}

export async function voteAdoptionSong(songId: string, voterName: string): Promise<void> {
  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const current = list.find(s => s.id === songId);
  if (!current) return;

  const hasVoted = current.votes.includes(voterName);
  const updatedVotes = hasVoted
    ? current.votes.filter(v => v !== voterName)
    : [...current.votes, voterName];

  const updatedSong: AdoptionSong = {
    ...current,
    votes: updatedVotes
  };

  if (isFirestoreAvailable && db) {
    try {
      const ref = doc(db, 'adoption_songs', songId);
      await updateDoc(ref, { votes: updatedVotes });
      appLogger.info('FIRESTORE', `Voto de ${voterName} registrado para ${songId}`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao computar voto', e);
      throw e;
    }
  }

  const updated = list.map(s => s.id === songId ? updatedSong : s);
  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));
}

export async function approveAdoptionSong(
  adoptionSongId: string,
  approvedSongData: Omit<Song, 'id'>,
  leaderName: string
): Promise<string> {
  // 1. Salva no Repertório Principal
  const newSongId = await saveSong(approvedSongData);

  // 2. Atualiza o status da música de adoção para 'approved'
  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const current = list.find(s => s.id === adoptionSongId);
  if (current) {
    const updatedAdoption: AdoptionSong = {
      ...current,
      status: 'approved',
      approvedAt: Date.now(),
      approvedByMemberName: leaderName
    };

    if (isFirestoreAvailable && db) {
      try {
        const ref = doc(db, 'adoption_songs', adoptionSongId);
        await updateDoc(ref, {
          status: 'approved',
          approvedAt: Date.now(),
          approvedByMemberName: leaderName
        });
        appLogger.info('FIRESTORE', `Música ${adoptionSongId} aprovada com sucesso`);
      } catch (e: any) {
        appLogger.error('FIRESTORE', 'Erro no Firestore ao aprovar adoção', e);
        throw e;
      }
    }

    const updatedList = list.map(s => s.id === adoptionSongId ? updatedAdoption : s);
    setLocal(STORAGE_KEYS.ADOPTION_SONGS, updatedList);
    localListeners.adoptionSongs.forEach(l => l(updatedList));
  }

  return newSongId;
}

export async function rejectAdoptionSong(adoptionSongId: string): Promise<void> {
  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const updated = list.map(s => s.id === adoptionSongId ? { ...s, status: 'rejected' as const } : s);

  if (isFirestoreAvailable && db) {
    try {
      const ref = doc(db, 'adoption_songs', adoptionSongId);
      await updateDoc(ref, { status: 'rejected' });
      appLogger.info('FIRESTORE', `Sugestão ${adoptionSongId} rejeitada`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao rejeitar adoção', e);
      throw e;
    }
  }

  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));
}

export async function deleteAdoptionSong(songId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'adoption_songs', songId));
      appLogger.info('FIRESTORE', `Sugestão ${songId} excluída`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar música de adoção no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const updated = list.filter(s => s.id !== songId);
  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));
}

// ----------------- MEMBROS -----------------

function normalizeMembersList(rawList: Member[]): Member[] {
  // 1. Limpa campos avatar que contenham iniciais antigas (ex: "EB", "FE") em vez de URL de imagem válida
  const sanitized = rawList.map(m => ({
    ...m,
    avatar: isValidAvatarUrl(m.avatar) ? m.avatar!.trim() : undefined
  }));

  // 2. Se houver mais de um registro do mesmo usuário (ex: convite por email + doc UID do login Google),
  // garante que a foto do login Google e as assinaturas Push sejam propagadas para todos os registros correspondentes
  return sanitized.map(member => {
    const matchingDocs = sanitized.filter(
      other =>
        other.id !== member.id &&
        ((member.email &&
          other.email &&
          member.email.trim().toLowerCase() === other.email.trim().toLowerCase()) ||
          isSamePersonName(member.name, other.name))
    );

    if (matchingDocs.length === 0) return member;

    const mergedAvatar =
      member.avatar || matchingDocs.find(d => Boolean(d.avatar))?.avatar;

    const allSubs = [
      ...(member.pushSubscriptions || []),
      ...matchingDocs.flatMap(d => d.pushSubscriptions || [])
    ];
    const uniqueSubs =
      allSubs.length > 0
        ? Array.from(new Map(allSubs.map(s => [s.endpoint, s])).values())
        : undefined;

    return {
      ...member,
      ...(mergedAvatar ? { avatar: mergedAvatar } : {}),
      ...(uniqueSubs ? { pushSubscriptions: uniqueSubs } : {})
    };
  });
}

export function subscribeToMembers(callback: (members: Member[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'users');
      return onSnapshot(q, (snapshot) => {
        const rawList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        const list = normalizeMembersList(rawList);
        setLocal(STORAGE_KEYS.MEMBERS, list);
        callback(list);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar membros: ${error.message}`, error);
        callback(normalizeMembersList(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS)));
      });
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de membros', err);
    }
  }

  localListeners.members.add(callback);
  callback(normalizeMembersList(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS)));
  return () => {
    localListeners.members.delete(callback);
  };
}

export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export async function saveMember(member: Omit<Member, 'id'> & { id?: string }): Promise<string> {
  const id = member.id || (member.email ? member.email.trim().toLowerCase() : `mem_${Date.now()}`);
  const inviteToken = member.inviteToken || (!member.uid ? generateInviteToken() : undefined);
  const newMember: Member = { 
    ...member, 
    id, 
    active: member.active ?? true,
    ...(inviteToken ? { inviteToken } : {})
  };
  const cleaned = cleanForFirestore(newMember);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'users', id), cleaned);
      appLogger.info('FIRESTORE', `Membro ${id} salvo com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao salvar membro', e);
      throw e;
    }
  }

  const list = getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const index = list.findIndex(m => m.id === id);
  const updated = index >= 0 ? list.map(m => m.id === id ? newMember : m) : [...list, newMember];
  setLocal(STORAGE_KEYS.MEMBERS, updated);
  localListeners.members.forEach(l => l(updated));

  return id;
}

export async function deleteMember(memberId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'users', memberId));
      appLogger.info('FIRESTORE', `Membro ${memberId} deletado`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar membro no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const updated = list.filter(m => m.id !== memberId);
  setLocal(STORAGE_KEYS.MEMBERS, updated);
  localListeners.members.forEach(l => l(updated));
}

// ----------------- TIMES / EQUIPES -----------------

export function subscribeToTeams(callback: (teams: Team[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'teams');
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        setLocal(STORAGE_KEYS.TEAMS, list);
        callback(list);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar equipes: ${error.message}`, error);
        callback(getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
      });
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de equipes', err);
    }
  }

  localListeners.teams.add(callback);
  callback(getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
  return () => {
    localListeners.teams.delete(callback);
  };
}

export async function saveTeam(team: Omit<Team, 'id'> & { id?: string }): Promise<string> {
  const id = team.id || `team_${Date.now()}`;
  const newTeam: Team = { ...team, id };
  const cleaned = cleanForFirestore(newTeam);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'teams', id), cleaned);
      appLogger.info('FIRESTORE', `Equipe ${id} salva com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao salvar equipe', e);
      throw e;
    }
  }

  const list = getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  const index = list.findIndex(t => t.id === id);
  const updated = index >= 0 ? list.map(t => t.id === id ? newTeam : t) : [...list, newTeam];
  setLocal(STORAGE_KEYS.TEAMS, updated);
  localListeners.teams.forEach(l => l(updated));

  return id;
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      appLogger.info('FIRESTORE', `Equipe ${teamId} deletada`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar equipe no Firestore', e);
      throw e;
    }
  }

  const list = getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  const updated = list.filter(t => t.id !== teamId);
  setLocal(STORAGE_KEYS.TEAMS, updated);
  localListeners.teams.forEach(l => l(updated));
}

// ----------------- MURAL DA EQUIPE (NOTICES) -----------------

export function subscribeToNotices(callback: (notices: TeamNotice[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'notices');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notices: TeamNotice[] = [];
        snapshot.forEach((doc) => {
          notices.push({ id: doc.id, ...doc.data() } as TeamNotice);
        });
        notices.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setLocal(STORAGE_KEYS.NOTICES, notices);
        callback(notices);
      }, (error) => {
        appLogger.warn('FIRESTORE', `Erro ao sincronizar avisos em tempo real: ${error.message}`, error);
        callback(getLocal<TeamNotice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES));
      });
      return unsubscribe;
    } catch (err) {
      appLogger.warn('FIRESTORE', 'Erro ao registrar listener de avisos', err);
    }
  }

  localListeners.notices.add(callback);
  const currentNotices = getLocal<TeamNotice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
  currentNotices.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  callback(currentNotices);
  return () => {
    localListeners.notices.delete(callback);
  };
}

export async function saveNotice(notice: Omit<TeamNotice, 'id'> & { id?: string }): Promise<string> {
  const id = notice.id || `notice_${Date.now()}`;
  const now = Date.now();
  const newNotice: TeamNotice = {
    ...notice,
    id,
    createdAt: notice.createdAt || now,
    updatedAt: now
  };
  const cleaned = cleanForFirestore(newNotice);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'notices', id), cleaned);
      appLogger.info('FIRESTORE', `Aviso ${id} salvo com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro no Firestore ao salvar aviso do mural', e);
      throw e;
    }
  }

  const list = getLocal<TeamNotice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
  const index = list.findIndex(n => n.id === id);
  const updated = index >= 0 ? list.map(n => n.id === id ? newNotice : n) : [newNotice, ...list];
  updated.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  setLocal(STORAGE_KEYS.NOTICES, updated);
  localListeners.notices.forEach(l => l(updated));

  return id;
}

export async function deleteNotice(noticeId: string): Promise<void> {
  // Sempre remove localmente para resposta imediata na interface
  const list = getLocal<TeamNotice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
  const updated = list.filter(n => n.id !== noticeId);
  setLocal(STORAGE_KEYS.NOTICES, updated);
  localListeners.notices.forEach(l => l(updated));

  if (isFirestoreAvailable && db && !noticeId.startsWith('notice_default_')) {
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
      appLogger.info('FIRESTORE', `Aviso ${noticeId} deletado com sucesso`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao deletar aviso no Firestore', e);
      throw e;
    }
  }
}

export async function togglePinNotice(noticeId: string, currentPinned?: boolean): Promise<void> {
  const newPinned = !currentPinned;

  const list = getLocal<TeamNotice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
  const updated = list.map(n => n.id === noticeId ? { ...n, pinned: newPinned } : n);
  updated.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  setLocal(STORAGE_KEYS.NOTICES, updated);
  localListeners.notices.forEach(l => l(updated));

  if (isFirestoreAvailable && db && !noticeId.startsWith('notice_default_')) {
    try {
      await setDoc(doc(db, 'notices', noticeId), { pinned: newPinned, updatedAt: Date.now() }, { merge: true });
      appLogger.info('FIRESTORE', `Aviso ${noticeId} fixação alterada para ${newPinned}`);
    } catch (e: any) {
      appLogger.error('FIRESTORE', 'Erro ao fixar aviso no Firestore', e);
      throw e;
    }
  }
}

// ----------------- SEMEADOR INICIAL DO FIRESTORE (SEED) -----------------

export async function seedFirestoreWithInitialData(): Promise<{ success: boolean; message: string; counts?: any }> {
  if (!isFirestoreAvailable || !db) {
    return {
      success: false,
      message: 'Firestore não está disponível. Verifique se a VITE_FIREBASE_API_KEY (formato AIzaSy...) foi configurada no build.'
    };
  }

  try {
    let eventsCount = 0;
    let songsCount = 0;
    let membersCount = 0;
    let teamsCount = 0;
    let adoptionCount = 0;

    for (const ev of INITIAL_EVENTS) {
      await setDoc(doc(db, 'events', ev.id), cleanForFirestore({ ...ev, createdAt: Date.now() }));
      eventsCount++;
    }

    for (const s of INITIAL_SONGS) {
      await setDoc(doc(db, 'songs', s.id), cleanForFirestore({ ...s, createdAt: Date.now() }));
      songsCount++;
    }

    for (const m of INITIAL_MEMBERS) {
      await setDoc(doc(db, 'users', m.id), cleanForFirestore(m));
      membersCount++;
    }

    for (const t of INITIAL_TEAMS) {
      await setDoc(doc(db, 'teams', t.id), cleanForFirestore(t));
      teamsCount++;
    }

    for (const a of INITIAL_ADOPTION_SONGS) {
      await setDoc(doc(db, 'adoption_songs', a.id), cleanForFirestore(a));
      adoptionCount++;
    }

    return {
      success: true,
      message: `Sucesso: ${eventsCount} eventos, ${songsCount} músicas, ${membersCount} membros e ${teamsCount} equipes gravados no Cloud Firestore!`,
      counts: { eventsCount, songsCount, membersCount, teamsCount, adoptionCount }
    };
  } catch (error: any) {
    appLogger.error('FIRESTORE', 'Erro ao executar carga inicial (seed) no Firestore', error);
    return {
      success: false,
      message: `Erro ao gravar no Firestore: ${error?.message || 'Falha desconhecida. Verifique se as regras de segurança permitem escrita.'}`
    };
  }
}


export async function linkUserWithInviteToken(uid: string, token: string): Promise<boolean> {
  if (isFirestoreAvailable && db) {
    try {
      const q = query(collection(db, 'users'), where('inviteToken', '==', token));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          uid: uid,
          inviteToken: null
        });
        return true;
      }
    } catch (e) {
      appLogger.warn('AUTH', 'Erro ao processar token de convite no Firestore', e);
    }
  }

  // Local fallback / mock logic
  const list = getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const index = list.findIndex(m => m.inviteToken === token);
  if (index >= 0) {
    const updated = [...list];
    updated[index] = { ...updated[index], uid, inviteToken: undefined };
    setLocal(STORAGE_KEYS.MEMBERS, updated);
    localListeners.members.forEach(l => l(updated));
    return true;
  }

  return false;
}

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
import { WorshipEvent, Song, Member, Team, ConfirmationStatus, AdoptionSong } from '../types';
import { INITIAL_EVENTS, INITIAL_SONGS, INITIAL_MEMBERS, INITIAL_TEAMS, INITIAL_ADOPTION_SONGS } from './mockData';

const STORAGE_KEYS = {
  EVENTS: 'louvor_app_events',
  SONGS: 'louvor_app_songs',
  ADOPTION_SONGS: 'louvor_app_adoption_songs',
  MEMBERS: 'louvor_app_members',
  TEAMS: 'louvor_app_teams',
};

// Listeners locais para sincronização reativa quando em modo LocalStorage
type Listener<T> = (data: T) => void;
const localListeners = {
  events: new Set<Listener<WorshipEvent[]>>(),
  songs: new Set<Listener<Song[]>>(),
  adoptionSongs: new Set<Listener<AdoptionSong[]>>(),
  members: new Set<Listener<Member[]>>(),
  teams: new Set<Listener<Team[]>>()
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
    console.error('Erro ao salvar no localStorage:', err);
  }
}

// Variável para garantir log de conexão apenas uma vez ao inicializar
let hasLoggedFirestoreConnection = false;

function logFirestoreConnectionOnce(collectionName: string, docCount: number) {
  if (!hasLoggedFirestoreConnection) {
    hasLoggedFirestoreConnection = true;
    console.log(`✅ [Firestore Conectado] Conexão em tempo real ativa! (${collectionName}: ${docCount} documentos recebidos do banco de dados)`);
  }
}
function cleanForFirestore<T>(obj: T): T {
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
        console.warn('❌ [Firestore Events] Erro ao sincronizar eventos em tempo real:', error.message, error);
        callback(getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS));
      });
      return unsubscribe;
    } catch (err) {
      console.warn('❌ [Firestore Events] Erro ao registrar listener:', err);
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
      console.log(`✅ [Firestore Events] Evento ${id} salvo com sucesso no Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Events] Erro ao salvar evento no Firestore:', e);
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

export async function updateEventStatus(eventId: string, memberName: string, status: ConfirmationStatus): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      const ref = doc(db, 'events', eventId);
      await updateDoc(ref, {
        [`confirmed.${memberName}`]: status
      });
      console.log(`✅ [Firestore Events] Presença de ${memberName} atualizada para ${status} no evento ${eventId}.`);
    } catch (e: any) {
      console.error('❌ [Firestore Events] Erro ao atualizar status no Firestore:', e);
      throw e;
    }
  }

  const list = getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const updated = list.map(ev => {
    if (ev.id === eventId) {
      return {
        ...ev,
        confirmed: {
          ...(ev.confirmed || {}),
          [memberName]: status
        }
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
      console.log(`✅ [Firestore Events] Evento ${eventId} excluído do Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Events] Erro ao deletar no Firestore:', e);
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
        console.warn('❌ [Firestore Songs] Erro ao sincronizar músicas:', error.message, error);
        callback(getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS));
      });
    } catch (err) {
      console.warn('❌ [Firestore Songs] Erro ao registrar listener:', err);
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
      console.log(`✅ [Firestore Songs] Música ${id} salva no Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Songs] Erro no Firestore ao salvar música:', e);
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
      console.log(`✅ [Firestore Songs] Música ${songId} excluída do Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Songs] Erro ao deletar música:', e);
      throw e;
    }
  }

  const list = getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS);
  const updated = list.filter(s => s.id !== songId);
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
        console.warn('❌ [Firestore Adoption] Erro ao sincronizar músicas de adoção:', error.message, error);
        callback(getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS));
      });
    } catch (err) {
      console.warn('❌ [Firestore Adoption] Erro ao registrar listener:', err);
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
      console.log(`✅ [Firestore Adoption] Sugestão ${id} salva no Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Adoption] Erro no Firestore ao salvar música para adoção:', e);
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
      console.log(`✅ [Firestore Adoption] Voto de ${voterName} registrado para ${songId}.`);
    } catch (e: any) {
      console.error('❌ [Firestore Adoption] Erro no Firestore ao computar voto:', e);
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
        console.log(`✅ [Firestore Adoption] Música ${adoptionSongId} aprovada no Cloud Firestore.`);
      } catch (e: any) {
        console.error('❌ [Firestore Adoption] Erro no Firestore ao aprovar adoção:', e);
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
      console.log(`✅ [Firestore Adoption] Sugestão ${adoptionSongId} rejeitada.`);
    } catch (e: any) {
      console.error('❌ [Firestore Adoption] Erro no Firestore ao rejeitar adoção:', e);
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
      console.log(`✅ [Firestore Adoption] Sugestão ${songId} excluída do Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Adoption] Erro ao deletar música de adoção no Firestore:', e);
      throw e;
    }
  }

  const list = getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS);
  const updated = list.filter(s => s.id !== songId);
  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));
}

// ----------------- MEMBROS -----------------

export function subscribeToMembers(callback: (members: Member[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'users');
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        setLocal(STORAGE_KEYS.MEMBERS, list);
        callback(list);
      }, (error) => {
        console.warn('[Firestore Members] Erro ao sincronizar membros:', error.message, error);
        callback(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
      });
    } catch (err) {
      console.warn('[Firestore Members] Erro ao registrar listener:', err);
    }
  }

  localListeners.members.add(callback);
  callback(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
  return () => {
    localListeners.members.delete(callback);
  };
}

export async function saveMember(member: Omit<Member, 'id'> & { id?: string }): Promise<string> {
  const id = member.id || (member.email ? member.email.trim().toLowerCase() : `mem_${Date.now()}`);
  const newMember: Member = { ...member, id, active: member.active ?? true };
  const cleaned = cleanForFirestore(newMember);

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'users', id), cleaned);
      console.log(`✅ [Firestore Users] Membro ${id} salvo com sucesso no Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Users] Erro no Firestore ao salvar membro:', e);
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
      console.log(`✅ [Firestore Users] Membro ${memberId} deletado do Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Users] Erro ao deletar membro:', e);
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
        console.warn('[Firestore Teams] Erro ao sincronizar equipes:', error.message, error);
        callback(getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
      });
    } catch (err) {
      console.warn('[Firestore Teams] Erro ao registrar listener:', err);
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
      console.log(`✅ [Firestore Teams] Equipe ${id} salva no Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Teams] Erro no Firestore ao salvar equipe:', e);
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
      console.log(`✅ [Firestore Teams] Equipe ${teamId} deletada do Cloud Firestore.`);
    } catch (e: any) {
      console.error('❌ [Firestore Teams] Erro ao deletar equipe:', e);
      throw e;
    }
  }

  const list = getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  const updated = list.filter(t => t.id !== teamId);
  setLocal(STORAGE_KEYS.TEAMS, updated);
  localListeners.teams.forEach(l => l(updated));
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
    console.error('[Firestore Seed Error]:', error);
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
      console.warn('Erro ao processar token de convite no Firestore:', e);
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

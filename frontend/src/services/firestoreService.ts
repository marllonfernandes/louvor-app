import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
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

// ----------------- EVENTOS -----------------

export function subscribeToEvents(callback: (events: WorshipEvent[]) => void): () => void {
  if (isFirestoreAvailable && db) {
    try {
      const q = collection(db, 'events');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorshipEvent));
          callback(list);
        } else {
          const initial = getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
          callback(initial);
        }
      }, () => {
        callback(getLocal<WorshipEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS));
      });
      return unsubscribe;
    } catch {
      // Fallback
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
  const newEvent: WorshipEvent = { ...event, id, createdAt: Date.now() };

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'events', id), newEvent);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore, salvando local:', e);
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
    } catch (e) {
      console.warn('Erro ao atualizar status no Firestore:', e);
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
    } catch (e) {
      console.warn('Erro ao deletar no Firestore:', e);
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
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));
          callback(list);
        } else {
          callback(getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS));
        }
      }, () => {
        callback(getLocal<Song[]>(STORAGE_KEYS.SONGS, INITIAL_SONGS));
      });
    } catch {
      // Fallback
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

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'songs', id), newSong);
    } catch (e) {
      console.warn('Erro no Firestore ao salvar música:', e);
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
    } catch (e) {
      console.warn('Erro ao deletar música:', e);
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
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdoptionSong));
          callback(list);
        } else {
          callback(getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS));
        }
      }, () => {
        callback(getLocal<AdoptionSong[]>(STORAGE_KEYS.ADOPTION_SONGS, INITIAL_ADOPTION_SONGS));
      });
    } catch {
      // Fallback
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

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'adoption_songs', id), newAdoptionSong);
    } catch (e) {
      console.warn('Erro no Firestore ao salvar música para adoção:', e);
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
    } catch (e) {
      console.warn('Erro no Firestore ao computar voto:', e);
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
      } catch (e) {
        console.warn('Erro no Firestore ao aprovar adoção:', e);
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
    } catch (e) {
      console.warn('Erro no Firestore ao rejeitar adoção:', e);
    }
  }

  setLocal(STORAGE_KEYS.ADOPTION_SONGS, updated);
  localListeners.adoptionSongs.forEach(l => l(updated));
}

export async function deleteAdoptionSong(songId: string): Promise<void> {
  if (isFirestoreAvailable && db) {
    try {
      await deleteDoc(doc(db, 'adoption_songs', songId));
    } catch (e) {
      console.warn('Erro ao deletar música de adoção no Firestore:', e);
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
      const q = collection(db, 'members');
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          callback(list);
        } else {
          callback(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
        }
      }, () => {
        callback(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
      });
    } catch {
      // Fallback
    }
  }

  localListeners.members.add(callback);
  callback(getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
  return () => {
    localListeners.members.delete(callback);
  };
}

export async function saveMember(member: Omit<Member, 'id'> & { id?: string }): Promise<string> {
  const id = member.id || `mem_${Date.now()}`;
  const newMember: Member = { ...member, id, active: member.active ?? true };

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'members', id), newMember);
    } catch (e) {
      console.warn('Erro no Firestore ao salvar membro:', e);
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
      await deleteDoc(doc(db, 'members', memberId));
    } catch (e) {
      console.warn('Erro ao deletar membro:', e);
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
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
          callback(list);
        } else {
          callback(getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
        }
      }, () => {
        callback(getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
      });
    } catch {
      // Fallback
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

  if (isFirestoreAvailable && db) {
    try {
      await setDoc(doc(db, 'teams', id), newTeam);
    } catch (e) {
      console.warn('Erro no Firestore ao salvar equipe:', e);
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
    } catch (e) {
      console.warn('Erro ao deletar equipe:', e);
    }
  }

  const list = getLocal<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  const updated = list.filter(t => t.id !== teamId);
  setLocal(STORAGE_KEYS.TEAMS, updated);
  localListeners.teams.forEach(l => l(updated));
}

import { WorshipEvent, Song, Member, Team, AdoptionSong, TeamNotice } from '../types';

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_SONGS: Song[] = [];

export const INITIAL_ADOPTION_SONGS: AdoptionSong[] = [];

export const INITIAL_EVENTS: WorshipEvent[] = [];

export const INITIAL_NOTICES: TeamNotice[] = [
  {
    id: 'notice_default_ensaio',
    title: 'Ensaio Geral da Semana',
    category: 'ensaio',
    message: 'Ensaio confirmado para quinta-feira às 20h00 no templo principal. Por favor, cheguem com 15 minutos de antecedência para alinhamento de palco e passagem de som.',
    highlightText: 'Pontualidade no soundcheck',
    pinned: true,
    authorName: 'Liderança',
    createdAt: 1713700000000,
  }
];


import { WorshipEvent, Song, Member, Team, AdoptionSong } from '../types';

export const INITIAL_MEMBERS: Member[] = [
  { 
    id: 'm5', 
    name: 'Ana Paula', 
    role: 'Líder, Ministro de Louvor', 
    roles: ['Líder', 'Ministro de Louvor', 'Vocal'], 
    phone: '(11) 98111-2233', 
    active: true 
  },
  { 
    id: 'm1', 
    name: 'João Silva', 
    role: 'Ministro de Louvor, Violão', 
    roles: ['Ministro de Louvor', 'Vocal', 'Violão'], 
    phone: '(11) 98765-4321', 
    active: true 
  },
  { 
    id: 'm2', 
    name: 'Maria Souza', 
    role: 'Teclado', 
    roles: ['Teclado'], 
    phone: '(11) 91234-5678', 
    active: true 
  },
  { 
    id: 'm3', 
    name: 'Carlos Lima', 
    role: 'Violão, Guitarra', 
    roles: ['Violão', 'Guitarra'], 
    phone: '(11) 99888-7766', 
    active: true 
  },
  { 
    id: 'm4', 
    name: 'Lucas Oliveira', 
    role: 'Bateria', 
    roles: ['Bateria'], 
    phone: '(11) 97777-1122', 
    active: true 
  },
  { 
    id: 'm6', 
    name: 'Felipe Santos', 
    role: 'Baixo', 
    roles: ['Baixo'], 
    phone: '(11) 98999-4455', 
    active: true 
  },
  { 
    id: 'm7', 
    name: 'Juliana Costa', 
    role: 'Backing Vocal', 
    roles: ['Backing Vocal', 'Vocal'], 
    phone: '(11) 97333-8899', 
    active: true 
  },
  { 
    id: 'm8', 
    name: 'Gabriel Mendes', 
    role: 'Sonoplastia', 
    roles: ['Sonoplastia', 'Mídia / Projeção'], 
    phone: '(11) 96555-1234', 
    active: true 
  }
];

export const INITIAL_TEAMS: Team[] = [
  { 
    id: 't1', 
    name: 'Time Alfa (Domingo Noite)', 
    members: ['Ana Paula', 'João Silva', 'Maria Souza', 'Lucas Oliveira', 'Felipe Santos', 'Gabriel Mendes'],
    color: '#10b981'
  },
  { 
    id: 't2', 
    name: 'Time Beta (Domingo Manhã)', 
    members: ['Carlos Lima', 'Juliana Costa', 'Maria Souza', 'Lucas Oliveira'],
    color: '#06b6d4'
  },
  { 
    id: 't3', 
    name: 'Time Jovens (Sábado)',
    members: ['João Silva', 'Carlos Lima', 'Lucas Oliveira', 'Felipe Santos'],
    color: '#8b5cf6'
  }
];

export const INITIAL_SONGS: Song[] = [
  { 
    id: 's1', 
    title: 'Bondade de Deus', 
    artist: 'Isaías Saad', 
    url: 'https://www.youtube.com/watch?v=Wz8q1k9xXQ0', 
    key: 'D',
    bpm: 70,
    category: 'Adoração',
    notes: 'Iniciar com violão e voz suave, crescendo no refrão.'
  },
  { 
    id: 's2', 
    title: 'Lugar Secreto', 
    artist: 'Gabriela Rocha', 
    url: 'https://www.youtube.com/watch?v=7zV1aY2n1wE', 
    key: 'A',
    bpm: 68,
    category: 'Ministração',
    notes: 'Pausa instrumental no pós-refrão.'
  },
  { 
    id: 's3', 
    title: 'A Casa É Sua', 
    artist: 'Casa Worship', 
    url: 'https://www.youtube.com/watch?v=2r1pQ2m1A3E', 
    key: 'G',
    bpm: 65,
    category: 'Celebração',
    notes: 'Todos os vocais juntos a partir da estrofe 2.'
  },
  { 
    id: 's4', 
    title: 'Ousado Amor', 
    artist: 'Isaías Saad', 
    url: 'https://www.youtube.com/watch?v=kYv9b8_c1Yc', 
    key: 'Gb',
    bpm: 72,
    category: 'Adoração',
    notes: 'Solo de guitarra na ponte.'
  },
  { 
    id: 's5', 
    title: 'Vitorioso És', 
    artist: 'Gabriel Guedes', 
    url: 'https://www.youtube.com/watch?v=F0f8u8P0_8s', 
    key: 'E',
    bpm: 76,
    category: 'Celebração',
    notes: 'Música de abertura bem enérgica.'
  }
];

export const INITIAL_ADOPTION_SONGS: AdoptionSong[] = [
  {
    id: 'adopt_1',
    title: 'Ruja o Leão',
    artist: 'Talita Catanzaro',
    url: 'https://www.youtube.com/watch?v=kYv9b8_c1Yc',
    suggestedKey: 'Em',
    suggestedCategory: 'Celebração',
    notes: 'Ótima para momentos de clamor e celebração profética.',
    suggestedByMemberName: 'João Silva',
    createdAt: Date.now() - 86400000 * 2,
    votes: ['João Silva', 'Carlos Lima', 'Lucas Oliveira', 'Felipe Santos'],
    status: 'voting'
  },
  {
    id: 'adopt_2',
    title: 'Eu Te Vejo Em Tudo',
    artist: 'Casa Worship',
    url: 'https://www.youtube.com/watch?v=Wz8q1k9xXQ0',
    suggestedKey: 'C',
    suggestedCategory: 'Adoração',
    notes: 'Canção muito profunda para ministração no final do culto.',
    suggestedByMemberName: 'Maria Souza',
    createdAt: Date.now() - 86400000,
    votes: ['Maria Souza', 'Juliana Costa', 'Ana Paula'],
    status: 'voting'
  }
];

export const INITIAL_EVENTS: WorshipEvent[] = [
  {
    id: 'e1',
    title: 'Culto de Celebração',
    type: 'culto',
    date: '2026-09-06',
    time: '18:00',
    location: 'Templo Principal',
    team: 'Time Alfa (Domingo Noite)',
    confirmed: {
      'Ana Paula': 'accepted',
      'João Silva': 'accepted',
      'Maria Souza': 'pending',
      'Lucas Oliveira': 'accepted',
      'Felipe Santos': 'declined',
      'Gabriel Mendes': 'pending'
    },
    songIds: ['s1', 's2', 's3'],
    notes: 'Culto com celebração da Santa Ceia. Chegar às 17:00 para passagem de som.'
  },
  {
    id: 'e2',
    title: 'Ensaio Geral da Equipe',
    type: 'ensaio',
    date: '2026-09-03',
    time: '19:30',
    location: 'Sala de Música',
    team: 'Time Alfa (Domingo Noite)',
    confirmed: {
      'Ana Paula': 'accepted',
      'João Silva': 'accepted',
      'Maria Souza': 'accepted',
      'Lucas Oliveira': 'pending',
      'Felipe Santos': 'accepted'
    },
    songIds: ['s1', 's4', 's5'],
    notes: 'Afinar arranjos novos e transições de tom.'
  },
  {
    id: 'e3',
    title: 'Culto de Jovens - Conexão',
    type: 'jovens',
    date: '2026-09-12',
    time: '19:00',
    location: 'Auditório Anexo',
    team: 'Time Jovens (Sábado)',
    confirmed: {
      'João Silva': 'pending',
      'Carlos Lima': 'accepted',
      'Lucas Oliveira': 'accepted',
      'Felipe Santos': 'pending'
    },
    songIds: ['s3', 's5'],
    notes: 'Setlist bem dinâmico e alegre.'
  }
];

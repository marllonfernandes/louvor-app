export interface HarpaHymn {
  number: string;
  title: string;
}

/**
 * Hinos mais cantados da Harpa Cristã (especialmente em cultos de Santa Ceia e celebração)
 * Permite preenchimento automático ao digitar o número e sugestão rápida com 1 toque.
 */
export const POPULAR_HARPA_HYMNS: HarpaHymn[] = [
  { number: '301', title: 'Vem Cear' },
  { number: '39', title: 'Alvo Mais Que a Neve' },
  { number: '291', title: 'A Mensagem da Cruz' },
  { number: '491', title: 'Há Poder no Sangue de Jesus' },
  { number: '15', title: 'Conversão' },
  { number: '304', title: 'A Face Adorada de Jesus' },
  { number: '193', title: 'A Alma Abatida' },
  { number: '126', title: 'Bem-Aventurança do Crente' },
  { number: '187', title: 'Mais Perto Quero Estar' },
  { number: '107', title: 'Firme nas Promessas' },
  { number: '545', title: 'Porque Ele Vive' },
  { number: '577', title: 'Em Fervente Oração' },
  { number: '77', title: 'Guarda o Contato' },
  { number: '186', title: 'De Valor em Valor' },
  { number: '212', title: 'Os Guerreiros se Preparam' },
  { number: '224', title: 'É o Tempo de Segar' },
  { number: '442', title: 'Breve Verei o Bom Jesus' },
  { number: '525', title: 'Vencendo Vem Jesus' },
  { number: '636', title: 'Deleita-te no Senhor' },
  { number: '1', title: 'Chuvas de Graça' },
  { number: '24', title: 'Poder Pentecostal' },
  { number: '48', title: 'O Dia do Triunfo de Jesus' },
  { number: '96', title: 'Deixa Penetrar a Luz' },
  { number: '115', title: 'Trabalhai e Orai' },
  { number: '509', title: 'Ao Passar o Jordão' }
];

export const CEIA_SUGGESTED_HYMNS: HarpaHymn[] = [
  { number: '301', title: 'Vem Cear' },
  { number: '39', title: 'Alvo Mais Que a Neve' },
  { number: '291', title: 'A Mensagem da Cruz' },
  { number: '491', title: 'Há Poder no Sangue de Jesus' },
  { number: '15', title: 'Conversão' },
  { number: '304', title: 'A Face Adorada de Jesus' }
];

export function findHarpaHymnByNumber(num: string): HarpaHymn | undefined {
  const cleaned = num.replace(/\D/g, '').replace(/^0+/, '');
  if (!cleaned) return undefined;
  return POPULAR_HARPA_HYMNS.find(h => h.number === cleaned);
}

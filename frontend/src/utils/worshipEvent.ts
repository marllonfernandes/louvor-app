import { WorshipEvent, EventSongItem, Member, Song, SongVocalAssignment } from '../types';

export interface BlockPreset {
  id: string;
  name: string;
  blocks: string[];
  icon: string;
  description: string;
}

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: 'abertura_ceia',
    name: 'Abertura + Ceia',
    blocks: ['Abertura', 'Ceia'],
    icon: '🍷',
    description: 'Abertura do culto e momento especial da Santa Ceia'
  },
  {
    id: 'abertura_batismo_ceia',
    name: 'Abertura + Batismo + Ceia',
    blocks: ['Abertura', 'Batismo', 'Ceia'],
    icon: '👑',
    description: 'Culto especial completo com louvores de Abertura, Batismo e Santa Ceia'
  },
  {
    id: 'abertura_batismo',
    name: 'Abertura + Batismo',
    blocks: ['Abertura', 'Batismo'],
    icon: '💧',
    description: 'Culto especial com momento de Batismo nas águas'
  }
];

export const COMMON_BLOCKS = ['Abertura', 'Ceia', 'Batismo', 'Ministração', 'Oferta', 'Geral'];

/**
 * Formata data ISO (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

/**
 * Normaliza os itens de música de um evento, mantendo total compatibilidade retroativa
 */
export function getEventSongItems(event: WorshipEvent): EventSongItem[] {
  if (event.songItems && event.songItems.length > 0) {
    return event.songItems;
  }
  return (event.songIds || []).map(id => ({
    songId: id,
    block: '',
    ministerName: ''
  }));
}

/**
 * Resolve o objeto Song a partir de um EventSongItem (suporta músicas do catálogo e Hinos da Harpa Cristã)
 */
export function resolveEventSong(item: EventSongItem, songs: Song[]): Song | null {
  if (item.isHarpa || item.harpaTitle) {
    const numStr = item.harpaNumber?.trim() || '';
    const titleStr = item.harpaTitle?.trim() || 'Hino da Harpa';
    return {
      id: item.songId || `harpa_${numStr || Date.now()}`,
      title: numStr ? `Harpa Nº ${numStr} - ${titleStr}` : titleStr,
      artist: 'Harpa Cristã',
      url: '',
      key: item.harpaKey?.trim() || '',
      category: 'Santa Ceia'
    };
  }
  return songs.find(s => s.id === item.songId) || null;
}

/**
 * Retorna os ministrantes/cantores de um louvor (suporta 1 ou 2 integrantes)
 */
export function getSongMinisters(item: EventSongItem): SongVocalAssignment[] {
  if (item.ministers && Array.isArray(item.ministers) && item.ministers.length > 0) {
    return item.ministers.filter(m => m.name && m.name.trim());
  }
  if (item.ministerName && item.ministerName.trim()) {
    return [{
      name: item.ministerName.trim(),
      action: item.ministerAction || 'canta'
    }];
  }
  return [];
}

/**
 * Formata a tag de vocal/ministrante para exportação no WhatsApp (1 ou 2 integrantes)
 */
export function formatSongMinistersWhatsApp(ministers: SongVocalAssignment[]): string {
  if (ministers.length === 0) return '';
  if (ministers.length === 1) {
    const m = ministers[0];
    const action = m.action === 'ministra' ? 'Ministra' : 'Canta';
    return ` [🎤 ${action}: *${m.name}*]`;
  }
  // 2 integrantes
  const [m1, m2] = ministers;
  if (m1.action === m2.action) {
    const action = m1.action === 'ministra' ? 'Ministram' : 'Cantam';
    return ` [🎤 ${action}: *${m1.name}* e *${m2.name}*]`;
  }
  const act1 = m1.action === 'ministra' ? 'Ministra' : 'Canta';
  const act2 = m2.action === 'ministra' ? 'Ministra' : 'Canta';
  return ` [🎤 ${act1}: *${m1.name}* | ${act2}: *${m2.name}*]`;
}

/**
 * Adiciona um integrante ao louvor (máximo 2)
 */
export function addMinisterToSong(
  item: EventSongItem, 
  name: string, 
  action: 'canta' | 'ministra' = 'canta'
): EventSongItem {
  const current = getSongMinisters(item);
  if (current.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    return item;
  }
  if (current.length >= 2) {
    return item;
  }
  const updated = [...current, { name: name.trim(), action }];
  return {
    ...item,
    ministers: updated,
    ministerName: updated[0]?.name || '',
    ministerAction: updated[0]?.action || 'canta'
  };
}

/**
 * Remove um integrante do louvor por índice
 */
export function removeMinisterFromSong(
  item: EventSongItem, 
  indexToRemove: number
): EventSongItem {
  const current = getSongMinisters(item);
  const updated = current.filter((_, idx) => idx !== indexToRemove);
  return {
    ...item,
    ministers: updated,
    ministerName: updated[0]?.name || '',
    ministerAction: updated[0]?.action || 'canta'
  };
}

/**
 * Alterna entre 'canta' e 'ministra' para um integrante
 */
export function toggleSongMinisterAction(
  item: EventSongItem, 
  indexToToggle: number
): EventSongItem {
  const current = getSongMinisters(item);
  const updated = current.map((m, idx) => {
    if (idx === indexToToggle) {
      return {
        ...m,
        action: (m.action === 'ministra' ? 'canta' : 'ministra') as 'canta' | 'ministra'
      };
    }
    return m;
  });
  return {
    ...item,
    ministers: updated,
    ministerName: updated[0]?.name || '',
    ministerAction: updated[0]?.action || 'canta'
  };
}

/**
 * Retorna a ordem dos blocos configurados para o evento
 */
export function getEventBlocksOrder(event: WorshipEvent): string[] {
  if (event.songBlocksOrder && event.songBlocksOrder.length > 0) {
    return event.songBlocksOrder;
  }

  const items = getEventSongItems(event);
  const blocksInItems = Array.from(
    new Set(items.map(i => i.block?.trim()).filter(Boolean))
  ) as string[];

  return blocksInItems;
}

/**
 * Identifica se um membro pertence ao vocal / ministração
 */
export function isVocalMember(member: Member): boolean {
  const roleText = `${member.role || ''} ${(member.roles || []).join(' ')}`.toLowerCase();
  return (
    roleText.includes('vocal') ||
    roleText.includes('ministro') ||
    roleText.includes('ministra') ||
    roleText.includes('líder') ||
    roleText.includes('lider') ||
    roleText.includes('cantor') ||
    roleText.includes('cantora') ||
    roleText.includes('voz')
  );
}

/**
 * Retorna a lista de integrantes com vocais no topo
 */
export function sortMembersWithVocalsFirst(members: Member[]): { vocals: Member[]; others: Member[] } {
  const vocals: Member[] = [];
  const others: Member[] = [];

  members.forEach(m => {
    if (isVocalMember(m)) {
      vocals.push(m);
    } else {
      others.push(m);
    }
  });

  return { vocals, others };
}


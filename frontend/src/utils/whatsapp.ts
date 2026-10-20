import { WorshipEvent, Member, Song, EventSongItem } from '../types';
import { getEventTypeDefinition } from './eventType';
import {
  getEventSongItems,
  getEventBlocksOrder,
  getSongMinisters,
  formatSongMinistersWhatsApp,
  formatDateBR,
  resolveEventSong
} from './worshipEvent';

function formatEventSongLineWhatsApp(it: EventSongItem & { song: Song }, prefix = '-'): string {
  const s = it.song;
  const ministerTag = formatSongMinistersWhatsApp(getSongMinisters(it));

  if (it.isHarpa || it.harpaTitle) {
    const numPart = it.harpaNumber?.trim() ? `Nº ${it.harpaNumber.trim()} - ` : '';
    const titlePart = it.harpaTitle?.trim() || s.title;
    const keyPart = it.harpaKey?.trim() ? ` (Tom: *${it.harpaKey.trim()}*)` : '';
    return `${prefix} 📖 *Harpa Cristã: ${numPart}${titlePart}*${keyPart}${ministerTag}`;
  }

  const groupTag = s.group ? ` [📁 ${s.group}]` : '';
  const keyTag = s.key ? ` (Tom: *${s.key}*)` : '';
  const link = s.url ? `\n   ▶️ ${s.url}` : '';
  return `${prefix} *${s.title}* - ${s.artist}${keyTag}${ministerTag}${groupTag}${link}`;
}

/**
 * Limpa o número de telefone e garante o formato internacional para o WhatsApp
 */
export function formatPhoneNumberForWhatsApp(phone: string | undefined | null): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return '';
  
  // Se não tiver código de país (55 para Brasil), adiciona
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Cria link para o WhatsApp avisando o membro sobre a escala
 */
export function createMemberReminderLink(member: Member, event: WorshipEvent, songs: Song[] = []): string {
  const phone = formatPhoneNumberForWhatsApp(member.phone);
  if (!phone) return '';

  const typeDef = getEventTypeDefinition(event.type);
  const typeTag = event.type ? ` (${typeDef.label})` : '';

  // Verifica se o integrante tem louvores atribuídos para cantar ou ministrar
  const items = getEventSongItems(event);
  const memberSongs = items
    .filter(item => {
      const ms = getSongMinisters(item);
      return ms.some(m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase());
    })
    .map(item => {
      const song = resolveEventSong(item, songs);
      const myAssignment = getSongMinisters(item).find(m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase());
      const action = myAssignment?.action === 'ministra' ? 'Ministrar' : 'Cantar';
      const blockStr = item.block ? ` [${item.block}]` : '';
      const keyStr = song?.key ? ` (Tom: ${song.key})` : '';
      return song ? `• ${song.title}${keyStr}${blockStr} - ${action}` : null;
    })
    .filter(Boolean);

  let songsNotice = '';
  if (memberSongs.length > 0) {
    songsNotice = `\n\n🎤 *Seus louvores atribuídos:*\n${memberSongs.join('\n')}`;
  }

  const message = `Olá, *${member.name}*! 👋🎶\n\nVocê está escalado(a) para o ministério de louvor:\n📅 *Evento:* ${event.title}${typeTag}\n🗓 *Data:* ${formatDateBR(event.date)} às ${event.time}\n🎸 *Função:* ${member.role}${songsNotice}\n\nPor favor, confirme sua presença no app! Deus abençoe! 🙏✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Gera texto formatado com emojis para compartilhar a escala completa no grupo do WhatsApp
 * Suporta organização em blocos (ex: Abertura, Ceia, Batismo) e identificação do vocal/ministrante
 */
export function generateEventShareText(event: WorshipEvent, songs: Song[] = [], members: Member[] = []): string {
  // Apenas integrantes com presença confirmada
  const confirmedList = Object.entries(event.confirmed || {}).filter(([_, status]) => status === 'accepted');
  const typeDef = getEventTypeDefinition(event.type);
  
  let membersText = '';
  if (confirmedList.length === 0) {
    membersText = '_(Nenhum integrante confirmado ainda)_';
  } else {
    membersText = confirmedList.map(([name]) => {
      const memberObj = members.find(m => m.name === name);
      const roleStr = memberObj ? ` (${memberObj.role})` : '';
      return `✅ *${name}*${roleStr}`;
    }).join('\n');
  }

  // Obter itens de música (incluindo Hinos da Harpa Cristã)
  const items = getEventSongItems(event);
  const itemsWithSongs = items.map(item => {
    const song = resolveEventSong(item, songs);
    return song ? { ...item, song } : null;
  }).filter(Boolean) as (EventSongItem & { song: Song })[];

  const hasBlocks = itemsWithSongs.some(it => Boolean(it.block?.trim()));

  let songsText = '';

  if (itemsWithSongs.length > 0) {
    if (hasBlocks) {
      // Agrupamento por blocos/momentos (ex: Abertura, Ceia, Batismo)
      const blocksOrder = getEventBlocksOrder(event);
      
      // Coleta todos os nomes de bloco presentes
      const presentBlocks = Array.from(
        new Set(itemsWithSongs.map(i => i.block?.trim()).filter(Boolean))
      ) as string[];

      // Ordem final dos blocos: os definidos em blocksOrder primeiro, seguidos de outros que existam
      const orderedBlocks = Array.from(
        new Set([...blocksOrder.filter(b => presentBlocks.includes(b)), ...presentBlocks])
      );

      const blockSections: string[] = [];

      orderedBlocks.forEach(blockName => {
        const blockSongs = itemsWithSongs.filter(
          i => (i.block || '').trim().toLowerCase() === blockName.toLowerCase()
        );
        if (blockSongs.length === 0) return;

        const lines = blockSongs.map(it => formatEventSongLineWhatsApp(it, '-')).join('\n');

        blockSections.push(`*${blockName}:*\n${lines}`);
      });

      // Músicas que porventura não tenham bloco associado
      const unassignedSongs = itemsWithSongs.filter(i => !i.block?.trim());
      if (unassignedSongs.length > 0) {
        const lines = unassignedSongs.map(it => formatEventSongLineWhatsApp(it, '-')).join('\n');

        blockSections.push(`*Louvor Geral:*\n${lines}`);
      }

      songsText = `\n\n🎵 *REPERTÓRIO / MÚSICAS:*\n\n` + blockSections.join('\n\n');
    } else {
      // Formato lista simples (quando não há blocos)
      songsText = `\n\n🎵 *REPERTÓRIO / MÚSICAS:*\n` + itemsWithSongs.map((it, idx) =>
        formatEventSongLineWhatsApp(it, `${idx + 1}.`)
      ).join('\n');
    }
  }

  const text = `📋 *ESCALA DO MINISTÉRIO DE LOUVOR* 🎶\n\n` +
    `${typeDef.emoji} *Evento:* ${event.title}${event.type ? ` (${typeDef.label})` : ''}\n` +
    `🗓 *Data:* ${formatDateBR(event.date)}\n` +
    `⏰ *Horário:* ${event.time}\n` +
    (event.team ? `👥 *Equipe:* ${event.team}\n` : '') +
    `\n` +
    `👥 *Confirmados:*\n` +
    membersText +
    songsText;

  return text;
}

export function createShareWhatsAppGroupLink(event: WorshipEvent, songs: Song[] = [], members: Member[] = []): string {
  const text = generateEventShareText(event, songs, members);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

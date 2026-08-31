import { WorshipEvent, Member, Song } from '../types';

/**
 * Limpa o número de telefone e garante o formato internacional para o WhatsApp
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
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
export function createMemberReminderLink(member: Member, event: WorshipEvent): string {
  const phone = formatPhoneNumberForWhatsApp(member.phone);
  if (!phone) return '';

  const message = `Olá, *${member.name}*! 👋🎶\n\nVocê está escalado(a) para o ministério de louvor:\n📅 *Evento:* ${event.title}\n🗓 *Data:* ${event.date} às ${event.time}\n🎸 *Função:* ${member.role}\n\nPor favor, confirme sua presença no app! Deus abençoe! 🙏✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Gera texto formatado com emojis para compartilhar a escala completa no grupo do WhatsApp
 */
export function generateEventShareText(event: WorshipEvent, songs: Song[] = [], members: Member[] = []): string {
  const confirmedList = Object.entries(event.confirmed || {});
  
  let membersText = '';
  if (confirmedList.length === 0) {
    membersText = '_(Nenhum integrante escalado)_';
  } else {
    membersText = confirmedList.map(([name, status]) => {
      const icon = status === 'accepted' ? '✅' : status === 'declined' ? '❌' : '⏳';
      const memberObj = members.find(m => m.name === name);
      const roleStr = memberObj ? ` (${memberObj.role})` : '';
      return `${icon} *${name}*${roleStr}`;
    }).join('\n');
  }

  let songsText = '';
  if (songs.length > 0) {
    songsText = `\n\n🎵 *REPERTÓRIO / MÚSICAS:*\n` + songs.map((s, idx) => {
      return `${idx + 1}. *${s.title}* - ${s.artist} (Tom: *${s.key}*)${s.url ? `\n   ▶️ ${s.url}` : ''}`;
    }).join('\n');
  }

  const text = `📋 *ESCALA DO MINISTÉRIO DE LOUVOR* 🎶\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⛪ *Evento:* ${event.title}\n` +
    `🗓 *Data:* ${event.date}\n` +
    `⏰ *Horário:* ${event.time}\n` +
    (event.team ? `👥 *Equipe:* ${event.team}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👥 *INTEGRANTES ESCALADOS:*\n` +
    membersText +
    songsText +
    `\n\n_Favor confirmarem a presença o quanto antes. Deus abençoe!_ 🙌`;

  return text;
}

export function createShareWhatsAppGroupLink(event: WorshipEvent, songs: Song[] = [], members: Member[] = []): string {
  const text = generateEventShareText(event, songs, members);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

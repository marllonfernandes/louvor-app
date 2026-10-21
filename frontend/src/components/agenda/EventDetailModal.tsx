import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Music, 
  Trash2, 
  Share2, 
  MessageCircle, 
  Edit3, 
  MessageSquare, 
  Folder,
  Mic,
  Layers,
  Check,
  X,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  BookOpen
} from 'lucide-react';
import { WorshipEvent, Song, Member, ConfirmationStatus, EventSongItem } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PresenceSelector } from './PresenceSelector';
import { JustificationModal } from './JustificationModal';
import { createMemberReminderLink } from '../../utils/whatsapp';
import { getYoutubeThumbnail } from '../../utils/youtube';
import { useAuth } from '../../context/AuthContext';
import { getEventTypeDefinition } from '../../utils/eventType';
import { getAvatarGradient, isSamePersonName, resolveMemberData } from '../../utils/avatar';
import { MemberAvatar } from '../ui/MemberAvatar';
import { 
  getEventSongItems, 
  getEventBlocksOrder, 
  sortMembersWithVocalsFirst,
  isVocalMember,
  getSongMinisters,
  addMinisterToSong,
  removeMinisterFromSong,
  toggleSongMinisterAction,
  formatDateBR,
  resolveEventSong,
  deduplicateConfirmed
} from '../../utils/worshipEvent';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WorshipEvent | null;
  songs: Song[];
  members: Member[];
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus, justification?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onShareWhatsApp: (event: WorshipEvent) => void;
  onSelectSong: (song: Song) => void;
  onEditEvent: (event: WorshipEvent) => void;
  onSaveEvent?: (event: WorshipEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  songs,
  members,
  onStatusChange,
  onDeleteEvent,
  onShareWhatsApp,
  onSelectSong,
  onEditEvent,
  onSaveEvent
}) => {
  const { userProfile, currentUser } = useAuth();
  const [justificationMember, setJustificationMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'repertoire' | 'team' | 'details'>('repertoire');
  const [teamFilter, setTeamFilter] = useState<'all' | ConfirmationStatus>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');

  const deduplicatedConfirmed = useMemo(
    () => (event ? deduplicateConfirmed(event.confirmed || {}) : {}),
    [event?.confirmed]
  );
  const confirmedEntries = useMemo(() => Object.entries(deduplicatedConfirmed), [deduplicatedConfirmed]);
  const confirmedMemberNames = useMemo(() => Object.keys(deduplicatedConfirmed), [deduplicatedConfirmed]);

  if (!event) return null;

  const getRoleEmoji = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r.includes('líder') || r.includes('lider')) return '👑';
    if (r.includes('ministro') || r.includes('vocal') || r.includes('backing')) return '🎤';
    if (r.includes('teclado') || r.includes('piano')) return '🎹';
    if (r.includes('bateria') || r.includes('percuss')) return '🥁';
    if (r.includes('baixo') || r.includes('violão') || r.includes('violao') || r.includes('guitarra')) return '🎸';
    if (r.includes('sax') || r.includes('metal') || r.includes('metais')) return '🎷';
    if (r.includes('som') || r.includes('sonoplastia')) return '🎚️';
    if (r.includes('mídia') || r.includes('midia') || r.includes('proje')) return '💻';
    return '🎵';
  };

  const items = getEventSongItems(event);
  const itemsWithSongs = items.map((item, globalIndex) => {
    const song = resolveEventSong(item, songs);
    return song ? { item, song, globalIndex } : null;
  }).filter(Boolean) as { item: EventSongItem; song: Song; globalIndex: number }[];

  const hasBlocks = itemsWithSongs.some(it => Boolean(it.item.block?.trim()));
  const blocksOrder = getEventBlocksOrder(event);
  const presentBlocks = Array.from(
    new Set(itemsWithSongs.map(i => i.item.block?.trim()).filter(Boolean))
  ) as string[];
  const orderedBlocks = Array.from(
    new Set([...blocksOrder.filter(b => presentBlocks.includes(b)), ...presentBlocks])
  );

  const scheduledMembers = members.filter(m => confirmedMemberNames.some(name => isSamePersonName(name, m.name)));
  const selectableMembers = scheduledMembers.length > 0 ? scheduledMembers : members;
  const sortedSelectable = sortMembersWithVocalsFirst(selectableMembers);

  const typeDef = getEventTypeDefinition(event.type);

  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const isAdmin = userProfile?.systemRole === 'Admin';

  const currentUserObj = members.find(m => isSamePersonName(m.name, userProfile?.name));
  const isUserMinistro = (currentUserObj?.role || userProfile?.role || '').toLowerCase().includes('ministro');

  const handleStatusChangeClick = (memberName: string, status: ConfirmationStatus) => {
    if (status === 'declined') {
      setJustificationMember(memberName);
    } else {
      onStatusChange(event.id, memberName, status);
    }
  };

  const handleConfirmJustification = (justification: string) => {
    if (justificationMember) {
      onStatusChange(event.id, justificationMember, 'declined', justification);
      setJustificationMember(null);
    }
  };

  const handleAddMinister = (globalIndex: number, ministerName: string, action: 'canta' | 'ministra' = 'canta') => {
    if (!onSaveEvent || !event || !ministerName.trim()) return;

    const currentItems = getEventSongItems(event);
    const updatedItems = currentItems.map((it, idx) => {
      if (idx === globalIndex) {
        return addMinisterToSong(it, ministerName.trim(), action);
      }
      return it;
    });

    onSaveEvent({
      ...event,
      songItems: updatedItems,
      songIds: updatedItems.map(i => i.songId)
    });
  };

  const handleRemoveMinister = (globalIndex: number, ministerIndex: number) => {
    if (!onSaveEvent || !event) return;

    const currentItems = getEventSongItems(event);
    const updatedItems = currentItems.map((it, idx) => {
      if (idx === globalIndex) {
        return removeMinisterFromSong(it, ministerIndex);
      }
      return it;
    });

    onSaveEvent({
      ...event,
      songItems: updatedItems,
      songIds: updatedItems.map(i => i.songId)
    });
  };

  const handleToggleMinisterAction = (globalIndex: number, ministerIndex: number) => {
    if (!onSaveEvent || !event) return;

    const currentItems = getEventSongItems(event);
    const updatedItems = currentItems.map((it, idx) => {
      if (idx === globalIndex) {
        return toggleSongMinisterAction(it, ministerIndex);
      }
      return it;
    });

    onSaveEvent({
      ...event,
      songItems: updatedItems,
      songIds: updatedItems.map(i => i.songId)
    });
  };

  const renderSongRow = (item: EventSongItem, song: Song, displayIdx: number, globalIndex: number) => {
    const isHarpaItem = Boolean(item.isHarpa || item.harpaTitle);
    const songThumb = !isHarpaItem && song.url ? getYoutubeThumbnail(song.url, 'hq') : null;
    const ministers = getSongMinisters(item);
    const currentUserName = userProfile?.name?.trim() || '';
    const isUserAlreadyAssigned = Boolean(
      currentUserName && ministers.some(m => m.name.toLowerCase() === currentUserName.toLowerCase())
    );
    const canManageMinister = Boolean(onSaveEvent);
    const canAddMore = ministers.length < 2;

    const cardBorderClass = isHarpaItem
      ? 'border-amber-500/35 dark:border-amber-500/35'
      : ministers.length > 0
      ? 'border-blue-500/30 dark:border-blue-500/30'
      : 'border-slate-200/90 dark:border-slate-800/90';

    return (
      <div
        key={`${song.id}-${globalIndex}`}
        className={`bg-surface-container border ${cardBorderClass} rounded-2xl p-3.5 space-y-3 shadow-sm transition-all`}
      >
        {/* Topo do Card: Capa/Avatar da Música com Ordem + Título/Artista + Pill de Tom */}
        <div
          onClick={() => {
            if (isHarpaItem) return;
            onClose();
            onSelectSong(song);
          }}
          className={`flex items-center justify-between transition-all gap-3 group ${
            isHarpaItem ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Capa estilo Avatar Mobile com Número da Ordem Flutuante */}
            <div className="relative flex-shrink-0">
              {songThumb ? (
                <img
                  src={songThumb}
                  alt={song.title}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/20 dark:border-slate-700 shadow-sm bg-slate-900"
                  loading="lazy"
                />
              ) : isHarpaItem ? (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 border border-white/20">
                  <BookOpen size={18} />
                </div>
              ) : (
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                    song.title
                  )} text-white flex items-center justify-center shadow-md border border-white/20`}
                >
                  <Music size={18} />
                </div>
              )}

              {/* Badge Circular com Número da Faixa no Canto */}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs ${
                  isHarpaItem ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                }`}
              >
                {displayIdx}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isHarpaItem && item.harpaNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 text-[10px] font-black shrink-0">
                    Nº {item.harpaNumber}
                  </span>
                )}
                <p
                  className={`text-[15px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate transition-colors ${
                    !isHarpaItem ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : ''
                  }`}
                >
                  {isHarpaItem ? (item.harpaTitle || song.title) : song.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {isHarpaItem ? '📖 Harpa Cristã' : song.artist}
                </span>
                {song.group && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold shrink-0">
                    <Folder size={10} className="text-purple-500 dark:text-purple-400" />
                    {song.group}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cápsula de Tom + Indicador de Cifra */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {song.key && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[11px] font-extrabold shadow-2xs">
                <span>🎵</span>
                <span>Tom: {song.key}</span>
              </span>
            )}
            {!isHarpaItem && (
              <ChevronRight size={15} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </div>

        {/* Rodapé do Card: Vocais / Ministrantes com Avatares e Botões em Cápsula */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Integrantes já escalados neste louvor */}
          {ministers.length > 0 && (
            <div className="space-y-1.5">
              {ministers.map((m, mIdx) => {
                const { avatarUrl: ministerAvatarUrl, isCurrentUser: isThisUser } = resolveMemberData(
                  m.name,
                  members,
                  userProfile,
                  currentUser?.photoURL
                );
                const canModifyThis = canManageMinister && (isLeader || isAdmin || isThisUser);
                const isMinistra = m.action === 'ministra';

                return (
                  <div
                    key={`${m.name}-${mIdx}`}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs ${
                      isMinistra
                        ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-400/40 dark:border-amber-500/30'
                        : 'bg-blue-500/10 dark:bg-blue-500/10 border-blue-400/40 dark:border-blue-500/30'
                    }`}
                  >
                    {/* Mini Avatar + Nome e Papel no Louvor */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex-shrink-0">
                        <MemberAvatar
                          name={m.name}
                          avatarUrl={ministerAvatarUrl}
                          size="xs"
                          shape="rounded-full"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isMinistra
                              ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isMinistra ? '🔥 Ministra' : '🎤 Canta'}
                        </span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-xs truncate">
                          {m.name}
                        </span>
                      </div>
                    </div>

                    {/* Ações Modernas em Cápsula */}
                    {canModifyThis && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMinisterAction(globalIndex, mIdx);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="Alternar entre Canta e Ministra"
                        >
                          <ArrowLeftRight size={10} />
                          <span>{isMinistra ? 'Canta' : 'Ministra'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMinister(globalIndex, mIdx);
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 active:scale-90 transition-all cursor-pointer"
                          title="Remover integrante deste louvor"
                        >
                          <X size={12} className="stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Opções em Cápsula para adicionar vocal/ministro quando houver menos de 2 */}
          {canManageMinister && canAddMore && (
            <div className="flex items-center gap-1.5 flex-wrap justify-between">
              {/* Botões em Cápsula para o usuário logado: Vou Cantar e Vou Ministrar */}
              {currentUserName && !isUserAlreadyAssigned ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMinister(globalIndex, currentUserName, 'canta');
                    }}
                    className="group flex-1 h-8 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-900 dark:text-blue-200 border border-blue-400/50 dark:border-blue-500/40 active:scale-95 transition-all cursor-pointer"
                    title="Dizer que você vai cantar este louvor"
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Mic size={10} />
                    </span>
                    <span className="truncate">
                      {ministers.length > 0 ? '+ Cantar Junto' : 'Vou Cantar'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMinister(globalIndex, currentUserName, 'ministra');
                    }}
                    className="group flex-1 h-8 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400/50 dark:border-amber-500/40 active:scale-95 transition-all cursor-pointer"
                    title="Dizer que você vai ministrar este louvor"
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles size={10} />
                    </span>
                    <span className="truncate">
                      {ministers.length > 0 ? '+ Ministrar Junto' : 'Vou Ministrar'}
                    </span>
                  </button>
                </div>
              ) : ministers.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Vocal não definido</span>
              ) : (
                <span className="text-[11px] text-slate-500 italic">Pode adicionar até 2 vocais</span>
              )}

              {/* Seletor em Cápsula para escolher qualquer integrante da equipe: APENAS LÍDER OU ADMIN */}
              {(isLeader || isAdmin) && (
                <select
                  value=""
                  onChange={e => {
                    e.stopPropagation();
                    if (e.target.value) handleAddMinister(globalIndex, e.target.value, 'canta');
                  }}
                  className="h-8 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-full px-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 max-w-[165px] truncate cursor-pointer"
                >
                  <option value="">
                    {ministers.length === 0 ? '+ Escolher vocal...' : '+ 2º vocal...'}
                  </option>
                  {sortedSelectable.vocals.length > 0 && (
                    <optgroup label="🎤 Vocais & Ministros">
                      {sortedSelectable.vocals
                        .filter(m => !ministers.some(assigned => assigned.name.toLowerCase() === m.name.toLowerCase()))
                        .map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {sortedSelectable.others.length > 0 && (
                    <optgroup label="Outros Integrantes">
                      {sortedSelectable.others
                        .filter(m => !ministers.some(assigned => assigned.name.toLowerCase() === m.name.toLowerCase()))
                        .map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>
          )}

          {ministers.length === 0 && !canManageMinister && (
            <span className="text-[11px] text-slate-500 italic">Vocal não definido</span>
          )}
        </div>
      </div>
    );
  };

  const confirmedCount = confirmedEntries.filter(([_, st]) => st === 'accepted').length;
  const pendingCount = confirmedEntries.filter(([_, st]) => st === 'pending').length;
  const declinedCount = confirmedEntries.filter(([_, st]) => st === 'declined').length;
  const scheduledUserKey = confirmedMemberNames.find(name => isSamePersonName(name, userProfile?.name));
  const isCurrentUserScheduled = Boolean(scheduledUserKey);
  const currentUserStatus = scheduledUserKey ? deduplicatedConfirmed[scheduledUserKey] : undefined;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={event.title}
        subtitle={`Escala: ${event.team || 'Escala Avulsa'}`}
        footer={
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="whatsapp"
              size="sm"
              className="min-h-[42px] text-xs font-bold shadow-md"
              onClick={() => {
                onClose();
                onShareWhatsApp(event);
              }}
              icon={<Share2 size={15} />}
            >
              WhatsApp
            </Button>

            {isLeader ? (
              <Button
                variant="primary"
                size="sm"
                className="min-h-[42px] text-xs font-bold shadow-md"
                onClick={() => {
                  onClose();
                  onEditEvent(event);
                }}
                icon={<Edit3 size={15} />}
              >
                Editar Escala
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[42px] text-xs font-bold"
                onClick={onClose}
              >
                Fechar
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-3.5 text-left">
          {/* Cabeçalho Compacto: Tipo do Culto, Data/Hora, Status do Usuário & Ações */}
          <div className="flex items-center justify-between gap-2 bg-surface-container p-2.5 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {event.type && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm ${typeDef.badgeClass}`}>
                  <typeDef.icon size={12} className="shrink-0" />
                  <span>{typeDef.label}</span>
                </span>
              )}
              <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                <Calendar size={12} className="text-primary" />
                {formatDateBR(event.date)} às {event.time}
              </span>

              {/* Status de Presença do Usuário (se já respondido) */}
              {isCurrentUserScheduled && currentUserStatus === 'accepted' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>Você vai</span>
                </span>
              )}
              {isCurrentUserScheduled && currentUserStatus === 'declined' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                  <span>Não vai</span>
                </span>
              )}
            </div>

            {isLeader && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditEvent(event);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-surface-variant text-primary border border-outline-variant/30 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                title="Editar este evento"
              >
                <Edit3 size={12} />
                <span>Editar</span>
              </button>
            )}
          </div>

          {/* Banner de Ação Rápida (Aparece APENAS quando a presença ainda estiver PENDENTE) */}
          {isCurrentUserScheduled && scheduledUserKey && currentUserStatus === 'pending' && (
            <div className="bg-surface-container border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">Você está escalado neste culto</p>
                  <p className="text-[11px] text-on-surface-variant truncate">Confirme se poderá ministrar</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleStatusChangeClick(scheduledUserKey, 'accepted')}
                  className="h-8 px-3 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>Confirmar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChangeClick(scheduledUserKey, 'declined')}
                  className="h-8 px-2.5 rounded-xl bg-surface-container-high hover:bg-rose-500/10 text-on-surface-variant hover:text-rose-400 border border-outline-variant/30 font-label-md text-xs font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  title="Não poderei ir (justificar ausência)"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                  <span>Não vou</span>
                </button>
              </div>
            </div>
          )}

          {/* Abas de Navegação (Músicas, Escala, Detalhes) estilo Sanctuary Slate */}
          <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-2xl border border-outline-variant/20 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('repertoire')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                activeTab === 'repertoire'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Music size={13} className="shrink-0" />
              <span className="truncate">Músicas</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                activeTab === 'repertoire' ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {itemsWithSongs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Users size={13} className="shrink-0" />
              <span className="truncate">Escala</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                activeTab === 'team' ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {confirmedCount}/{confirmedEntries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Calendar size={13} className="shrink-0" />
              <span className="truncate">Detalhes</span>
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: REPERTÓRIO */}
          {activeTab === 'repertoire' && (
            <div className="space-y-3.5 pt-1">
              {(() => {
                const songsWithVocalCount = itemsWithSongs.filter(
                  ({ item }) => getSongMinisters(item).length > 0
                ).length;

                return (
                  <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/20 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Music size={14} className="text-primary" />
                        <span className="text-xs font-extrabold text-on-surface tracking-tight">
                          Repertório do Culto ({itemsWithSongs.length})
                        </span>
                      </div>
                      {itemsWithSongs.length > 0 && (
                        <span className="text-[11px] font-black text-primary bg-primary-container/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                          {songsWithVocalCount}/{itemsWithSongs.length} com vocal
                        </span>
                      )}
                    </div>

                    {itemsWithSongs.length > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          style={{
                            width: `${(songsWithVocalCount / Math.max(1, itemsWithSongs.length)) * 100}%`
                          }}
                          className="h-full bg-primary-container rounded-full transition-all duration-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Toque no card da música para abrir a cifra e ouvir
                      </span>
                    </div>

                    {hasBlocks && orderedBlocks.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => setBlockFilter('all')}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border cursor-pointer ${
                            blockFilter === 'all'
                              ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                              : 'bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          Todos ({itemsWithSongs.length})
                        </button>
                        {orderedBlocks.map(bName => {
                          const count = itemsWithSongs.filter(
                            i => (i.item.block || '').trim().toLowerCase() === bName.toLowerCase()
                          ).length;
                          if (count === 0) return null;
                          return (
                            <button
                              key={bName}
                              type="button"
                              onClick={() => setBlockFilter(bName)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border cursor-pointer ${
                                blockFilter.toLowerCase() === bName.toLowerCase()
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                                  : 'bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {bName} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {itemsWithSongs.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/60 space-y-2">
                  <Music size={24} className="mx-auto text-slate-500 dark:text-slate-600" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Nenhuma música adicionada a este culto ainda.
                  </p>
                </div>
              ) : hasBlocks ? (
                <div className="space-y-3">
                  {orderedBlocks
                    .filter(b => blockFilter === 'all' || b.toLowerCase() === blockFilter.toLowerCase())
                    .map(blockName => {
                      const blockItems = itemsWithSongs.filter(
                        i => (i.item.block || '').trim().toLowerCase() === blockName.toLowerCase()
                      );
                      if (blockItems.length === 0) return null;

                      return (
                        <div key={blockName} className="space-y-2.5 bg-slate-50/60 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <Layers size={13} />
                              {blockName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                              {blockItems.length} {blockItems.length === 1 ? 'música' : 'músicas'}
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {blockItems.map(({ item, song, globalIndex }, idx) => 
                              renderSongRow(item, song, idx + 1, globalIndex)
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Louvores sem bloco atribuído */}
                  {blockFilter === 'all' && (() => {
                    const unassigned = itemsWithSongs.filter(i => !i.item.block?.trim());
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="space-y-2.5 bg-slate-50/60 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Layers size={13} />
                            Louvor Geral
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                            {unassigned.length}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {unassigned.map(({ item, song, globalIndex }, idx) => 
                            renderSongRow(item, song, idx + 1, globalIndex)
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {itemsWithSongs.map(({ item, song, globalIndex }, idx) => 
                    renderSongRow(item, song, idx + 1, globalIndex)
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: ESCALA & PRESENÇA */}
          {activeTab === 'team' && (
            <div className="space-y-3.5 pt-1">
              {/* Card Moderno de Progresso & Filtros Mobile */}
              <div className="bg-slate-50/90 dark:bg-slate-950/90 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                      Confirmações da Equipe
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                    {confirmedCount} de {confirmedEntries.length} ({Math.round((confirmedCount / Math.max(1, confirmedEntries.length)) * 100)}%)
                  </span>
                </div>

                {/* Barra de Progresso Multi-segmento */}
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden flex gap-0.5 p-0.5">
                  {confirmedCount > 0 && (
                    <div
                      style={{ width: `${(confirmedCount / Math.max(1, confirmedEntries.length)) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    />
                  )}
                  {pendingCount > 0 && (
                    <div
                      style={{ width: `${(pendingCount / Math.max(1, confirmedEntries.length)) * 100}%` }}
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    />
                  )}
                  {declinedCount > 0 && (
                    <div
                      style={{ width: `${(declinedCount / Math.max(1, confirmedEntries.length)) * 100}%` }}
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    />
                  )}
                </div>

                {/* Pills Interativos de Filtro */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTeamFilter('all')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 border flex flex-col items-center justify-center cursor-pointer ${
                      teamFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs shadow-blue-500/20'
                        : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 hover:border-blue-400/40'
                    }`}
                  >
                    <span className="text-[10px] opacity-85">Todos</span>
                    <span className="text-sm font-black leading-tight">{confirmedEntries.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamFilter('accepted')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 border flex flex-col items-center justify-center cursor-pointer ${
                      teamFilter === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-400/30'
                        : 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                    }`}
                  >
                    <span className="text-[10px]">Confirmados</span>
                    <span className="text-sm font-black leading-tight text-slate-900 dark:text-white">{confirmedCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamFilter('pending')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 border flex flex-col items-center justify-center cursor-pointer ${
                      teamFilter === 'pending'
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/30'
                        : 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                    }`}
                  >
                    <span className="text-[10px]">Pendentes</span>
                    <span className="text-sm font-black leading-tight text-slate-900 dark:text-white">{pendingCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamFilter('declined')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 border flex flex-col items-center justify-center cursor-pointer ${
                      teamFilter === 'declined'
                        ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-500/60 ring-1 ring-rose-400/30'
                        : 'bg-rose-500/5 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15'
                    }`}
                  >
                    <span className="text-[10px]">Não vão</span>
                    <span className="text-sm font-black leading-tight text-slate-900 dark:text-white">{declinedCount}</span>
                  </button>
                </div>
              </div>

              {/* Lista de Integrantes em Cards Mobile Modernos */}
              {confirmedEntries.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  Nenhum integrante escalado para este culto.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {confirmedEntries
                    .filter(([_, st]) => teamFilter === 'all' || st === teamFilter)
                    .map(([memberName, status]) => {
                      const { memberObj, avatarUrl, isCurrentUser: isMe } = resolveMemberData(
                        memberName,
                        members,
                        userProfile,
                        currentUser?.photoURL
                      );
                      const waLink = memberObj ? createMemberReminderLink(memberObj, event, songs) : '';
                      
                      const justification = event.justifications?.[memberName];
                      const roleList = memberObj?.roles?.length
                        ? memberObj.roles
                        : memberObj?.role
                        ? memberObj.role.split(/[,/]/).map(r => r.trim()).filter(Boolean)
                        : isMe && userProfile?.roles?.length
                        ? userProfile.roles
                        : isMe && userProfile?.role
                        ? userProfile.role.split(/[,/]/).map(r => r.trim()).filter(Boolean)
                        : [];

                      const isRoleLeader = roleList.includes('Líder');

                      const cardBorderClass =
                        status === 'accepted'
                          ? 'border-emerald-500/30 dark:border-emerald-500/30'
                          : status === 'declined'
                          ? 'border-rose-500/30 dark:border-rose-500/30'
                          : 'border-slate-200/90 dark:border-slate-800/90';

                      return (
                        <div
                          key={memberName}
                          className={`bg-white/95 dark:bg-slate-950/85 p-3.5 rounded-2xl border ${cardBorderClass} space-y-3 shadow-xs transition-all text-xs`}
                        >
                          {/* Topo do Card: Avatar com Status + Info + Botão Rápido WhatsApp */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar Moderno com Badge de Status Flutuante */}
                              <div className="relative flex-shrink-0">
                                <MemberAvatar
                                  name={memberName}
                                  avatarUrl={avatarUrl}
                                  size="md"
                                  shape="rounded-2xl"
                                  isLeader={isRoleLeader}
                                />

                                {/* Indicador de Status no Canto do Avatar */}
                                <span
                                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-950 flex items-center justify-center shadow-xs ${
                                    status === 'accepted'
                                      ? 'bg-emerald-500 text-white'
                                      : status === 'declined'
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-amber-400 text-slate-950'
                                  }`}
                                  title={
                                    status === 'accepted'
                                      ? 'Confirmado'
                                      : status === 'declined'
                                      ? 'Não vai'
                                      : 'Pendente'
                                  }
                                >
                                  {status === 'accepted' ? (
                                    <Check size={11} className="stroke-[3]" />
                                  ) : status === 'declined' ? (
                                    <X size={11} className="stroke-[3]" />
                                  ) : (
                                    <Clock size={11} className="stroke-[2.5]" />
                                  )}
                                </span>
                              </div>

                              {/* Nome, Funções em Pills e Telefone */}
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-[15px] leading-tight truncate">
                                    {memberName}
                                  </p>
                                  {isMe && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                      Você
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {roleList.length > 0 ? (
                                    roleList.slice(0, 2).map(roleItem => (
                                      <span
                                        key={roleItem}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800"
                                      >
                                        <span>{getRoleEmoji(roleItem)}</span>
                                        <span>{roleItem}</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/90 dark:border-slate-800">
                                      🎵 Integrante
                                    </span>
                                  )}

                                  {memberObj?.phone && (
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                      • {memberObj.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botão Circular Moderno do WhatsApp */}
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 active:scale-90 transition-all shrink-0 shadow-2xs"
                                title={`Enviar lembrete para ${memberName} no WhatsApp`}
                              >
                                <MessageCircle size={16} />
                              </a>
                            )}
                          </div>

                          {/* Rodapé do Card: Controles de Presença em Cápsulas ou Badge de Status */}
                          {(isAdmin || isMe) ? (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                              <PresenceSelector
                                status={status}
                                onChange={(newStatus) => handleStatusChangeClick(memberName, newStatus)}
                                size="sm"
                              />
                              {status === 'declined' && justification && (
                                <div className="flex items-center gap-1.5 bg-rose-500/5 dark:bg-slate-900/70 p-2 rounded-xl border border-rose-500/20 dark:border-slate-800">
                                  <MessageSquare size={12} className="text-rose-500 dark:text-slate-400 shrink-0" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                                    Justificativa: {justification}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                                  status === 'accepted'
                                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                    : status === 'declined'
                                    ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {status === 'accepted' ? (
                                  <Check size={11} className="stroke-[3]" />
                                ) : status === 'declined' ? (
                                  <X size={11} className="stroke-[3]" />
                                ) : (
                                  <Clock size={11} className="stroke-[2.5]" />
                                )}
                                <span>
                                  {status === 'accepted'
                                    ? 'Presença Confirmada'
                                    : status === 'declined'
                                    ? 'Não poderá comparecer'
                                    : 'Aguardando confirmação'}
                                </span>
                              </span>

                              {status === 'declined' && justification && (
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                                  <MessageSquare size={11} className="text-slate-500 dark:text-slate-400" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                                    {justification}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 3: DETALHES & AVISOS */}
          {activeTab === 'details' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Data</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDateBR(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock size={15} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Horário</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{event.time}</p>
                  </div>
                </div>
                {event.location && (
                  <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-800/80">
                    <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Local</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{event.location}</p>
                    </div>
                  </div>
                )}
                <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-800/80">
                  <Users size={15} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Equipe Base</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{event.team || 'Escala Avulsa'}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {event.notes && (
                <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Observações & Instruções:</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}

              {/* Excluir Evento (Apenas Administrador) */}
              {isAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full text-center text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    onClick={() => {
                      if (confirm('Deseja realmente excluir este evento da escala?')) {
                        onDeleteEvent(event.id);
                        onClose();
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Excluir este evento</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </BottomSheet>
      <JustificationModal
        isOpen={Boolean(justificationMember)}
        onClose={() => setJustificationMember(null)}
        onConfirm={handleConfirmJustification}
        memberName={justificationMember || ''}
      />
    </>
  );
};


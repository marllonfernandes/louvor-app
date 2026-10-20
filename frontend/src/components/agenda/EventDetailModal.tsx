import React, { useState } from 'react';
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
  Layers
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
import { 
  getEventSongItems, 
  getEventBlocksOrder, 
  sortMembersWithVocalsFirst,
  isVocalMember,
  getSongMinisters,
  addMinisterToSong,
  removeMinisterFromSong,
  toggleSongMinisterAction,
  formatDateBR
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
  const [justificationMember, setJustificationMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'repertoire' | 'team' | 'details'>('repertoire');

  if (!event) return null;

  const items = getEventSongItems(event);
  const itemsWithSongs = items.map((item, globalIndex) => {
    const song = songs.find(s => s.id === item.songId);
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

  const confirmedEntries = Object.entries(event.confirmed || {});
  const confirmedMemberNames = Object.keys(event.confirmed || {});
  const scheduledMembers = members.filter(m => confirmedMemberNames.includes(m.name));
  const selectableMembers = scheduledMembers.length > 0 ? scheduledMembers : members;
  const sortedSelectable = sortMembersWithVocalsFirst(selectableMembers);

  const typeDef = getEventTypeDefinition(event.type);

  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const isAdmin = userProfile?.systemRole === 'Admin';

  const currentUserObj = members.find(m => m.name === userProfile?.name);
  const isUserMinistro = (currentUserObj?.role || '').toLowerCase().includes('ministro');

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
    const songThumb = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;
    const ministers = getSongMinisters(item);
    const currentUserName = userProfile?.name?.trim() || '';
    const isUserAlreadyAssigned = Boolean(
      currentUserName && ministers.some(m => m.name.toLowerCase() === currentUserName.toLowerCase())
    );
    const canManageMinister = Boolean(onSaveEvent);
    const canAddMore = ministers.length < 2;

    return (
      <div
        key={`${song.id}-${globalIndex}`}
        className="bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 space-y-2.5 shadow-sm"
      >
        <div
          onClick={() => {
            onClose();
            onSelectSong(song);
          }}
          className="flex items-center justify-between cursor-pointer transition-all active:scale-98 gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
              {displayIdx}
            </span>
            {songThumb ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700/60">
                <img
                  src={songThumb}
                  alt={song.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Music size={16} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-slate-100 truncate">{song.title}</p>
                {song.group && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-medium shrink-0">
                    <Folder size={10} className="text-purple-400" />
                    {song.group}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
            </div>
          </div>
          <Badge variant="blue" size="sm" className="flex-shrink-0">
            Tom: {song.key}
          </Badge>
        </div>

        {/* Linha de Atribuição de Vocal / Ministrante (1 ou 2 integrantes) */}
        <div className="pt-2 border-t border-slate-200/90 dark:border-slate-800/80 space-y-2">
          {/* Integrantes já escalados neste louvor */}
          {ministers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {ministers.map((m, mIdx) => {
                const isThisUser = Boolean(
                  currentUserName && m.name.toLowerCase() === currentUserName.toLowerCase()
                );
                const canModifyThis = canManageMinister && (isLeader || isAdmin || isThisUser);

                return (
                  <div
                    key={`${m.name}-${mIdx}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                      m.action === 'ministra'
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/90 dark:border-amber-500/25 text-amber-900 dark:text-amber-300'
                        : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/90 dark:border-blue-500/25 text-blue-900 dark:text-blue-300'
                    }`}
                  >
                    <Mic size={12} className={m.action === 'ministra' ? 'text-amber-700 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'} />
                    <span className="font-bold">
                      {m.action === 'ministra' ? 'Ministra:' : 'Canta:'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{m.name}</span>

                    {canModifyThis && (
                      <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-slate-300 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMinisterAction(globalIndex, mIdx);
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all"
                          title="Alternar entre Canta e Ministra"
                        >
                          Mudar p/ {m.action === 'ministra' ? 'Canta' : 'Ministra'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMinister(globalIndex, mIdx);
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 active:scale-95 transition-all"
                          title="Desmarcar integrante"
                        >
                          Desmarcar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Opções para adicionar vocal/ministro quando houver menos de 2 */}
          {canManageMinister && canAddMore && (
            <div className="flex items-center gap-2 flex-wrap justify-between">
              {/* Botões rápidos para o usuário logado: Vou Cantar E Vou Ministrar */}
              {currentUserName && !isUserAlreadyAssigned ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMinister(globalIndex, currentUserName, 'canta');
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-800 dark:text-blue-300 border border-blue-200/90 dark:border-blue-500/30 active:scale-95 transition-all shadow-none"
                    title="Dizer que você vai cantar este louvor"
                  >
                    <Mic size={12} className="text-blue-600 dark:text-blue-400" />
                    <span>{ministers.length > 0 ? '+ Vou Cantar Junto' : '🎤 Vou Cantar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMinister(globalIndex, currentUserName, 'ministra');
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-200/90 dark:border-amber-500/30 active:scale-95 transition-all shadow-none"
                    title="Dizer que você vai ministrar este louvor"
                  >
                    <Mic size={12} className="text-amber-600 dark:text-amber-400" />
                    <span>{ministers.length > 0 ? '+ Vou Ministrar Junto' : '🎤 Vou Ministrar'}</span>
                  </button>
                </div>
              ) : ministers.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Vocal não definido</span>
              ) : (
                <span className="text-[11px] text-slate-500 italic">Pode adicionar até 2 vocais</span>
              )}

              {/* Seletor dropdown para escolher qualquer integrante da equipe: APENAS LÍDER OU ADMIN */}
              {(isLeader || isAdmin) && (
                <select
                  value=""
                  onChange={e => {
                    e.stopPropagation();
                    if (e.target.value) handleAddMinister(globalIndex, e.target.value, 'canta');
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 max-w-[170px] truncate"
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
  const isCurrentUserScheduled = Boolean(userProfile?.name && confirmedMemberNames.includes(userProfile.name));
  const currentUserStatus = userProfile?.name ? event.confirmed?.[userProfile.name] : undefined;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={event.title}
        subtitle={`Escala: ${event.team || 'Escala Avulsa'}`}
      >
        <div className="space-y-3.5 text-left">
          {/* Cabeçalho Compacto: Tipo do Culto & Informações Rápidas */}
          <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {event.type && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm ${typeDef.badgeClass}`}>
                  <typeDef.icon size={12} className="shrink-0" />
                  <span>{typeDef.label}</span>
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={12} className="text-blue-600 dark:text-blue-400" />
                {formatDateBR(event.date)} às {event.time}
              </span>
            </div>

            {isLeader && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditEvent(event);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-bold transition-all active:scale-95"
                title="Editar este evento"
              >
                <Edit3 size={12} />
                <span>Editar</span>
              </button>
            )}
          </div>

          {/* Seletor Rápido de Presença para o Usuário Logado (se escalado) */}
          {isCurrentUserScheduled && userProfile?.name && (
            <div className="bg-blue-50/70 dark:bg-gradient-to-r dark:from-blue-950/40 dark:to-slate-950/70 p-2.5 rounded-2xl border border-blue-200 dark:border-blue-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users size={13} className="text-blue-600 dark:text-blue-400" />
                  Sua confirmação de presença:
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  currentUserStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' :
                  currentUserStatus === 'declined' ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {currentUserStatus === 'accepted' ? 'Confirmado' : currentUserStatus === 'declined' ? 'Não vai' : 'Pendente'}
                </span>
              </div>
              <PresenceSelector
                status={currentUserStatus || 'pending'}
                onChange={(newStatus) => handleStatusChangeClick(userProfile.name!, newStatus)}
                size="sm"
              />
            </div>
          )}

          {/* Abas de Navegação (Músicas, Escala, Detalhes) estilo Segmented Control iOS */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('repertoire')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'repertoire'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Music size={13} className="shrink-0" />
              <span className="truncate">Músicas</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                activeTab === 'repertoire' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {itemsWithSongs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'team'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Users size={13} className="shrink-0" />
              <span className="truncate">Escala</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {confirmedCount}/{confirmedEntries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'details'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Calendar size={13} className="shrink-0" />
              <span className="truncate">Detalhes</span>
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: REPERTÓRIO */}
          {activeTab === 'repertoire' && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Music size={13} className="text-blue-400" />
                  Repertório ({itemsWithSongs.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Toque na música para abrir a cifra
                </span>
              </div>

              {itemsWithSongs.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
                  <Music size={24} className="mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400 italic">Nenhuma música adicionada a este culto ainda.</p>
                </div>
              ) : hasBlocks ? (
                <div className="space-y-3">
                  {orderedBlocks.map(blockName => {
                    const blockItems = itemsWithSongs.filter(
                      i => (i.item.block || '').trim().toLowerCase() === blockName.toLowerCase()
                    );
                    if (blockItems.length === 0) return null;

                    return (
                      <div key={blockName} className="space-y-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <Layers size={13} />
                            {blockName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                            {blockItems.length} {blockItems.length === 1 ? 'música' : 'músicas'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {blockItems.map(({ item, song, globalIndex }, idx) => 
                            renderSongRow(item, song, idx + 1, globalIndex)
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Louvores sem bloco atribuído */}
                  {(() => {
                    const unassigned = itemsWithSongs.filter(i => !i.item.block?.trim());
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers size={13} />
                            Louvor Geral
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                            {unassigned.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {unassigned.map(({ item, song, globalIndex }, idx) => 
                            renderSongRow(item, song, idx + 1, globalIndex)
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2">
                  {itemsWithSongs.map(({ item, song, globalIndex }, idx) => 
                    renderSongRow(item, song, idx + 1, globalIndex)
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: ESCALA & PRESENÇA */}
          {activeTab === 'team' && (
            <div className="space-y-3 pt-1">
              {/* Resumo de Presença */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Confirmados</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">{confirmedCount}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                  <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase">Pendentes</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">{pendingCount}</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase">Não vão</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">{declinedCount}</p>
                </div>
              </div>

              {/* Lista de Integrantes */}
              {confirmedEntries.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-center">
                  Nenhum integrante escalado para este culto.
                </p>
              ) : (
                <div className="space-y-2">
                  {confirmedEntries.map(([memberName, status]) => {
                    const memberObj = members.find(m => m.name === memberName);
                    const waLink = memberObj ? createMemberReminderLink(memberObj, event, songs) : '';
                    const initials = memberName
                      .split(' ')
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();
                    
                    const justification = event.justifications?.[memberName];

                    return (
                      <div
                        key={memberName}
                        className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 shadow-sm text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-700">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-100 text-sm truncate">{memberName}</p>
                              {memberObj && (
                                <p className="text-[11px] text-slate-400 truncate">{memberObj.role} • {memberObj.phone}</p>
                              )}
                            </div>
                          </div>

                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 active:scale-95 transition-all"
                              title="Avisar no WhatsApp"
                            >
                              <MessageCircle size={13} />
                              <span>Lembrar</span>
                            </a>
                          )}
                        </div>

                        {/* Seletor Amplo de Presença */}
                        {(isAdmin || userProfile?.name === memberName) ? (
                          <>
                            <PresenceSelector
                              status={status}
                              onChange={(newStatus) => handleStatusChangeClick(memberName, newStatus)}
                              size="sm"
                            />
                            {status === 'declined' && justification && (
                              <div className="flex items-center gap-1.5 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                <MessageSquare size={12} className="text-slate-400" />
                                <span className="text-slate-300 font-medium">{justification}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="pt-1 flex flex-col gap-1">
                            <div className="text-xs font-bold text-slate-400">
                              Status: {status === 'accepted' ? 'Confirmado' : status === 'declined' ? 'Não vai' : 'Pendente'}
                            </div>
                            {status === 'declined' && justification && (
                              <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800 w-fit">
                                <MessageSquare size={12} className="text-slate-400" />
                                <span className="text-slate-300 font-medium">{justification}</span>
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

          {/* Rodapé Fixo com Ações Rápidas */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
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


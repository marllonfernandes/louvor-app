import React, { useState, useEffect } from 'react';
import { WorshipEvent, Team, Song, Member, EventType, ConfirmationStatus, EventSongItem } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { PresenceSelector } from './PresenceSelector';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Music, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Disc3, 
  UserPlus, 
  X,
  Sparkles,
  CheckCircle,
  Clock3,
  Crown,
  Folder,
  Mic,
  Layers,
  Heart,
  Droplets,
  BookOpen
} from 'lucide-react';
import { SongSelectModal } from './SongSelectModal';
import { MemberSelectModal } from './MemberSelectModal';
import { getYoutubeThumbnail } from '../../utils/youtube';
import { 
  getEventSongItems, 
  getEventBlocksOrder, 
  BLOCK_PRESETS, 
  COMMON_BLOCKS, 
  sortMembersWithVocalsFirst,
  resolveEventSong
} from '../../utils/worshipEvent';
import { CEIA_SUGGESTED_HYMNS, findHarpaHymnByNumber } from '../../utils/harpaCrista';

interface AddEventBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  songs: Song[];
  members: Member[];
  onSaveEvent: (event: Omit<WorshipEvent, 'id'> & { id?: string }) => void;
  eventToEdit?: WorshipEvent | null;
}

export const AddEventBottomSheet: React.FC<AddEventBottomSheetProps> = ({
  isOpen,
  onClose,
  teams,
  songs,
  members,
  onSaveEvent,
  eventToEdit
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('culto');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('18:00');
  const [location, setLocation] = useState('Templo Principal');
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.name || '');
  
  // Estrutura rica de repertório
  const [songItems, setSongItems] = useState<EventSongItem[]>([]);
  const [songBlocksOrder, setSongBlocksOrder] = useState<string[]>([]);
  const [targetBlockForAdd, setTargetBlockForAdd] = useState<string | null>(null);
  const [isAddingCustomBlock, setIsAddingCustomBlock] = useState(false);
  const [newBlockInput, setNewBlockInput] = useState('');

  // Estado para adicionar Hino da Harpa Cristã diretamente (ex: no bloco de Ceia)
  const [harpaBlockOpen, setHarpaBlockOpen] = useState<string | null>(null);
  const [harpaNumberInput, setHarpaNumberInput] = useState('');
  const [harpaTitleInput, setHarpaTitleInput] = useState('');
  const [harpaKeyInput, setHarpaKeyInput] = useState('');

  // Integrantes e Presença
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, ConfirmationStatus>>({});
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'repertoire' | 'team'>('info');

  // Modais de Seleção Avançada
  const [isSongSelectOpen, setIsSongSelectOpen] = useState(false);
  const [isMemberSelectOpen, setIsMemberSelectOpen] = useState(false);

  useEffect(() => {
    setActiveTab('info');
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setType(eventToEdit.type || 'culto');
      setDate(eventToEdit.date || today);
      setTime(eventToEdit.time || '18:00');
      setLocation(eventToEdit.location || 'Templo Principal');
      setSelectedTeam(eventToEdit.team || '');

      const items = getEventSongItems(eventToEdit);
      setSongItems(items);
      setSongBlocksOrder(getEventBlocksOrder(eventToEdit));

      const confirmedObj = eventToEdit.confirmed || {};
      const memberNames = Object.keys(confirmedObj);
      setSelectedMembers(memberNames);
      setMemberStatuses(confirmedObj);
      setNotes(eventToEdit.notes || '');
    } else {
      setTitle('');
      setType('culto');
      setDate(today);
      setTime('18:00');
      setLocation('Templo Principal');
      const firstTeam = teams[0]?.name || '';
      setSelectedTeam(firstTeam);
      setSongItems([]);
      setSongBlocksOrder([]);
      setNotes('');

      // Pré-carrega membros do primeiro time se houver
      if (firstTeam) {
        const teamObj = teams.find(t => t.name === firstTeam);
        if (teamObj) {
          setSelectedMembers([...teamObj.members]);
          const initialMap: Record<string, ConfirmationStatus> = {};
          teamObj.members.forEach(m => {
            initialMap[m] = 'pending';
          });
          setMemberStatuses(initialMap);
        } else {
          setSelectedMembers([]);
          setMemberStatuses({});
        }
      } else {
        setSelectedMembers([]);
        setMemberStatuses({});
      }
    }
  }, [eventToEdit, isOpen, teams]);

  // Ao trocar o time selecionado no dropdown, oferece atualização de membros
  const handleTeamChange = (teamName: string) => {
    setSelectedTeam(teamName);
    if (!teamName) return;

    const teamObj = teams.find(t => t.name === teamName);
    if (teamObj) {
      const newMembers = Array.from(new Set([...selectedMembers, ...teamObj.members]));
      setSelectedMembers(newMembers);
      setMemberStatuses(prev => {
        const updated = { ...prev };
        teamObj.members.forEach(m => {
          if (!updated[m]) updated[m] = 'pending';
        });
        return updated;
      });
    }
  };

  const handleApplyTeamTemplate = (teamName: string) => {
    setSelectedTeam(teamName);
    const teamObj = teams.find(t => t.name === teamName);
    if (teamObj) {
      setSelectedMembers([...teamObj.members]);
      const initialMap: Record<string, ConfirmationStatus> = {};
      teamObj.members.forEach(m => {
        initialMap[m] = memberStatuses[m] || 'pending';
      });
      setMemberStatuses(initialMap);
    }
  };

  // Aplica preset de blocos (ex: Abertura + Ceia, Abertura + Batismo + Ceia)
  const handleApplyPreset = (blocks: string[]) => {
    setSongBlocksOrder(blocks);
    if (songItems.length > 0) {
      setSongItems(prev => prev.map(item => ({
        ...item,
        block: item.block && blocks.includes(item.block) ? item.block : blocks[0]
      })));
    }
  };

  const handleClearBlocks = () => {
    setSongBlocksOrder([]);
    setSongItems(prev => prev.map(item => ({ ...item, block: '' })));
  };

  const handleAddCustomBlock = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!songBlocksOrder.includes(trimmed)) {
      setSongBlocksOrder(prev => [...prev, trimmed]);
    }
    setIsAddingCustomBlock(false);
    setNewBlockInput('');
  };

  const handleRemoveBlock = (blockName: string) => {
    setSongBlocksOrder(prev => prev.filter(b => b !== blockName));
    setSongItems(prev => prev.map(item => item.block === blockName ? { ...item, block: '' } : item));
  };

  // Manipulação de Músicas
  const handleOpenSongSelect = (blockName?: string) => {
    setTargetBlockForAdd(blockName || null);
    setIsSongSelectOpen(true);
  };

  const handleHarpaNumberChange = (val: string) => {
    setHarpaNumberInput(val);
    const match = findHarpaHymnByNumber(val);
    if (match) {
      setHarpaTitleInput(match.title);
    }
  };

  const handleAddHarpaHymn = (blockName: string, numberStr: string, titleStr: string, keyStr = '') => {
    const cleanNum = numberStr.trim();
    const cleanTitle = titleStr.trim();
    if (!cleanNum && !cleanTitle) return;

    const newHarpaItem: EventSongItem = {
      songId: `harpa_${cleanNum || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      block: blockName,
      isHarpa: true,
      harpaNumber: cleanNum,
      harpaTitle: cleanTitle || `Hino ${cleanNum}`,
      harpaKey: keyStr.trim() || undefined,
      ministers: [],
      ministerName: '',
      ministerAction: 'canta'
    };

    setSongItems(prev => [...prev, newHarpaItem]);
    setHarpaNumberInput('');
    setHarpaTitleInput('');
    setHarpaKeyInput('');
  };

  const handleConfirmSongs = (selectedIds: string[]) => {
    if (targetBlockForAdd) {
      // Músicas mantidas que pertencem a outros blocos
      const otherBlockItems = songItems.filter(i => (i.block || '') !== targetBlockForAdd);

      // Músicas atuais deste bloco
      const currentBlockItems = songItems.filter(i => (i.block || '') === targetBlockForAdd);
      // Preserva hinos da Harpa Cristã já adicionados neste bloco
      const currentBlockHarpaItems = currentBlockItems.filter(i => i.isHarpa || i.harpaTitle);

      // Reconstrói itens do catálogo deste bloco preservando ministrantes se já existiam
      const newBlockItems: EventSongItem[] = selectedIds.map(id => {
        const existing = currentBlockItems.find(i => i.songId === id) || songItems.find(i => i.songId === id);
        return {
          songId: id,
          block: targetBlockForAdd,
          ministers: existing?.ministers || (existing?.ministerName ? [{ name: existing.ministerName, action: existing.ministerAction || 'canta' }] : []),
          ministerName: existing?.ministerName || '',
          ministerAction: existing?.ministerAction || 'canta'
        };
      });

      setSongItems([...otherBlockItems, ...currentBlockHarpaItems, ...newBlockItems]);
    } else {
      // Modo geral (preserva hinos da Harpa já adicionados)
      const existingHarpaItems = songItems.filter(i => i.isHarpa || i.harpaTitle);
      const newItems: EventSongItem[] = selectedIds.map(id => {
        const existing = songItems.find(i => i.songId === id);
        return {
          songId: id,
          block: existing?.block || (songBlocksOrder[0] || ''),
          ministers: existing?.ministers || (existing?.ministerName ? [{ name: existing.ministerName, action: existing.ministerAction || 'canta' }] : []),
          ministerName: existing?.ministerName || '',
          ministerAction: existing?.ministerAction || 'canta'
        };
      });
      setSongItems([...existingHarpaItems, ...newItems]);
    }
    setTargetBlockForAdd(null);
  };

  const moveSongUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...songItems];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setSongItems(newItems);
  };

  const moveSongDown = (index: number) => {
    if (index === songItems.length - 1) return;
    const newItems = [...songItems];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setSongItems(newItems);
  };

  const removeSongByIndex = (index: number) => {
    setSongItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleChangeSongBlock = (index: number, newBlock: string) => {
    setSongItems(prev => prev.map((item, idx) => idx === index ? { ...item, block: newBlock } : item));
  };

  // Funções de Manipulação dos Integrantes & Confirmação de Presença
  const handleMemberStatusChange = (memberName: string, newStatus: ConfirmationStatus) => {
    setMemberStatuses(prev => ({
      ...prev,
      [memberName]: newStatus
    }));
  };

  const handleSetAllStatuses = (status: ConfirmationStatus) => {
    setMemberStatuses(prev => {
      const updated: Record<string, ConfirmationStatus> = {};
      selectedMembers.forEach(m => {
        updated[m] = status;
      });
      return updated;
    });
  };

  const removeMember = (memberName: string) => {
    setSelectedMembers(prev => prev.filter(m => m !== memberName));
    setMemberStatuses(prev => {
      const copy = { ...prev };
      delete copy[memberName];
      return copy;
    });
  };

  const handleConfirmMembers = (newMemberNames: string[]) => {
    setSelectedMembers(newMemberNames);
    setMemberStatuses(prev => {
      const updated: Record<string, ConfirmationStatus> = {};
      newMemberNames.forEach(name => {
        updated[name] = prev[name] || 'pending';
      });
      return updated;
    });
  };

  // Seleção Inteligente de Tipo de Evento
  const handleTypeSelect = (newType: EventType) => {
    setType(newType);
    if (songBlocksOrder.length === 0) {
      if (newType === 'ceia') {
        handleApplyPreset(['Abertura', 'Ceia']);
      } else if (newType === 'batismo') {
        handleApplyPreset(['Abertura', 'Batismo']);
      } else if (newType === 'especial') {
        handleApplyPreset(['Abertura', 'Batismo', 'Ceia']);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    // Monta o mapa de confirmações
    const finalConfirmed: Record<string, ConfirmationStatus> = {};
    selectedMembers.forEach(m => {
      finalConfirmed[m] = memberStatuses[m] || 'pending';
    });

    const finalSongIds = songItems.map(i => i.songId);

    onSaveEvent({
      ...(eventToEdit?.id ? { id: eventToEdit.id } : {}),
      title: title.trim(),
      type,
      date,
      time,
      location: location.trim(),
      team: selectedTeam || 'Escala Avulsa',
      confirmed: finalConfirmed,
      songIds: finalSongIds,
      songItems: songItems,
      songBlocksOrder: songBlocksOrder,
      notes: notes.trim()
    });

    onClose();
  };

  const isEditing = Boolean(eventToEdit);

  // Lista de membros ordenada com vocais no topo para seleção de quem canta/ministra
  const scheduledMemberObjs = members.filter(m => selectedMembers.includes(m.name));
  const selectableList = scheduledMemberObjs.length > 0 ? scheduledMemberObjs : members;
  const sortedSelectable = sortMembersWithVocalsFirst(selectableList);

  // Renderizador de cada card de música (suporta músicas do catálogo e Hinos da Harpa Cristã)
  const renderSongCard = (item: EventSongItem, globalIdx: number, displayIdx: number) => {
    const song = resolveEventSong(item, songs);
    if (!song) return null;
    const isHarpaItem = Boolean(item.isHarpa || item.harpaTitle);
    const thumb = !isHarpaItem && song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

    return (
      <div
        key={`${song.id}-${globalIdx}`}
        className={`bg-slate-900 border rounded-xl p-2.5 space-y-2 shadow-sm ${
          isHarpaItem ? 'border-amber-500/35 bg-amber-950/10' : 'border-slate-800/90'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`w-5 h-5 rounded-md font-black text-[11px] flex items-center justify-center flex-shrink-0 ${
                isHarpaItem
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-600/20 text-blue-400'
              }`}
            >
              {displayIdx}º
            </span>

            {thumb ? (
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
              </div>
            ) : isHarpaItem ? (
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <BookOpen size={15} />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Disc3 size={15} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isHarpaItem && item.harpaNumber && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0">
                    Nº {item.harpaNumber}
                  </span>
                )}
                <p className="text-xs font-bold text-slate-100 truncate">
                  {isHarpaItem ? (item.harpaTitle || song.title) : song.title}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isHarpaItem ? '📖 Harpa Cristã (Sem link obrigatório)' : song.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {song.key && (
              <Badge variant="blue" size="sm" className="font-bold text-[10px]">
                {song.key}
              </Badge>
            )}

            {/* Reordenar Músicas */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={globalIdx === 0}
                onClick={() => moveSongUp(globalIdx)}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400"
                title="Mover para cima"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                disabled={globalIdx === songItems.length - 1}
                onClick={() => moveSongDown(globalIdx)}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400"
                title="Mover para baixo"
              >
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Remover Música */}
            <button
              type="button"
              onClick={() => removeSongByIndex(globalIdx)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-0.5"
              title="Remover música do setlist"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Atribuição de Momento / Bloco (quando modelos de momentos estão ativos) */}
        {songBlocksOrder.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers size={11} className="text-blue-400" />
              Momento:
            </span>

            <div className="flex items-center gap-1 flex-wrap">
              {songBlocksOrder.map(b => {
                const isSelected = (item.block || '').trim().toLowerCase() === b.toLowerCase();
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleChangeSongBlock(globalIdx, b)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={`Mover para ${b}`}
                  >
                    {b}
                  </button>
                );
              })}

              {item.block && (
                <button
                  type="button"
                  onClick={() => handleChangeSongBlock(globalIdx, '')}
                  className="px-1.5 py-0.5 rounded-lg text-[10px] text-slate-500 hover:text-rose-400"
                  title="Tirar deste momento"
                >
                  Sem momento
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Editar Evento / Escala" : "Criar Novo Evento de Louvor"}
        subtitle={isEditing ? "Atualize dados, presença dos integrantes e repertório" : "Defina data, time de louvor e setlist do culto"}
        maxHeight="max-h-[92vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Navegação por Abas no Criar/Editar estilo Segmented Control iOS */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800/80 sticky top-0 z-10 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Calendar size={13} className="shrink-0" />
              <span className="truncate">Info</span>
            </button>

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
                {songItems.length}
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
              <span className="truncate">Equipe</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {selectedMembers.length}
              </span>
            </button>
          </div>

          {/* ABA 1: INFORMAÇÕES DO EVENTO */}
          {activeTab === 'info' && (
            <div className="space-y-3 pt-1">
              {/* Título do Evento */}
              <Input
                label="Título do Culto / Evento"
                placeholder="Ex: Culto de Celebração de Domingo"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />

              {/* Tipo de Evento */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'culto', label: 'Culto', activeClass: 'bg-blue-600 text-white shadow-md border-blue-500/30' },
                    { id: 'ensaio', label: 'Ensaio', activeClass: 'bg-amber-600 text-white shadow-md border-amber-500/30' },
                    { id: 'congresso', label: 'Congresso', activeClass: 'bg-purple-600 text-white shadow-md border-purple-500/30' },
                    { id: 'jovens', label: 'Jovens', activeClass: 'bg-emerald-600 text-white shadow-md border-emerald-500/30' },
                    { id: 'ceia', label: 'Santa Ceia', activeClass: 'bg-rose-600 text-white shadow-md border-rose-500/30' },
                    { id: 'batismo', label: 'Batismo', activeClass: 'bg-cyan-600 text-white shadow-md border-cyan-500/30' },
                    { id: 'especial', label: 'Especial', activeClass: 'bg-yellow-600 text-white shadow-md border-yellow-500/30' },
                    { id: 'outro', label: 'Outro', activeClass: 'bg-slate-700 text-white shadow-md border-slate-600/30' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeSelect(t.id as EventType)}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        type === t.id
                          ? `${t.activeClass} border`
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="Data"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  icon={<Calendar size={15} />}
                />
                <Input
                  label="Horário"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  icon={<Clock size={15} />}
                />
              </div>

              <Input
                label="Local / Auditório"
                placeholder="Ex: Templo Principal"
                value={location}
                onChange={e => setLocation(e.target.value)}
                icon={<MapPin size={15} />}
              />

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Observações e Avisos para a Equipe
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Chegar com 1h de antecedência para passagem de som..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('repertoire')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>Próximo: Adicionar Músicas</span>
                  <Music size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: REPERTÓRIO & MOMENTOS */}
          {activeTab === 'repertoire' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Music size={15} className="text-blue-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Repertório do Culto
                  </label>
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {songItems.length} {songItems.length === 1 ? 'música' : 'músicas'}
                  </span>
                </div>

              <button
                type="button"
                onClick={() => handleOpenSongSelect()}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>{songItems.length === 0 ? 'Adicionar Músicas' : 'Catálogo Completo'}</span>
              </button>
            </div>

            {/* BARRA DE MODELOS DE CULTO ESPECIAL (ABERTURA, CEIA, BATISMO) */}
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  Modelos de Momentos (Culto Especial):
                </span>
                {songBlocksOrder.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBlocks}
                    className="text-[10px] font-medium text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    Desativar blocos
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Abertura', 'Ceia'])}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
                    songBlocksOrder.join(',') === 'Abertura,Ceia'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <Heart size={11} className="text-rose-400" />
                  <span>Abertura + Ceia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Abertura', 'Batismo', 'Ceia'])}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
                    songBlocksOrder.join(',') === 'Abertura,Batismo,Ceia'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                  }`}
                >
                  <Crown size={11} className="text-purple-400" />
                  <span>Abertura + Batismo + Ceia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Abertura', 'Batismo'])}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
                    songBlocksOrder.join(',') === 'Abertura,Batismo'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}
                >
                  <Droplets size={11} className="text-cyan-400" />
                  <span>Abertura + Batismo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingCustomBlock(true)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Outro Bloco</span>
                </button>
              </div>

              {/* Form Inline para Novo Bloco Customizado */}
              {isAddingCustomBlock && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newBlockInput}
                    onChange={e => setNewBlockInput(e.target.value)}
                    placeholder="Ex: Ministração, Oferta..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomBlock(newBlockInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomBlock(newBlockInput)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomBlock(false);
                      setNewBlockInput('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* LISTAGEM DE REPERTÓRIO: POR BLOCOS OU SIMPLES */}
            {songBlocksOrder.length > 0 ? (
              /* MODO POR BLOCOS (ABERTURA, BATISMO, CEIA...) */
              <div className="space-y-3">
                {songBlocksOrder.map(blockName => {
                  const blockItemsWithGlobalIdx = songItems
                    .map((item, idx) => ({ item, globalIdx: idx }))
                    .filter(({ item }) => (item.block || '').trim().toLowerCase() === blockName.toLowerCase());

                  const isCeiaBlock = blockName.toLowerCase().includes('ceia');
                  const isHarpaOpen = harpaBlockOpen === blockName;

                  return (
                    <div
                      key={blockName}
                      className={`bg-slate-950/90 border rounded-2xl p-2.5 space-y-2.5 shadow-sm ${
                        isCeiaBlock ? 'border-rose-500/35' : 'border-slate-800/90'
                      }`}
                    >
                      {/* Cabeçalho do Bloco */}
                      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-800/60 flex-wrap gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Layers size={13} className={isCeiaBlock ? 'text-rose-400' : 'text-blue-400'} />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                            {blockName}
                          </span>
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.2 rounded-full border border-blue-500/20">
                            {blockItemsWithGlobalIdx.length} {blockItemsWithGlobalIdx.length === 1 ? 'música' : 'músicas'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Botão Harpa Cristã exclusivo/destacado no agrupamento de Ceia */}
                          {isCeiaBlock && (
                            <button
                              type="button"
                              onClick={() =>
                                setHarpaBlockOpen(isHarpaOpen ? null : blockName)
                              }
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                                isHarpaOpen
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                              }`}
                              title="Adicionar hino da Harpa Cristã (Número e Nome, sem link obrigatório)"
                            >
                              <BookOpen size={12} />
                              <span>+ Harpa Cristã</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenSongSelect(blockName)}
                            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/25 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                            title={`Adicionar músicas do catálogo no bloco ${blockName}`}
                          >
                            <Plus size={12} />
                            <span>+ Catálogo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(blockName)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remover este bloco"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Painel Rápido para Adicionar Hinos da Harpa Cristã na Ceia */}
                      {isCeiaBlock && isHarpaOpen && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                              <BookOpen size={13} />
                              Adicionar Hino da Harpa Cristã (Sem link obrigatório)
                            </span>
                            <button
                              type="button"
                              onClick={() => setHarpaBlockOpen(null)}
                              className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>

                          {/* Sugestões Rápidas de Hinos de Santa Ceia (1 toque) */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400">
                              Toque rápido para adicionar hinos clássicos de Ceia:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {CEIA_SUGGESTED_HYMNS.map(hymn => {
                                const alreadyAdded = blockItemsWithGlobalIdx.some(
                                  ({ item }) => item.isHarpa && item.harpaNumber === hymn.number
                                );
                                return (
                                  <button
                                    key={hymn.number}
                                    type="button"
                                    disabled={alreadyAdded}
                                    onClick={() =>
                                      handleAddHarpaHymn(blockName, hymn.number, hymn.title)
                                    }
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
                                      alreadyAdded
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 opacity-70 cursor-default'
                                        : 'bg-slate-900/90 hover:bg-amber-500/20 text-amber-200 border-amber-500/30'
                                    }`}
                                  >
                                    {alreadyAdded ? '✓ ' : '+ '}Nº {hymn.number} - {hymn.title}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Campos para Digitar Qualquer Número e Nome da Harpa */}
                          <div className="grid grid-cols-12 gap-1.5 pt-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Nº (ex: 301)"
                              value={harpaNumberInput}
                              onChange={e => handleHarpaNumberChange(e.target.value)}
                              className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="Nome do hino (ex: Vem Cear)"
                              value={harpaTitleInput}
                              onChange={e => setHarpaTitleInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddHarpaHymn(
                                    blockName,
                                    harpaNumberInput,
                                    harpaTitleInput,
                                    harpaKeyInput
                                  );
                                }
                              }}
                              className="col-span-6 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="Tom (opc)"
                              value={harpaKeyInput}
                              onChange={e => setHarpaKeyInput(e.target.value)}
                              className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={!harpaNumberInput.trim() && !harpaTitleInput.trim()}
                              onClick={() =>
                                handleAddHarpaHymn(
                                  blockName,
                                  harpaNumberInput,
                                  harpaTitleInput,
                                  harpaKeyInput
                                )
                              }
                              className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
                            >
                              + Incluir Hino na Ceia
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Músicas deste bloco */}
                      {blockItemsWithGlobalIdx.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-slate-800/80 rounded-xl space-y-2">
                          <p className="text-[11px] text-slate-400 italic">
                            Nenhuma música em <span className="font-bold text-slate-300">{blockName}</span>.
                          </p>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {isCeiaBlock && !isHarpaOpen && (
                              <button
                                type="button"
                                onClick={() => setHarpaBlockOpen(blockName)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                <BookOpen size={12} />
                                <span>Adicionar da Harpa Cristã</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenSongSelect(blockName)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Escolher do Catálogo</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {blockItemsWithGlobalIdx.map(({ item, globalIdx }, localIdx) =>
                            renderSongCard(item, globalIdx, localIdx + 1)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Louvores sem Bloco Atribuído */}
                {(() => {
                  const unassignedItems = songItems
                    .map((item, idx) => ({ item, globalIdx: idx }))
                    .filter(({ item }) => !item.block?.trim() || !songBlocksOrder.includes(item.block));

                  if (unassignedItems.length === 0) return null;

                  return (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between pb-1 px-1 border-b border-slate-800/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Músicas sem Bloco ({unassignedItems.length})
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {unassignedItems.map(({ item, globalIdx }, localIdx) =>
                          renderSongCard(item, globalIdx, localIdx + 1)
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : songItems.length === 0 ? (
              <div
                onClick={() => handleOpenSongSelect()}
                className="bg-slate-950/70 border border-dashed border-slate-800 hover:border-blue-500/40 p-4 rounded-2xl text-center space-y-2 cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Music size={20} />
                </div>
                <p className="text-xs font-bold text-slate-200">Nenhuma música adicionada ainda</p>
                <p className="text-[11px] text-slate-400">Toque aqui para escolher as músicas do culto ou selecione um modelo de momentos acima.</p>
              </div>
            ) : (
              /* MODO SIMPLES (LISTA PADRÃO) */
              <div className="space-y-1.5 bg-slate-950/70 border border-slate-800/80 p-2 rounded-2xl max-h-72 overflow-y-auto overscroll-contain">
                {songItems.map((item, idx) => renderSongCard(item, idx, idx + 1))}
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>Próximo: Escalar Equipe</span>
                <Users size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ABA 3: EQUIPE & INTEGRANTES ESCALADOS COM CONTROLE DE PRESENÇA */}
        {activeTab === 'team' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={15} className="text-blue-400" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Integrantes da Escala
                </label>
                <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {selectedMembers.length} {selectedMembers.length === 1 ? 'membro' : 'membros'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMemberSelectOpen(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
              >
                <UserPlus size={14} />
                <span>{selectedMembers.length === 0 ? 'Adicionar Integrantes' : 'Ajustar Escala'}</span>
              </button>
            </div>

            {/* Seletor Rápido de Equipe Base & Ações Rápidas de Presença */}
            <div className="space-y-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              {teams.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">Equipe:</span>
                  <select
                    value={selectedTeam}
                    onChange={e => handleTeamChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500 flex-1"
                  >
                    <option value="">Escala Avulsa / Personalizada</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.members.length} integrantes)
                      </option>
                    ))}
                  </select>
                  {selectedTeam && (
                    <button
                      type="button"
                      onClick={() => handleApplyTeamTemplate(selectedTeam)}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-600/20 px-2 py-1 rounded-lg border border-blue-500/30 whitespace-nowrap"
                      title="Recarregar exatamente os membros deste time"
                    >
                      Recarregar
                    </button>
                  )}
                </div>
              )}

              {/* Botões Rápidos de Status em Lote */}
              {selectedMembers.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-medium">Ajuste rápido de todos:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetAllStatuses('accepted')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold active:scale-95 transition-all"
                    >
                      <CheckCircle size={12} />
                      <span>Todos Confirmados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllStatuses('pending')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 font-bold active:scale-95 transition-all"
                    >
                      <Clock3 size={12} />
                      <span>Todos Pendentes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedMembers.length === 0 ? (
              <div
                onClick={() => setIsMemberSelectOpen(true)}
                className="bg-slate-950/70 border border-dashed border-slate-800 hover:border-blue-500/40 p-4 rounded-2xl text-center space-y-2 cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <p className="text-xs font-bold text-slate-200">Nenhum integrante escalado ainda</p>
                <p className="text-[11px] text-slate-400">Toque aqui para escolher os músicos, vocais e ministros deste evento.</p>
              </div>
            ) : (
              <div className="space-y-2 bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-2xl max-h-64 overflow-y-auto overscroll-contain">
                {selectedMembers.map(memberName => {
                  const memberObj = members.find(m => m.name === memberName);
                  const memberStatus = memberStatuses[memberName] || 'pending';
                  const initials = memberName
                    .split(' ')
                    .slice(0, 2)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase();

                  const isLeader = memberObj && (
                    memberObj.role?.toLowerCase().includes('lider') ||
                    (memberObj.roles && memberObj.roles.some(r => r.toLowerCase().includes('lider')))
                  );

                  return (
                    <div
                      key={memberName}
                      className="bg-slate-900 border border-slate-800/90 rounded-2xl p-2.5 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 border ${
                            isLeader
                              ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-blue-400'
                          }`}>
                            {initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-100 truncate">{memberName}</p>
                              {isLeader && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                                  <Crown size={9} /> Líder
                                </span>
                              )}
                            </div>
                            {memberObj && (
                              <p className="text-[10px] text-slate-400 truncate">{memberObj.role}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMember(memberName)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                          title="Remover integrante da escala"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Controle Individual de Presença por Integrante */}
                      <PresenceSelector
                        status={memberStatus}
                        onChange={(newStatus) => handleMemberStatusChange(memberName, newStatus)}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rodapé Fixo com Botões de Ação */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {isEditing ? "Salvar Alterações" : "Criar Evento"}
          </Button>
        </div>
        </form>
      </BottomSheet>

      {/* Modal Dedicado para Seleção de Repertório */}
      <SongSelectModal
        isOpen={isSongSelectOpen}
        onClose={() => {
          setIsSongSelectOpen(false);
          setTargetBlockForAdd(null);
        }}
        songs={songs}
        selectedSongIds={
          targetBlockForAdd
            ? songItems.filter(i => (i.block || '').trim().toLowerCase() === targetBlockForAdd.toLowerCase()).map(i => i.songId)
            : songItems.map(i => i.songId)
        }
        onConfirm={handleConfirmSongs}
        title={targetBlockForAdd ? `Selecionar Músicas para ${targetBlockForAdd}` : 'Selecionar Músicas do Culto'}
        subtitle={targetBlockForAdd ? `Escolha as canções que serão executadas no momento de ${targetBlockForAdd}` : 'Escolha músicas individualmente ou associe grupos completos de repertório'}
      />

      {/* Modal Dedicado para Seleção de Integrantes */}
      <MemberSelectModal
        isOpen={isMemberSelectOpen}
        onClose={() => setIsMemberSelectOpen(false)}
        members={members}
        selectedMemberNames={selectedMembers}
        onConfirm={handleConfirmMembers}
        title="Integrantes do Culto"
        subtitle="Selecione quem estará presente no palco e na equipe deste dia"
      />
    </>
  );
};

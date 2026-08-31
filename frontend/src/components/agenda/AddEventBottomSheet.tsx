import React, { useState, useEffect } from 'react';
import { WorshipEvent, Team, Song, Member, EventType, ConfirmationStatus } from '../../types';
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
  Crown
} from 'lucide-react';
import { SongSelectModal } from './SongSelectModal';
import { MemberSelectModal } from './MemberSelectModal';
import { getYoutubeThumbnail } from '../../utils/youtube';

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
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, ConfirmationStatus>>({});
  const [notes, setNotes] = useState('');

  // Modais de Seleção Avançada
  const [isSongSelectOpen, setIsSongSelectOpen] = useState(false);
  const [isMemberSelectOpen, setIsMemberSelectOpen] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setType(eventToEdit.type || 'culto');
      setDate(eventToEdit.date || today);
      setTime(eventToEdit.time || '18:00');
      setLocation(eventToEdit.location || 'Templo Principal');
      setSelectedTeam(eventToEdit.team || '');
      setSelectedSongs(eventToEdit.songIds || []);
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
      setSelectedSongs([]);
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

  // Funções de Manipulação do Repertório
  const moveSongUp = (index: number) => {
    if (index === 0) return;
    const newSongs = [...selectedSongs];
    const temp = newSongs[index - 1];
    newSongs[index - 1] = newSongs[index];
    newSongs[index] = temp;
    setSelectedSongs(newSongs);
  };

  const moveSongDown = (index: number) => {
    if (index === selectedSongs.length - 1) return;
    const newSongs = [...selectedSongs];
    const temp = newSongs[index + 1];
    newSongs[index + 1] = newSongs[index];
    newSongs[index] = temp;
    setSelectedSongs(newSongs);
  };

  const removeSong = (songId: string) => {
    setSelectedSongs(prev => prev.filter(id => id !== songId));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    // Monta o mapa de confirmações
    const finalConfirmed: Record<string, ConfirmationStatus> = {};
    selectedMembers.forEach(m => {
      finalConfirmed[m] = memberStatuses[m] || 'pending';
    });

    onSaveEvent({
      ...(eventToEdit?.id ? { id: eventToEdit.id } : {}),
      title: title.trim(),
      type,
      date,
      time,
      location: location.trim(),
      team: selectedTeam || 'Escala Avulsa',
      confirmed: finalConfirmed,
      songIds: selectedSongs,
      notes: notes.trim()
    });

    onClose();
  };

  const isEditing = Boolean(eventToEdit);
  const selectedSongObjects = selectedSongs
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean) as Song[];

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Editar Evento / Escala" : "Criar Novo Evento de Louvor"}
        subtitle={isEditing ? "Atualize dados, presença dos integrantes e repertório" : "Defina data, time de louvor e setlist do culto"}
        maxHeight="max-h-[92vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
            <div className="grid grid-cols-3 gap-1.5">
              {(['culto', 'ensaio', 'jovens', 'ceia', 'especial', 'outro'] as EventType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                    type === t
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 border border-blue-500/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {t}
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

          {/* SEÇÃO 1: REPERTÓRIO DO CULTO (AMPLA & MODERNA) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music size={15} className="text-blue-400" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Repertório do Culto
                </label>
                <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {selectedSongs.length} {selectedSongs.length === 1 ? 'música' : 'músicas'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSongSelectOpen(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>{selectedSongs.length === 0 ? 'Adicionar Músicas' : 'Escolher Músicas'}</span>
              </button>
            </div>

            {selectedSongObjects.length === 0 ? (
              <div
                onClick={() => setIsSongSelectOpen(true)}
                className="bg-slate-950/70 border border-dashed border-slate-800 hover:border-blue-500/40 p-4 rounded-2xl text-center space-y-2 cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Music size={20} />
                </div>
                <p className="text-xs font-bold text-slate-200">Nenhuma música adicionada ainda</p>
                <p className="text-[11px] text-slate-400">Toque aqui para abrir o catálogo e selecionar as músicas do culto.</p>
              </div>
            ) : (
              <div className="space-y-1.5 bg-slate-950/70 border border-slate-800/80 p-2 rounded-2xl max-h-56 overflow-y-auto overscroll-contain">
                {selectedSongObjects.map((song, idx) => {
                  const thumb = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;
                  return (
                    <div
                      key={song.id}
                      className="bg-slate-900 border border-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 font-black text-[11px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}º
                        </span>

                        {thumb ? (
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                            <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <Disc3 size={15} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-100 truncate">{song.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant="blue" size="sm" className="font-bold text-[10px]">
                          {song.key}
                        </Badge>

                        {/* Reordenar Músicas */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSongUp(idx)}
                            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400"
                            title="Mover para cima"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedSongObjects.length - 1}
                            onClick={() => moveSongDown(idx)}
                            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400"
                            title="Mover para baixo"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Remover Música */}
                        <button
                          type="button"
                          onClick={() => removeSong(song.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-0.5"
                          title="Remover música do setlist"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: EQUIPE & INTEGRANTES ESCALADOS COM CONTROLE DE PRESENÇA (AMPLA & MODERNA) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={15} className="text-blue-400" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Integrantes & Presença
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

          {/* Observações */}
          <div className="pt-1">
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

          {/* Ações */}
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
        onClose={() => setIsSongSelectOpen(false)}
        songs={songs}
        selectedSongIds={selectedSongs}
        onConfirm={setSelectedSongs}
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

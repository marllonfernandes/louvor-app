import React, { useState } from 'react';
import { Plus, Search, Disc3, Sparkles, Heart, Crown, Filter, CheckCircle2, Folder, FolderPlus, FolderX, Pencil, Trash2, Layers } from 'lucide-react';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { Song, AdoptionSong, Member } from '../../types';
import { SongCard } from './SongCard';
import { SongDetailModal } from './SongDetailModal';
import { AddSongBottomSheet } from './AddSongBottomSheet';
import { AdoptionSongCard } from './AdoptionSongCard';
import { AddAdoptionSongModal } from './AddAdoptionSongModal';
import { ApproveAdoptionModal } from './ApproveAdoptionModal';
import { ImportPlaylistModal } from './ImportPlaylistModal';
import { DeleteGroupModal } from './DeleteGroupModal';
import { CreateGroupModal } from './CreateGroupModal';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface PlaylistViewProps {
  songs: Song[];
  adoptionSongs: AdoptionSong[];
  members: Member[];
  onSaveSong: (song: Omit<Song, 'id'> & { id?: string }) => void;
  onSaveBatchSongs: (songs: Omit<Song, 'id'>[]) => void;
  onDeleteSong: (songId: string) => void;
  onSaveAdoptionSong: (song: Omit<AdoptionSong, 'id'>) => void;
  onVoteAdoptionSong: (songId: string, voterName: string) => void;
  onApproveAdoptionSong: (adoptionSongId: string, approvedSongData: Omit<Song, 'id'>, leaderName: string) => void;
  onRejectAdoptionSong: (songId: string) => void;
  onDeleteAdoptionSong: (songId: string) => void;
  onDeleteGroup?: (groupName: string, deleteSongsToo: boolean) => void;
  onSaveGroup?: (groupName: string, selectedSongIds: string[]) => void;
  selectedSongFromEvent?: Song | null;
  onClearSelectedSong?: () => void;
  onOpenStageSong?: (song: Song) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  songs,
  adoptionSongs,
  members,
  onSaveSong,
  onSaveBatchSongs,
  onDeleteSong,
  onSaveAdoptionSong,
  onVoteAdoptionSong,
  onApproveAdoptionSong,
  onRejectAdoptionSong,
  onDeleteAdoptionSong,
  onDeleteGroup,
  onSaveGroup,
  selectedSongFromEvent,
  onClearSelectedSong,
  onOpenStageSong
}) => {
  const [subTab, setSubTab] = useState<'repertoire' | 'adoption'>('repertoire');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [adoptionFilter, setAdoptionFilter] = useState<'all' | 'voting' | 'approved' | 'rejected'>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const { userProfile } = useAuth();
  
  // Identificação do Usuário / Votante Atual
  const currentVoterName = userProfile?.name || 'Membro do Ministério';
  const isCurrentUserLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  // Modais
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isImportPlaylistOpen, setIsImportPlaylistOpen] = useState(false);
  const [isAddAdoptionOpen, setIsAddAdoptionOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ name: string; count: number } | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(selectedSongFromEvent || null);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [adoptionToApprove, setAdoptionToApprove] = useState<AdoptionSong | null>(null);

  // Lista dinâmica de Grupos do Repertório
  const availableGroups = Array.from(
    new Set(songs.map(s => s.group?.trim()).filter(Boolean))
  ).sort() as string[];

  const ungroupedCount = songs.filter(s => !s.group?.trim()).length;

  // Lista de Líderes
  const leaders = members.filter(m => {
    const r = [m.role, ...(m.roles || [])].join(' ').toLowerCase();
    return r.includes('líder') || r.includes('lider');
  });

  // Filtros do Repertório Principal
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.group && song.group.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    const matchesKey = selectedKey === 'all' || song.key === selectedKey;
    const matchesGroup = selectedGroup === 'all'
      ? true
      : selectedGroup === 'ungrouped'
      ? !song.group?.trim()
      : song.group?.trim() === selectedGroup;
    return matchesSearch && matchesCategory && matchesKey && matchesGroup;
  });

  // Filtros e Ordenação das Músicas para Adoção (mais votadas primeiro)
  const filteredAdoptionSongs = adoptionSongs
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.suggestedByMemberName && song.suggestedByMemberName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = adoptionFilter === 'all' || song.status === adoptionFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Músicas em votação com mais votos primeiro
      if (a.status === 'voting' && b.status === 'voting') {
        return b.votes.length - a.votes.length;
      }
      if (a.status === 'voting') return -1;
      if (b.status === 'voting') return 1;
      return b.createdAt - a.createdAt;
    });

  const votingCount = adoptionSongs.filter(s => s.status === 'voting').length;

  const isCustomCategoryActive = selectedCategory !== 'all' && !['Adoração', 'Celebração'].includes(selectedCategory);
  const isKeyActive = selectedKey !== 'all';
  const isGroupActive = selectedGroup !== 'all';
  const activeExtraFiltersCount = (isCustomCategoryActive ? 1 : 0) + (isKeyActive ? 1 : 0) + (isGroupActive ? 1 : 0);

  return (
    <div className="space-y-3.5 text-left">
      {/* Topo com Ações Contextuais */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-headline-lg-mobile text-on-surface tracking-tight truncate font-bold">
            {subTab === 'repertoire' ? 'Biblioteca' : 'Adoção de Louvores'}
          </h2>
          <span className="bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full font-label-md text-label-md font-bold">
            {subTab === 'repertoire' ? songs.length : adoptionSongs.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {subTab === 'repertoire' ? (
            <>
              {isCurrentUserLeader && (
                <button
                  type="button"
                  onClick={() => setIsImportPlaylistOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all text-xs font-bold border border-rose-500/30 shadow-sm"
                  title="Importar playlist completa do YouTube"
                >
                  <YoutubeIcon size={15} />
                  <span className="hidden sm:inline">Importar</span> Playlist
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isCurrentUserLeader) {
                    setSongToEdit(null);
                    setIsAddSongOpen(true);
                  } else {
                    setIsAddAdoptionOpen(true);
                  }
                }}
                className="bg-primary-container hover:bg-primary-container/90 active:scale-95 text-on-primary-container px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md font-label-lg text-label-lg font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Nova Música</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddAdoptionOpen(true)}
              className="bg-primary-container hover:bg-primary-container/90 active:scale-95 text-on-primary-container px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md font-label-lg text-label-lg font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Sugerir Música</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Mode Switcher (Sleek & Compact) */}
      <div className="flex p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-inner">
        <button
          type="button"
          onClick={() => setSubTab('repertoire')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'repertoire'
              ? 'bg-primary-container text-on-primary-container shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Disc3 size={15} />
          <span>Repertório Ativo ({songs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('adoption')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'adoption'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles size={15} className={votingCount > 0 ? "text-amber-400 animate-pulse" : ""} />
          <span>Para Adoção</span>
          {votingCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {votingCount}
            </span>
          )}
        </button>
      </div>

      {/* Barra de Busca Minimalista */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          placeholder={subTab === 'repertoire' ? "Buscar por título, artista, tom ou tag..." : "Buscar sugestão por título, artista ou quem sugeriu..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-body-md rounded-xl outline-none focus:bg-surface-container-low transition-colors duration-200 border border-outline-variant/30 shadow-inner"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
            title="Limpar busca"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        )}
      </div>

      {/* Conteúdo: Subaba Repertório Principal */}
      {subTab === 'repertoire' && (
        <div className="space-y-3">
            {/* FAIXA DE FILTROS CLEAN (Sem rolagem lateral: 3 filtros rápidos + Menu +Filtros) */}
            <div className="relative">
              <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                {/* 1. Todas */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedGroup('all');
                    setSelectedKey('all');
                  }}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                    selectedCategory === 'all' && selectedGroup === 'all' && selectedKey === 'all'
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                  }`}
                >
                  Todas ({songs.length})
                </button>

                {/* 2. Adoração */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === 'Adoração' ? 'all' : 'Adoração')}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                    selectedCategory === 'Adoração'
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                  }`}
                >
                  Adoração
                </button>

                {/* 3. Celebração */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === 'Celebração' ? 'all' : 'Celebração')}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                    selectedCategory === 'Celebração'
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                  }`}
                >
                  Celebração
                </button>

                {/* Chip ativo se for categoria externa selecionada pelo menu */}
                {isCustomCategoryActive && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="px-2.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 bg-primary-container text-on-primary-container shadow-sm font-bold flex items-center gap-1 cursor-pointer"
                    title="Remover filtro de categoria"
                  >
                    <span>{selectedCategory}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}

                {/* Chip ativo se Tom selecionado */}
                {isKeyActive && (
                  <button
                    type="button"
                    onClick={() => setSelectedKey('all')}
                    className="px-2.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 bg-primary-container text-on-primary-container shadow-sm font-bold flex items-center gap-1 cursor-pointer"
                    title="Remover filtro de tom"
                  >
                    <span>Tom: {selectedKey}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}

                {/* Chip ativo se Grupo selecionado */}
                {isGroupActive && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroup('all')}
                    className="px-2.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 bg-primary-container text-on-primary-container shadow-sm font-bold flex items-center gap-1 cursor-pointer"
                    title="Remover filtro de grupo"
                  >
                    <span>{selectedGroup === 'ungrouped' ? 'Sem Grupo' : selectedGroup}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}

                {/* Botão + Filtros (Menu Dropdown) */}
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 flex items-center gap-1 border cursor-pointer ${
                    activeExtraFiltersCount > 0
                      ? 'bg-primary-container/20 text-primary border-primary/40 font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  <span>+ Filtros</span>
                  {activeExtraFiltersCount > 0 && (
                    <span className="bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {activeExtraFiltersCount}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[14px] opacity-70">
                    {isFilterMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>

              {/* Menu Popover Dropdown de Mais Filtros */}
              {isFilterMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFilterMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface-container border border-outline-variant/30 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-3.5 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                        <span className="font-headline-sm text-sm font-bold text-on-surface">Mais Filtros</span>
                      </div>
                      {(selectedCategory !== 'all' || selectedGroup !== 'all' || selectedKey !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSelectedGroup('all');
                            setSelectedKey('all');
                          }}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>

                    {/* Mais Categorias */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                        Outras Categorias
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Ministração', 'Abertura', 'Santa Ceia', 'Comunhão', 'Contemplação'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(selectedCategory === cat ? 'all' : cat);
                              setIsFilterMenuOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tom Musical */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                        Tom Musical
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKey('all');
                          }}
                          className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedKey === 'all'
                              ? 'bg-primary-container text-on-primary-container shadow-sm'
                              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          Todos
                        </button>
                        {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Em', 'Dm'].map(k => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              setSelectedKey(selectedKey === k ? 'all' : k);
                            }}
                            className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedKey === k
                                ? 'bg-primary-container text-on-primary-container shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grupos / Pastas */}
                    {availableGroups.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                            Grupo / Ocasião
                          </label>
                          {isCurrentUserLeader && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsFilterMenuOpen(false);
                                setGroupToEdit(null);
                                setIsCreateGroupOpen(true);
                              }}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">add</span>
                              Novo Grupo
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGroup('all');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              selectedGroup === 'all'
                                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            Todos
                          </button>
                          {availableGroups.map(grp => (
                            <button
                              key={grp}
                              type="button"
                              onClick={() => {
                                setSelectedGroup(selectedGroup === grp ? 'all' : grp);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                selectedGroup === grp
                                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {grp}
                            </button>
                          ))}
                          {ungroupedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGroup(selectedGroup === 'ungrouped' ? 'all' : 'ungrouped');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                selectedGroup === 'ungrouped'
                                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              Sem Grupo ({ungroupedCount})
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsFilterMenuOpen(false)}
                        className="w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          {/* Banner de Gestão do Grupo Ativo (quando filtrado por grupo específico) */}
          {selectedGroup !== 'all' && selectedGroup !== 'ungrouped' && (
            <div className="bg-surface-container border border-primary/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">folder</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
                    {selectedGroup}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">
                    {songs.filter(s => s.group === selectedGroup).length} {songs.filter(s => s.group === selectedGroup).length === 1 ? 'música agrupada' : 'músicas agrupadas'}
                  </p>
                </div>
              </div>

              {isCurrentUserLeader && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupToEdit(selectedGroup);
                      setIsCreateGroupOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center gap-1 border border-outline-variant/30 transition-all active:scale-95"
                    title="Editar músicas deste grupo"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const count = songs.filter(s => s.group === selectedGroup).length;
                      setGroupToDelete({ name: selectedGroup, count });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    title="Excluir grupo de repertório"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span className="hidden sm:inline">Excluir Grupo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista de Músicas */}
          {filteredSongs.length === 0 ? (
            <EmptyState
              icon={Disc3}
              title="Nenhuma música encontrada"
              description={
                searchTerm || selectedCategory !== 'all' || selectedKey !== 'all' || selectedGroup !== 'all'
                  ? "Nenhum louvor corresponde aos filtros ou busca selecionada."
                  : "Cadastre novas músicas ou importe uma playlist do YouTube para montar seu repertório."
              }
              actionText={isCurrentUserLeader ? "Cadastrar Música" : "Sugerir Louvor"}
              actionIcon={<Plus size={16} />}
              onAction={() => {
                if (isCurrentUserLeader) {
                  setSongToEdit(null);
                  setIsAddSongOpen(true);
                } else {
                  setIsAddAdoptionOpen(true);
                }
              }}
              secondaryActionText={
                searchTerm || selectedCategory !== 'all' || selectedKey !== 'all' || selectedGroup !== 'all'
                  ? "Limpar Filtros"
                  : isCurrentUserLeader
                  ? "Importar Playlist"
                  : undefined
              }
              onSecondaryAction={() => {
                if (searchTerm || selectedCategory !== 'all' || selectedKey !== 'all' || selectedGroup !== 'all') {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedKey('all');
                  setSelectedGroup('all');
                } else if (isCurrentUserLeader) {
                  setIsImportPlaylistOpen(true);
                }
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredSongs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  isLeader={isCurrentUserLeader}
                  onSelectSong={setActiveSong}
                  onEditSong={song => {
                    setSongToEdit(song);
                    setIsAddSongOpen(true);
                  }}
                  onOpenStageSong={onOpenStageSong}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Subaba Músicas para Adoção */}
      {subTab === 'adoption' && (
        <div className="space-y-3">
          {/* Seletor de Votante / Líder Ativo */}
          <div className="bg-surface-container p-3 rounded-2xl border border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Conectado como:</span>
              <span className="bg-surface-container-high border border-outline-variant/30 rounded-xl px-2.5 py-1 text-xs font-bold text-on-surface">
                {currentVoterName} {isCurrentUserLeader ? '(Líder)' : ''}
              </span>
            </div>

            {isCurrentUserLeader && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl">
                <Crown size={12} /> Acesso de Líder Ativo
              </span>
            )}
          </div>

          {/* Filtros de Status da Adoção */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'voting', label: `Em Votação (${votingCount})` },
              { id: 'approved', label: 'Aprovadas' },
              { id: 'rejected', label: 'Arquivadas' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setAdoptionFilter(f.id as any)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                  adoptionFilter === f.id
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Músicas para Adoção */}
          {filteredAdoptionSongs.length === 0 ? (
            <div className="bg-surface-container border border-dashed border-outline-variant/40 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-bold text-on-surface">Nenhuma música para adoção</p>
              <p className="text-xs text-on-surface-variant">Sugira novas canções para o time votar e o líder aprovar.</p>
              <button
                type="button"
                onClick={() => setIsAddAdoptionOpen(true)}
                className="bg-primary-container hover:bg-primary-container/90 active:scale-95 text-on-primary-container px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md font-label-lg text-label-lg font-bold"
              >
                <Sparkles size={16} />
                <span>Sugerir Primeira Canção</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdoptionSongs.map(adoptionSong => (
                <AdoptionSongCard
                  key={adoptionSong.id}
                  adoptionSong={adoptionSong}
                  members={members}
                  currentVoterName={currentVoterName}
                  onVote={onVoteAdoptionSong}
                  onApprove={song => setAdoptionToApprove(song)}
                  onReject={onRejectAdoptionSong}
                  onDelete={onDeleteAdoptionSong}
                  isLeader={isCurrentUserLeader}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modais do Repertório Principal */}
      <AddSongBottomSheet
        isOpen={isAddSongOpen}
        onClose={() => {
          setIsAddSongOpen(false);
          setSongToEdit(null);
        }}
        onSaveSong={onSaveSong}
        songToEdit={songToEdit}
        availableGroups={availableGroups}
      />

      {/* Modal de Criação / Edição de Grupo de Repertório */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => {
          setIsCreateGroupOpen(false);
          setGroupToEdit(null);
        }}
        songs={songs}
        initialGroupName={groupToEdit || ''}
        onSaveGroup={(groupName, selectedSongIds) => {
          if (onSaveGroup) onSaveGroup(groupName, selectedSongIds);
          setSelectedGroup(groupName);
        }}
      />

      {/* Modal de Exclusão de Grupo de Repertório (com opção de apagar ou manter músicas) */}
      <DeleteGroupModal
        isOpen={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        groupName={groupToDelete?.name || ''}
        songCount={groupToDelete?.count || 0}
        onConfirm={(deleteSongsToo) => {
          if (groupToDelete && onDeleteGroup) {
            onDeleteGroup(groupToDelete.name, deleteSongsToo);
            if (selectedGroup === groupToDelete.name) {
              setSelectedGroup('all');
            }
          }
          setGroupToDelete(null);
        }}
      />

      <SongDetailModal
        isOpen={Boolean(activeSong)}
        onClose={() => {
          setActiveSong(null);
          if (onClearSelectedSong) onClearSelectedSong();
        }}
        song={activeSong}
        onEditSong={song => {
          setSongToEdit(song);
          setIsAddSongOpen(true);
        }}
        onDeleteSong={onDeleteSong}
      />

      {/* Modal de Importação de Playlist do YouTube */}
      <ImportPlaylistModal
        isOpen={isImportPlaylistOpen}
        onClose={() => setIsImportPlaylistOpen(false)}
        onImportSongs={onSaveBatchSongs}
        availableGroups={availableGroups}
        onImportComplete={(importedGroup) => {
          if (importedGroup) {
            setSelectedGroup(importedGroup);
          }
        }}
      />

      {/* Modais de Adoção de Canções */}
      <AddAdoptionSongModal
        isOpen={isAddAdoptionOpen}
        onClose={() => setIsAddAdoptionOpen(false)}
        members={members}
        onSaveAdoptionSong={onSaveAdoptionSong}
        defaultMemberName={currentVoterName}
      />

      <ApproveAdoptionModal
        isOpen={Boolean(adoptionToApprove)}
        onClose={() => setAdoptionToApprove(null)}
        adoptionSong={adoptionToApprove}
        leaders={leaders.length > 0 ? leaders : members}
        onApproveConfirm={onApproveAdoptionSong}
      />
    </div>
  );
};

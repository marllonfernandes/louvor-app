import React, { useState, useEffect } from 'react';
import { Search, Music, Check, X, Disc3, Folder, ChevronDown, ChevronUp, Layers, Plus } from 'lucide-react';
import { Song, SongCategory } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getYoutubeThumbnail } from '../../utils/youtube';

interface SongSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  selectedSongIds: string[];
  onConfirm: (selectedSongIds: string[]) => void;
  title?: string;
  subtitle?: string;
}

const CATEGORIES: ('Todas' | SongCategory)[] = [
  'Todas',
  'Adoração',
  'Celebração',
  'Ministração',
  'Abertura',
  'Santa Ceia',
  'Geral'
];

export const SongSelectModal: React.FC<SongSelectModalProps> = ({
  isOpen,
  onClose,
  songs,
  selectedSongIds,
  onConfirm,
  title,
  subtitle
}) => {
  const [selectionMode, setSelectionMode] = useState<'individual' | 'group'>('individual');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | SongCategory>('Todas');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('Todas');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Grupos existentes
  const availableGroups = Array.from(
    new Set(songs.map(s => s.group?.trim()).filter(Boolean))
  ).sort() as string[];

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedSongIds]);
      setSearchTerm('');
      setSelectedCategory('Todas');
      setSelectedGroupFilter('Todas');
      // Inicia com grupos expandidos por padrão
      const initExpanded: Record<string, boolean> = {};
      availableGroups.forEach(g => {
        initExpanded[g] = true;
      });
      setExpandedGroups(initExpanded);
    }
  }, [isOpen, selectedSongIds]);

  const toggleSong = (id: string) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleGroupExpanded = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Adicionar todas as músicas de um grupo
  const handleAddFullGroup = (groupName: string) => {
    const groupSongIds = songs.filter(s => s.group === groupName).map(s => s.id);
    setTempSelectedIds(prev => Array.from(new Set([...prev, ...groupSongIds])));
  };

  // Remover todas as músicas de um grupo
  const handleRemoveFullGroup = (groupName: string) => {
    const groupSongIds = songs.filter(s => s.group === groupName).map(s => s.id);
    setTempSelectedIds(prev => prev.filter(id => !groupSongIds.includes(id)));
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredSongs.map(s => s.id);
    const allSelected = filteredIds.every(id => tempSelectedIds.includes(id));

    if (allSelected) {
      setTempSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setTempSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearAll = () => {
    setTempSelectedIds([]);
  };

  const handleApply = () => {
    onConfirm(tempSelectedIds);
    onClose();
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.group && song.group.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todas' || song.category === selectedCategory;

    const matchesGroup =
      selectedGroupFilter === 'Todas' ||
      (selectedGroupFilter === 'Sem Grupo' ? !song.group : song.group === selectedGroupFilter);

    return matchesSearch && matchesCategory && matchesGroup;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Selecionar Músicas do Culto"}
      subtitle={subtitle || "Escolha músicas individualmente ou associe grupos completos de repertório"}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col h-full space-y-3.5 text-left">
        {/* Alternador de Modo: Individual vs Por Grupo */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectionMode('individual')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectionMode === 'individual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music size={14} />
            <span>Músicas Individuais</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode('group')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectionMode === 'group'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder size={14} />
            <span>Por Grupo {availableGroups.length > 0 ? `(${availableGroups.length})` : ''}</span>
          </button>
        </div>

        {selectionMode === 'group' ? (
          /* MODO: POR GRUPO */
          <div className="space-y-3">
            {availableGroups.length === 0 ? (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
                <Folder size={24} className="mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">Nenhum grupo de repertório cadastrado</p>
                <p className="text-xs text-slate-500">
                  Crie grupos (ex: "Congresso Varões") na aba Repertório para associá-los com 1 clique.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto pr-1 overscroll-contain">
                {availableGroups.map(grpName => {
                  const groupSongs = songs.filter(s => s.group === grpName);
                  const selectedInGroup = groupSongs.filter(s => tempSelectedIds.includes(s.id));
                  const allSelected = selectedInGroup.length === groupSongs.length && groupSongs.length > 0;
                  const isExpanded = expandedGroups[grpName] ?? true;

                  return (
                    <div
                      key={grpName}
                      className={`rounded-2xl border transition-all p-3 space-y-2.5 ${
                        allSelected
                          ? 'bg-blue-950/30 border-blue-500/40 shadow-sm'
                          : selectedInGroup.length > 0
                          ? 'bg-slate-900/90 border-slate-700'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      {/* Topo do Grupo */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            allSelected
                              ? 'bg-blue-600 text-white'
                              : selectedInGroup.length > 0
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Folder size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">{grpName}</h4>
                            <p className="text-[11px] text-slate-400">
                              {selectedInGroup.length} de {groupSongs.length} selecionada{groupSongs.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {allSelected ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveFullGroup(grpName)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
                            >
                              Remover Grupo
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddFullGroup(grpName)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1"
                            >
                              <Plus size={13} />
                              <span>Adicionar Grupo ({groupSongs.length})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleGroupExpanded(grpName)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title={isExpanded ? "Recolher músicas" : "Expandir músicas"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Músicas do Grupo Expansíveis com Checkbox Individual */}
                      {isExpanded && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                          {groupSongs.map(song => {
                            const isSelected = tempSelectedIds.includes(song.id);
                            const selectionIndex = tempSelectedIds.indexOf(song.id);

                            return (
                              <div
                                key={song.id}
                                onClick={() => toggleSong(song.id)}
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-xs ${
                                  isSelected
                                    ? 'bg-blue-950/40 border-blue-500/40 text-slate-100'
                                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div
                                    className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 border ${
                                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-transparent'
                                    }`}
                                  >
                                    {isSelected ? (selectionIndex >= 0 ? selectionIndex + 1 : <Check size={12} />) : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold truncate">{song.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-blue-400 font-bold ml-2">Tom: {song.key}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* MODO: INDIVIDUAL */
          <>
            {/* Barra de Busca */}
            <div className="relative">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, artista, tom ou grupo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filtro por Grupos (quando houver) */}
            {availableGroups.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
                  <Folder size={11} /> Grupo:
                </span>
                {['Todas', ...availableGroups, 'Sem Grupo'].map(grp => {
                  const isSelected = selectedGroupFilter === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroupFilter(grp)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filtro por Categorias */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => {
                const count = cat === 'Todas' 
                  ? songs.length 
                  : songs.filter(s => s.category === cat).length;

                if (count === 0 && cat !== 'Todas') return null;

                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Resumo e Ações Rápidas */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">
                  {tempSelectedIds.length} de {songs.length} selecionada{tempSelectedIds.length === 1 ? '' : 's'}
                </span>
                {tempSelectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>

              {filteredSongs.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
                >
                  {filteredSongs.every(s => tempSelectedIds.includes(s.id))
                    ? 'Desmarcar filtradas'
                    : 'Selecionar todas filtradas'}
                </button>
              )}
            </div>

            {/* Lista Espaçosa e Confortável de Músicas */}
            <div className="space-y-2 max-h-[46vh] sm:max-h-[50vh] overflow-y-auto pr-1 overscroll-contain">
              {filteredSongs.length === 0 ? (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
                  <Music size={24} className="mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Nenhuma música encontrada</p>
                  <p className="text-xs text-slate-500">Tente ajustar o termo de busca ou o filtro de categoria.</p>
                </div>
              ) : (
                filteredSongs.map(song => {
                  const isSelected = tempSelectedIds.includes(song.id);
                  const thumb = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;
                  const selectionIndex = tempSelectedIds.indexOf(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] gap-3 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-950/20'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox Touch Confortável com Número de Ordem */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-700 text-transparent'
                          }`}
                        >
                          {isSelected ? (
                            selectionIndex >= 0 ? (
                              <span>{selectionIndex + 1}</span>
                            ) : (
                              <Check size={16} className="stroke-[3]" />
                            )
                          ) : null}
                        </div>

                        {/* Capa do YouTube / Ícone de Música */}
                        {thumb ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                            <img
                              src={thumb}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Disc3 size={20} />
                          </div>
                        )}

                        {/* Dados da Canção */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-100 truncate">{song.title}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {song.group && (
                              <span className="text-[10px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-500/30 font-semibold flex items-center gap-1">
                                <Folder size={10} /> {song.group}
                              </span>
                            )}
                            {song.category && (
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                {song.category}
                              </span>
                            )}
                            {song.bpm && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {song.bpm} BPM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tom da Música */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <Badge variant={isSelected ? 'blue' : 'slate'} size="sm" className="font-bold">
                          Tom: {song.key}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Rodapé Fixo */}
        <div className="pt-3 border-t border-slate-800 flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleApply}
          >
            Confirmar ({tempSelectedIds.length})
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

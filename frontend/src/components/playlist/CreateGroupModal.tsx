import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, Search, Check, X, Disc3 } from 'lucide-react';
import { Song } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { getYoutubeThumbnail } from '../../utils/youtube';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  initialGroupName?: string;
  onSaveGroup: (groupName: string, selectedSongIds: string[]) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  songs,
  initialGroupName = '',
  onSaveGroup
}) => {
  const [groupName, setGroupName] = useState(initialGroupName);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSaveClick = (e: React.MouseEvent) => {
    if (formRef.current) {
      if (!formRef.current.reportValidity()) {
        e.preventDefault();
        return;
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setGroupName(initialGroupName);
      setSearchTerm('');
      if (initialGroupName) {
        setSelectedSongIds(songs.filter(s => s.group === initialGroupName).map(s => s.id));
      } else {
        setSelectedSongIds([]);
      }
    }
  }, [isOpen, initialGroupName, songs]);

  const toggleSong = (songId: string) => {
    setSelectedSongIds(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredSongs.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedSongIds.includes(id));
    if (allSelected) {
      setSelectedSongIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedSongIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) return;
    onSaveGroup(trimmed, selectedSongIds);
    onClose();
  };

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.group && s.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialGroupName ? "Editar Grupo de Repertório" : "Novo Grupo de Repertório"}
      subtitle="Agrupe músicas para ocasiões especiais (ex: Congresso Varões, Jovens, etc.)"
      maxHeight="max-h-[90vh]"
      footer={
        <div className="flex gap-2 w-full">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-group-form"
            variant="primary"
            fullWidth
            disabled={!groupName.trim()}
            onClick={handleSaveClick}
          >
            {initialGroupName ? "Atualizar Grupo" : "Salvar Grupo"}
          </Button>
        </div>
      }
    >
      <form id="create-group-form" ref={formRef} onSubmit={handleSubmit} className="space-y-4 text-left pb-2">
        {/* Nome do Grupo */}
        <Input
          label="Nome do Grupo"
          placeholder="Ex: Congresso Varões"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          required
          autoFocus
          icon={<FolderPlus size={16} />}
        />

        {/* Seleção de Músicas do Repertório */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Músicas do Grupo ({selectedSongIds.length} selecionadas)
            </label>
            {filteredSongs.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                {filteredSongs.every(s => selectedSongIds.includes(s.id))
                  ? 'Desmarcar filtradas'
                  : 'Selecionar todas filtradas'}
              </button>
            )}
          </div>

          {/* Busca interna */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar músicas para adicionar ao grupo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Lista de Músicas */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto overscroll-contain pr-1">
            {filteredSongs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
                Nenhuma música encontrada no repertório.
              </div>
            ) : (
              filteredSongs.map(song => {
                const isSelected = selectedSongIds.includes(song.id);
                const thumb = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSong(song.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.99] gap-2.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/50 text-slate-100'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs flex-shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        {isSelected && <Check size={13} className="stroke-[3]" />}
                      </div>

                      {thumb ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                          <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <Disc3 size={15} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100 truncate">{song.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {song.group && song.group !== initialGroupName && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[90px]">
                          {song.group}
                        </span>
                      )}
                      <Badge variant={isSelected ? 'blue' : 'slate'} size="sm" className="text-[10px]">
                        {song.key}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </form>
    </BottomSheet>
  );
};

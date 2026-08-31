import React, { useState } from 'react';
import { Song, SongCategory } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { Badge } from '../ui/Badge';
import { Search, Loader2, Check, Sparkles, Disc3, Music2, AlertCircle } from 'lucide-react';
import { ALL_KEYS } from '../../utils/chordTransposer';
import { fetchYoutubePlaylist, YoutubePlaylistItem } from '../../utils/youtube';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSongs: (songs: Omit<Song, 'id'>[]) => void;
}

interface EditablePlaylistItem extends YoutubePlaylistItem {
  selected: boolean;
  key: string;
  category: SongCategory;
}

const CATEGORIES: SongCategory[] = ['Adoração', 'Celebração', 'Ministração', 'Abertura', 'Santa Ceia', 'Geral'];

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onImportSongs
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [items, setItems] = useState<EditablePlaylistItem[]>([]);

  // Configurações em Lote
  const [batchCategory, setBatchCategory] = useState<SongCategory>('Adoração');
  const [batchKey, setBatchKey] = useState<string>('C');

  const handleFetchPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setItems([]);

    const details = await fetchYoutubePlaylist(playlistUrl.trim());
    setIsLoading(false);

    if (details && details.items.length > 0) {
      setPlaylistTitle(details.title || 'Playlist do YouTube');
      setItems(
        details.items.map(item => ({
          ...item,
          selected: true,
          key: 'C',
          category: 'Adoração'
        }))
      );
    } else {
      setErrorMessage(
        'Não foi possível encontrar vídeos nesta playlist. Verifique se o link está correto e se a playlist está pública ou não listada no YouTube.'
      );
    }
  };

  const toggleItem = (videoId: string) => {
    setItems(prev =>
      prev.map(it => it.videoId === videoId ? { ...it, selected: !it.selected } : it)
    );
  };

  const handleSelectAll = (select: boolean) => {
    setItems(prev => prev.map(it => ({ ...it, selected: select })));
  };

  const applyBatchCategory = (cat: SongCategory) => {
    setBatchCategory(cat);
    setItems(prev => prev.map(it => ({ ...it, category: cat })));
  };

  const applyBatchKey = (k: string) => {
    setBatchKey(k);
    setItems(prev => prev.map(it => ({ ...it, key: k })));
  };

  const handleUpdateItemKey = (videoId: string, key: string) => {
    setItems(prev => prev.map(it => it.videoId === videoId ? { ...it, key } : it));
  };

  const handleUpdateItemCategory = (videoId: string, category: SongCategory) => {
    setItems(prev => prev.map(it => it.videoId === videoId ? { ...it, category } : it));
  };

  const handleConfirmImport = () => {
    const selectedItems = items.filter(it => it.selected);
    if (selectedItems.length === 0) return;

    const songsToImport: Omit<Song, 'id'>[] = selectedItems.map(item => ({
      title: item.title,
      artist: item.artist || 'Artista',
      url: item.url,
      key: item.key,
      category: item.category,
      createdAt: Date.now()
    }));

    onImportSongs(songsToImport);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPlaylistUrl('');
    setItems([]);
    setPlaylistTitle('');
    setErrorMessage('');
    setIsLoading(false);
  };

  const selectedCount = items.filter(it => it.selected).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Importar Playlist do YouTube"
      subtitle="Cole o link da playlist para importar todas as músicas em lote"
      maxHeight="max-h-[92vh]"
    >
      <div className="space-y-4 text-left">
        {/* Formulário de Busca da Playlist */}
        <form onSubmit={handleFetchPlaylist} className="space-y-2">
          <Input
            label="Link da Playlist do YouTube"
            type="url"
            placeholder="https://www.youtube.com/playlist?list=PL..."
            value={playlistUrl}
            onChange={e => setPlaylistUrl(e.target.value)}
            required
            icon={<YoutubeIcon size={16} className="text-rose-500" />}
            helperText="Suporta links no formato /playlist?list= ou links de vídeos com ?v=...&list="
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading || !playlistUrl.trim()}
            icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          >
            {isLoading ? "Buscando Músicas na Playlist..." : "Carregar Músicas da Playlist"}
          </Button>
        </form>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Lista de Músicas Detectadas */}
        {items.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider line-clamp-1">
                  {playlistTitle}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {selectedCount} de {items.length} músicas selecionadas para importação
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(selectedCount !== items.length)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  {selectedCount === items.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>
            </div>

            {/* Configurações em Lote */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Estilo Padrão para Todas
                </label>
                <select
                  value={batchCategory}
                  onChange={e => applyBatchCategory(e.target.value as SongCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Tom Padrão para Todas
                </label>
                <select
                  value={batchKey}
                  onChange={e => applyBatchKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {ALL_KEYS.map(k => (
                    <option key={k} value={k}>Tom {k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista com Scroll das Músicas */}
            <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.videoId || idx}
                  onClick={() => toggleItem(item.videoId)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    item.selected
                      ? 'bg-blue-950/40 border-blue-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                      item.selected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700'
                    }`}>
                      {item.selected && <Check size={13} className="stroke-[3]" />}
                    </div>

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.artist}</p>
                    </div>
                  </div>

                  {/* Seleção individual de tom e estilo */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <select
                      value={item.key}
                      onChange={e => handleUpdateItemKey(item.videoId, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-[11px] font-bold text-blue-400 focus:outline-none"
                    >
                      {ALL_KEYS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>

                    <select
                      value={item.category}
                      onChange={e => handleUpdateItemCategory(item.videoId, e.target.value as SongCategory)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-[10px] text-slate-300 focus:outline-none max-w-[80px]"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com Ação de Importação */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  handleReset();
                  onClose();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={selectedCount === 0}
                onClick={handleConfirmImport}
                icon={<Sparkles size={15} />}
              >
                Importar {selectedCount} Músicas
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

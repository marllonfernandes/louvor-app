import React, { useState } from 'react';
import { Plus, Search, Disc3, Sparkles, Heart, Crown, Filter, CheckCircle2 } from 'lucide-react';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { Song, AdoptionSong, Member } from '../../types';
import { SongCard } from './SongCard';
import { SongDetailModal } from './SongDetailModal';
import { AddSongBottomSheet } from './AddSongBottomSheet';
import { AdoptionSongCard } from './AdoptionSongCard';
import { AddAdoptionSongModal } from './AddAdoptionSongModal';
import { ApproveAdoptionModal } from './ApproveAdoptionModal';
import { ImportPlaylistModal } from './ImportPlaylistModal';
import { Button } from '../ui/Button';
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
  selectedSongFromEvent?: Song | null;
  onClearSelectedSong?: () => void;
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
  selectedSongFromEvent,
  onClearSelectedSong
}) => {
  const [subTab, setSubTab] = useState<'repertoire' | 'adoption'>('repertoire');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<string>('all');
  const [adoptionFilter, setAdoptionFilter] = useState<'all' | 'voting' | 'approved' | 'rejected'>('all');

  const { userProfile } = useAuth();
  
  // Identificação do Usuário / Votante Atual
  const currentVoterName = userProfile?.name || 'Membro do Ministério';
  const isCurrentUserLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  // Modais
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isImportPlaylistOpen, setIsImportPlaylistOpen] = useState(false);
  const [isAddAdoptionOpen, setIsAddAdoptionOpen] = useState(false);
  const [activeSong, setActiveSong] = useState<Song | null>(selectedSongFromEvent || null);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [adoptionToApprove, setAdoptionToApprove] = useState<AdoptionSong | null>(null);

  // Lista de Líderes
  const leaders = members.filter(m => {
    const r = [m.role, ...(m.roles || [])].join(' ').toLowerCase();
    return r.includes('líder') || r.includes('lider');
  });

  // Filtros do Repertório Principal
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    const matchesKey = selectedKey === 'all' || song.key === selectedKey;
    return matchesSearch && matchesCategory && matchesKey;
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

  return (
    <div className="space-y-4 text-left">
      {/* Topo com Ações Contextuais */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight truncate">Repertório</h2>
          <p className="text-xs text-slate-400 truncate">Músicas, tons e adoção de louvores</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {subTab === 'repertoire' ? (
            isCurrentUserLeader && (
              <>
                <button
                  type="button"
                  onClick={() => setIsImportPlaylistOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all text-xs font-bold border border-rose-500/30 shadow-sm"
                  title="Importar playlist completa do YouTube"
                >
                  <YoutubeIcon size={15} />
                  <span className="hidden sm:inline">Importar</span> Playlist
                </button>

                <Button
                  onClick={() => {
                    setSongToEdit(null);
                    setIsAddSongOpen(true);
                  }}
                  size="sm"
                  className="flex-shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm"
                  icon={<Plus size={16} />}
                >
                  Nova Música
                </Button>
              </>
            )
          ) : (
            <Button
              onClick={() => setIsAddAdoptionOpen(true)}
              size="sm"
              className="flex-shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-slate-950 font-black border-amber-400"
              icon={<Sparkles size={16} />}
            >
              Sugerir Música
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Control (Repertório Principal vs Músicas para Adoção) */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setSubTab('repertoire')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'repertoire'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Disc3 size={16} />
          <span>Repertório Ativo ({songs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('adoption')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'adoption'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={16} className={votingCount > 0 ? "text-amber-400 animate-pulse" : ""} />
          <span>Para Adoção</span>
          {votingCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {votingCount}
            </span>
          )}
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={subTab === 'repertoire' ? "Buscar por música ou artista..." : "Buscar sugestão por música, artista ou quem sugeriu..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
        />
      </div>

      {/* Conteúdo: Subaba Repertório Principal */}
      {subTab === 'repertoire' && (
        <div className="space-y-3">
          {/* Filtros de Categoria e Tom */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
              {['all', 'Adoração', 'Celebração', 'Ministração', 'Abertura', 'Santa Ceia'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>

            <select
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-2xl px-3 py-1.5 focus:outline-none focus:border-blue-500 font-bold flex-shrink-0"
            >
              <option value="all">Todos Tons</option>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Em', 'Dm'].map(k => (
                <option key={k} value={k}>Tom {k}</option>
              ))}
            </select>
          </div>

          {/* Lista de Músicas */}
          {filteredSongs.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Disc3 size={24} />
              </div>
              <p className="text-sm font-bold text-slate-200">Nenhuma música encontrada</p>
              <p className="text-xs text-slate-400">Cadastre músicas ou importe uma playlist do YouTube.</p>
              {isCurrentUserLeader && (
                <div className="flex justify-center gap-2 pt-1">
                  <Button size="sm" onClick={() => setIsImportPlaylistOpen(true)} icon={<YoutubeIcon size={15} />}>
                    Importar Playlist
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setIsAddSongOpen(true)} icon={<Plus size={16} />}>
                    Nova Música
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSongs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  onSelectSong={setActiveSong}
                  onEditSong={song => {
                    setSongToEdit(song);
                    setIsAddSongOpen(true);
                  }}
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
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Conectado como:</span>
              <span className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-100">
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
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  adoptionFilter === f.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Músicas para Adoção */}
          {filteredAdoptionSongs.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-bold text-slate-200">Nenhuma música para adoção</p>
              <p className="text-xs text-slate-400">Sugira novas canções para o time votar e o líder aprovar.</p>
              <Button
                size="sm"
                onClick={() => setIsAddAdoptionOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black border-amber-400"
                icon={<Sparkles size={16} />}
              >
                Sugerir Primeira Canção
              </Button>
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

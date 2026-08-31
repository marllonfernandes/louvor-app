import React from 'react';
import { AdoptionSong, Member } from '../../types';
import { Heart, Crown, CheckCircle2, XCircle, Trash2, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { getYoutubeThumbnail } from '../../utils/youtube';

interface AdoptionSongCardProps {
  adoptionSong: AdoptionSong;
  members: Member[];
  currentVoterName: string;
  onVote: (songId: string, voterName: string) => void;
  onApprove: (adoptionSong: AdoptionSong) => void;
  onReject: (songId: string) => void;
  onDelete: (songId: string) => void;
  isLeader: boolean;
}

export const AdoptionSongCard: React.FC<AdoptionSongCardProps> = ({
  adoptionSong,
  members,
  currentVoterName,
  onVote,
  onApprove,
  onReject,
  onDelete,
  isLeader
}) => {
  const thumb = adoptionSong.url ? getYoutubeThumbnail(adoptionSong.url, 'hq') : null;
  const hasVoted = Boolean(currentVoterName && adoptionSong.votes.includes(currentVoterName));
  const voteCount = adoptionSong.votes.length;

  return (
    <div className={`p-4 rounded-2xl border transition-all text-left space-y-3.5 ${
      adoptionSong.status === 'approved'
        ? 'bg-emerald-950/20 border-emerald-500/30'
        : adoptionSong.status === 'rejected'
        ? 'bg-slate-900/50 border-slate-800 opacity-60'
        : 'bg-slate-800/90 border-slate-700/80 hover:border-blue-500/40 shadow-sm'
    }`}>
      {/* Topo do Card: Badges de Status, Categoria e Tom */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {adoptionSong.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
              <CheckCircle2 size={12} /> Aprovada no Repertório
            </span>
          ) : adoptionSong.status === 'rejected' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg">
              <XCircle size={12} /> Arquivada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
              <Sparkles size={12} /> Em Votação
            </span>
          )}

          {adoptionSong.suggestedCategory && (
            <Badge variant="blue" size="sm">
              {adoptionSong.suggestedCategory}
            </Badge>
          )}

          {adoptionSong.suggestedKey && (
            <Badge variant="slate" size="sm" className="font-bold">
              Tom: {adoptionSong.suggestedKey}
            </Badge>
          )}
        </div>

        {adoptionSong.status === 'voting' && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir esta sugestão de música?')) {
                onDelete(adoptionSong.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
            title="Excluir sugestão"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Conteúdo Principal com Capa e Detalhes */}
      <div className="flex items-start gap-3">
        {thumb ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700 shadow-sm relative group">
            <img src={thumb} alt={adoptionSong.title} className="w-full h-full object-cover" />
            {adoptionSong.url && (
              <a
                href={adoptionSong.url}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <YoutubeIcon size={20} className="text-white" />
              </a>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Sparkles size={24} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-100 text-base line-clamp-1">{adoptionSong.title}</h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">{adoptionSong.artist}</p>
            </div>

            {adoptionSong.url && (
              <a
                href={adoptionSong.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 flex-shrink-0"
                title="Ouvir no YouTube"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <span>Sugerido por:</span>
            <span className="font-bold text-slate-200">{adoptionSong.suggestedByMemberName || 'Membro do Ministério'}</span>
          </div>
        </div>
      </div>

      {/* Justificativa / Comentário */}
      {adoptionSong.notes && (
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <MessageSquare size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="italic leading-relaxed">{adoptionSong.notes}</p>
        </div>
      )}

      {/* Seção de Votação */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={adoptionSong.status !== 'voting'}
            onClick={() => onVote(adoptionSong.id, currentVoterName)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
              hasVoted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-950/30'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Heart size={15} className={hasVoted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
            <span>{hasVoted ? 'Votado' : 'Votar na Música'}</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded-md font-extrabold text-blue-400">
              {voteCount}
            </span>
          </button>
        </div>

        {/* Quem já votou */}
        {voteCount > 0 && (
          <div className="text-[11px] text-slate-400 truncate max-w-[170px] text-right" title={adoptionSong.votes.join(', ')}>
            Votos: <span className="text-slate-200 font-medium">{adoptionSong.votes.slice(0, 2).join(', ')}{voteCount > 2 ? ` +${voteCount - 2}` : ''}</span>
          </div>
        )}
      </div>

      {/* PAINEL EXCLUSIVO DO LÍDER (Aprovação / Promoção para o Repertório Principal) */}
      {isLeader && adoptionSong.status === 'voting' && (
        <div className="pt-2.5 border-t border-amber-500/20 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Crown size={14} className="text-amber-400" />
            <span>Painel do Líder de Louvor</span>
          </div>

          <p className="text-[11px] text-amber-200/80 leading-tight">
            Como líder, você pode aprovar esta canção mais votada e adicioná-la diretamente ao repertório oficial.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              className="bg-amber-600 hover:bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md"
              onClick={() => onApprove(adoptionSong)}
              icon={<Crown size={14} />}
            >
              Aprovar para Repertório Oficial
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (confirm('Deseja arquivar esta sugestão?')) {
                  onReject(adoptionSong.id);
                }
              }}
            >
              Recusar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

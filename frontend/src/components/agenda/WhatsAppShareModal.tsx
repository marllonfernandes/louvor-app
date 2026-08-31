import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { WorshipEvent, Song, Member } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { generateEventShareText, createShareWhatsAppGroupLink } from '../../utils/whatsapp';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WorshipEvent | null;
  songs: Song[];
  members: Member[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  event,
  songs,
  members
}) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const eventSongs = (event.songIds || []).map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
  const shareText = generateEventShareText(event, eventSongs, members);
  const waLink = createShareWhatsAppGroupLink(event, eventSongs, members);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Compartilhar no WhatsApp"
      subtitle="Escala formatada para enviar no grupo do ministério"
    >
      <div className="space-y-4 text-left">
        {/* Preview do texto formatado */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto select-all">
          {shareText}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2 pt-2">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center font-bold text-sm px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 active:scale-95 transition-all gap-2"
          >
            <MessageCircle size={18} />
            Enviar no WhatsApp
          </a>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleCopy}
            icon={copied ? <Check size={16} className="text-blue-600 dark:text-blue-400" /> : <Copy size={16} />}
          >
            {copied ? 'Copiado para a Área de Transferência!' : 'Copiar Texto da Escala'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

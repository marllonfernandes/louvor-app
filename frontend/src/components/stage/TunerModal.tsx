import React, { useState, useRef } from 'react';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STRINGS = [
  { note: 'E4', name: '1ª Mi (E)', freq: 329.63 },
  { note: 'B3', name: '2ª Si (B)', freq: 246.94 },
  { note: 'G3', name: '3ª Sol (G)', freq: 196.00 },
  { note: 'D3', name: '4ª Ré (D)', freq: 146.83 },
  { note: 'A2', name: '5ª Lá (A)', freq: 110.00 },
  { note: 'E2', name: '6ª Mi (E)', freq: 82.41 },
];

export const TunerModal: React.FC<TunerModalProps> = ({ isOpen, onClose }) => {
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const stopTone = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {
        // Ignorar
      }
      oscRef.current = null;
    }
    setPlayingNote(null);
  };

  const playTone = (freq: number, note: string) => {
    stopTone();
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      setPlayingNote(note);
    } catch {
      // Ignorar falha de áudio
    }
  };

  const handleToggle = (freq: number, note: string) => {
    if (playingNote === note) {
      stopTone();
    } else {
      playTone(freq, note);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-surface-container-high border border-outline-variant/30 p-6 shadow-2xl flex flex-col gap-5 text-on-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">graphic_eq</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Afinador de Palco</h2>
          </div>
          <button 
            onClick={() => { stopTone(); onClose(); }}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Toque na corda para ouvir a frequência de referência de afinação padrão (440Hz):
        </p>

        <div className="flex flex-col gap-2">
          {STRINGS.map((str) => {
            const isPlaying = playingNote === str.note;
            return (
              <button
                key={str.note}
                onClick={() => handleToggle(str.freq, str.note)}
                className={`p-3 rounded-2xl flex items-center justify-between transition-all active:scale-98 ${
                  isPlaying 
                    ? 'bg-primary-container text-on-primary-container shadow-md' 
                    : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    isPlaying ? 'bg-on-primary-container text-primary-container' : 'bg-surface-container-high text-primary'
                  }`}>
                    {str.note.charAt(0)}
                  </div>
                  <span className="font-label-lg font-bold">{str.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-xs opacity-80">{str.freq} Hz</span>
                  <span className="material-symbols-outlined text-[20px]">
                    {isPlaying ? 'volume_up' : 'play_arrow'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { stopTone(); onClose(); }}
          className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface font-label-md active:scale-98 transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

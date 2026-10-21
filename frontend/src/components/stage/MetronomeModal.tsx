import React, { useState, useEffect, useRef } from 'react';

interface MetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBpm?: number;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({
  isOpen,
  onClose,
  initialBpm = 70
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const tapTimesRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  useEffect(() => {
    if (initialBpm) setBpm(initialBpm);
  }, [initialBpm]);

  // Audio Click
  const playClick = (isAccent: boolean) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1200 : 800;

      gain.gain.setValueAtTime(isAccent ? 0.8 : 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext not allowed or error
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = (60 / bpm) * 1000;
      timerRef.current = window.setInterval(() => {
        beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
        const currentBeat = beatRef.current;
        setBeat(currentBeat);
        playClick(currentBeat === 0);
      }, intervalMs);

      // Primeiro clique imediato
      playClick(beatRef.current === 0);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, beatsPerMeasure, soundEnabled]);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);
    if (times.length > 5) times.shift();

    if (times.length > 1) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setBpm(calculatedBpm);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-surface-container-high border border-outline-variant/30 p-6 shadow-2xl flex flex-col gap-5 text-on-surface">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">file_map_stack</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Metrônomo de Palco</h2>
          </div>
          <button 
            onClick={() => { setIsPlaying(false); onClose(); }}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Beats Visualizer */}
        <div className="flex justify-center items-center gap-2.5 py-3">
          {Array.from({ length: beatsPerMeasure }).map((_, idx) => (
            <div
              key={idx}
              className={`h-4 rounded-full transition-all duration-100 ${
                beat === idx && isPlaying
                  ? idx === 0 
                    ? 'w-8 bg-primary shadow-[0_0_12px_#b4c5ff]' 
                    : 'w-6 bg-secondary shadow-[0_0_8px_#b7c8e1]'
                  : 'w-4 bg-surface-container-highest'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-4xl text-primary font-black tracking-tight">{bpm}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">BPM</span>
          </div>
          <input 
            type="range" 
            min="40" 
            max="240" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-surface-container-lowest rounded-lg appearance-none cursor-pointer accent-primary mt-4"
          />
        </div>

        {/* Quick adjustments & Tap */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setBpm(b => Math.max(40, b - 5))}
            className="h-10 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface font-label-md active:scale-95 transition-all"
          >
            -5
          </button>
          <button 
            onClick={handleTapTempo}
            className="h-10 rounded-xl bg-surface-container text-primary font-label-md font-bold active:scale-95 transition-all flex items-center justify-center gap-1 border border-primary/20"
          >
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            TAP
          </button>
          <button 
            onClick={() => setBpm(b => Math.min(240, b + 5))}
            className="h-10 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface font-label-md active:scale-95 transition-all"
          >
            +5
          </button>
        </div>

        {/* Compasso & Som */}
        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
          <div className="flex items-center gap-1.5">
            {[3, 4, 6].map(num => (
              <button
                key={num}
                onClick={() => setBeatsPerMeasure(num)}
                className={`px-3 py-1 rounded-lg font-label-md font-bold text-xs ${
                  beatsPerMeasure === num 
                    ? 'bg-primary-container text-on-primary-container' 
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {num}/4
              </button>
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
              soundEnabled ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-full h-12 rounded-2xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all ${
            isPlaying 
              ? 'bg-error-container text-on-error-container hover:bg-error-container/90' 
              : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
          <span>{isPlaying ? 'Parar Metrônomo' : 'Iniciar Metrônomo'}</span>
        </button>
      </div>
    </div>
  );
};

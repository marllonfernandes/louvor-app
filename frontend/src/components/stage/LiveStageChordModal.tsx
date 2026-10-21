import React, { useState, useEffect, useRef } from 'react';
import { Song, Member } from '../../types';
import { transposeKey, transposeLyrics } from '../../utils/chordTransposer';

interface LiveStageChordModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  setlistSongs?: Song[];
  onSelectSong?: (song: Song) => void;
  stageMembers?: Member[];
}

export const LiveStageChordModal: React.FC<LiveStageChordModalProps> = ({
  isOpen,
  onClose,
  song,
  setlistSongs = [],
  onSelectSong,
  stageMembers = []
}) => {
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [beatDot, setBeatDot] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const metroIntervalRef = useRef<number | null>(null);

  // Resetar transposição ao trocar de música
  useEffect(() => {
    setSemitones(0);
    setCapo(0);
    setIsAutoScrolling(false);
  }, [song?.id]);

  // Metrônomo visual piscando no BPM da música
  useEffect(() => {
    if (!isOpen || !song) return;
    const bpm = song.bpm || 70;
    const intervalMs = (60 / bpm) * 1000;

    metroIntervalRef.current = window.setInterval(() => {
      setBeatDot(prev => !prev);
    }, intervalMs);

    return () => {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, [isOpen, song?.bpm]);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScrolling) {
      scrollIntervalRef.current = window.setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed * 1.5;
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  if (!isOpen || !song) return null;

  const originalKey = song.key || 'G';
  const currentKey = transposeKey(originalKey, semitones);
  const effectiveBpm = song.bpm || 70;

  // Letra/Cifra da música com fallback estruturado caso não haja ainda cadastrada
  const baseLyrics = song.lyrics || `[ INTRO ]\n${originalKey} | C | ${originalKey} | C\n\n[ VERSO 1 ]\n${originalKey}          C\nTe amo Deus, Tua graça nunca falha\nD/F#       Em        C         D\nTodos os dias, eu estou em Tuas mãos\nEm         C\nDesde quando acordo, até eu me deitar\nD/F#       ${originalKey}         C\nEu cantarei da Tua bondade ó Deus\n\n[ REFRÃO ]\nC          ${originalKey}\nTua bondade me seguirá\nD          Em\nMe seguirá, Senhor\nC          ${originalKey}\nTua bondade me seguirá\nD          Em        C\nMe seguirá, Senhor\n\n[ PONTE ]\n${originalKey}/B        C\nTua presença é o meu sustento\nD          Em\nEu me rendo a Ti, Te dou meu coração\n\n[ FINAL ]\n${originalKey} • C • ${originalKey} (Sustenta Pad no ${originalKey})`;

  const transposedText = transposeLyrics(baseLyrics, semitones);

  // Parse das seções para renderização de alto impacto no palco
  const renderSections = () => {
    const rawLines = transposedText.split('\n');
    const sections: { title: string; lines: string[]; isChorus: boolean }[] = [];
    let currentSection: { title: string; lines: string[]; isChorus: boolean } | null = null;

    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const title = trimmed.replace(/\[|\]/g, '').trim();
        const isChorus = title.toLowerCase().includes('refr') || title.toLowerCase().includes('chorus');
        currentSection = { title, lines: [], isChorus };
        sections.push(currentSection);
      } else {
        if (!currentSection) {
          currentSection = { title: 'CANÇÃO', lines: [], isChorus: false };
          sections.push(currentSection);
        }
        currentSection.lines.push(line);
      }
    });

    return sections.map((sec, idx) => (
      <div
        key={idx}
        className={`rounded-2xl p-4 shadow-sm flex flex-col gap-2 transition-all ${
          sec.isChorus
            ? 'bg-surface-container-high border-l-4 border-primary relative overflow-hidden'
            : 'bg-surface-container border border-outline-variant/15'
        }`}
      >
        <div className="flex items-center justify-between pb-1">
          <span
            className={`px-3 py-0.5 rounded-full font-label-md text-label-md uppercase tracking-wider font-extrabold ${
              sec.isChorus
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-highest text-primary'
            }`}
          >
            [ {sec.title} ]
          </span>
          {sec.isChorus && (
            <span className="font-label-sm text-label-sm text-primary font-bold">
              Banda Completa (Forte)
            </span>
          )}
        </div>

        <div className="font-mono text-base whitespace-pre-wrap leading-relaxed select-none text-on-surface">
          {sec.lines.map((l, lIdx) => {
            // Linha com acordes
            const isChordLine = /^[A-G][#b]?(\w|\/|\s|[0-9]|\+|\|)*$/.test(l.trim());
            return (
              <div 
                key={lIdx} 
                className={isChordLine ? 'text-primary font-black text-lg tracking-wider pt-1.5' : 'text-on-surface font-sans text-base py-0.5'}
              >
                {l || '\u00A0'}
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const currentIndex = setlistSongs.findIndex(s => s.id === song.id);
  const prevSong = currentIndex > 0 ? setlistSongs[currentIndex - 1] : null;
  const nextSong = currentIndex >= 0 && currentIndex < setlistSongs.length - 1 ? setlistSongs[currentIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col text-on-surface animate-fade-in overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Bar Fixa de Palco */}
      <header className="h-16 px-4 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between gap-2 flex-shrink-0 pt-safe z-10 shadow-md">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          aria-label="Voltar"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>

        <div className="flex flex-col items-center justify-center min-w-0 flex-1 text-center">
          <div className="flex items-center gap-1.5">
            <h1 className="font-headline-md text-headline-md text-on-surface truncate font-black">
              {song.title}
            </h1>
            <span className="font-label-sm text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
              Ao Vivo
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {song.artist || 'Ministério de Louvor'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </header>

      {/* Conteúdo com Scroll */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 w-full max-w-md mx-auto overflow-y-auto p-4 pb-28 flex flex-col gap-3"
      >
        {/* Banner de Dados Musicais */}
        <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2.5 rounded-2xl text-center border border-outline-variant/20 shadow-inner">
          <div className="flex flex-col items-center justify-center">
            <span className="font-label-sm text-label-sm uppercase text-outline">Tom Igreja</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline-md text-headline-md text-primary font-black">
                {currentKey}
              </span>
              {semitones !== 0 && (
                <span className="font-label-sm text-outline line-through opacity-70">
                  {originalKey}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <span className="font-label-sm text-label-sm uppercase text-outline">BPM</span>
              <span 
                className={`w-2 h-2 rounded-full transition-all duration-100 ${
                  beatDot ? 'bg-primary scale-125' : 'bg-outline-variant scale-90'
                }`} 
              />
            </div>
            <span className="font-headline-md text-headline-md text-on-surface font-bold mt-0.5">
              {effectiveBpm}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="font-label-sm text-label-sm uppercase text-outline">Compasso</span>
            <span className="font-headline-md text-headline-md text-tertiary font-black mt-0.5">
              4/4
            </span>
          </div>
        </div>

        {/* Live Floating Control Tray */}
        <div className="bg-surface-container rounded-2xl p-3 shadow-md flex flex-col gap-2 border border-outline-variant/20">
          {/* Row 1: Transposição & Capo */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-surface-container-lowest rounded-xl p-1 flex-1 shadow-inner border border-outline-variant/20">
              <button
                onClick={() => setSemitones(s => s - 1)}
                className="h-9 px-3 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-90 transition-all font-label-md font-black"
                title="Diminuir Meio Tom"
              >
                -½
              </button>
              <div className="flex-1 text-center min-w-0 px-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">
                  Tom
                </span>
                <span className="font-label-lg text-label-lg text-primary font-black truncate block">
                  {currentKey} {semitones !== 0 && `(${semitones > 0 ? `+${semitones}` : semitones})`}
                </span>
              </div>
              <button
                onClick={() => setSemitones(s => s + 1)}
                className="h-9 px-3 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-90 transition-all font-label-md font-black"
                title="Aumentar Meio Tom"
              >
                +½
              </button>
            </div>

            {/* Capo */}
            <button
              onClick={() => setCapo(c => (c + 1) % 7)}
              className="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-surface-container-lowest text-on-surface shadow-inner border border-outline-variant/20 flex-shrink-0 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">straighten</span>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Capo</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {capo === 0 ? 'Sem Capo' : `Casa ${capo}`}
                </span>
              </div>
            </button>
          </div>

          {/* Row 2: Auto-Scroll Deck & Metronome */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/15">
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 flex-1 border border-outline-variant/20">
              <button
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`h-9 px-3 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm ${
                  isAutoScrolling 
                    ? 'bg-primary text-on-primary font-bold' 
                    : 'bg-primary-container text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isAutoScrolling ? 'pause' : 'play_arrow'}
                </span>
                <span className="font-label-md text-label-md uppercase font-bold">
                  {isAutoScrolling ? 'Pausar' : 'Rolar'}
                </span>
              </button>

              <div className="flex items-center gap-1 ml-auto">
                {[1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setScrollSpeed(speed)}
                    className={`h-8 px-2 rounded-lg font-label-md text-label-md transition-all ${
                      scrollSpeed === speed 
                        ? 'bg-surface-container-high text-primary font-bold shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className={`h-11 px-3 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all border border-outline-variant/20 ${
                isMetronomeActive ? 'bg-primary/20 text-primary' : 'bg-surface-container-lowest text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-primary">
                file_map_stack
              </span>
              <span className="font-label-md text-label-md font-bold">{effectiveBpm}</span>
            </button>
          </div>
        </div>

        {/* Musician Context */}
        {stageMembers.length > 0 && (
          <div className="bg-surface-container-low rounded-xl px-3 py-2 flex items-center justify-between border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {stageMembers.length} músicos escalados
              </span>
            </div>
            <span className="font-label-sm text-label-sm uppercase font-bold text-primary px-2 py-0.5 rounded-full bg-primary-container/20">
              Palco Ao Vivo
            </span>
          </div>
        )}

        {/* Cifra Monospaçada Formatada */}
        <div className="flex flex-col gap-3 mt-1">
          {renderSections()}
        </div>
      </main>

      {/* Footer Fixo: Navegação entre Músicas do Setlist */}
      {setlistSongs.length > 1 && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-high/95 backdrop-blur-xl px-4 py-2.5 pb-safe border-t border-outline-variant/30 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2">
            <button
              onClick={() => prevSong && onSelectSong?.(prevSong)}
              disabled={!prevSong}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-label-md font-bold transition-all ${
                prevSong 
                  ? 'bg-surface-container text-on-surface hover:bg-surface-variant active:scale-95' 
                  : 'opacity-40 text-on-surface-variant cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              <span>Anterior</span>
            </button>

            <span className="font-label-md text-label-md text-on-surface-variant">
              {currentIndex + 1} de {setlistSongs.length}
            </span>

            <button
              onClick={() => nextSong && onSelectSong?.(nextSong)}
              disabled={!nextSong}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-label-md font-bold transition-all ${
                nextSong 
                  ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 active:scale-95' 
                  : 'opacity-40 text-on-surface-variant cursor-not-allowed'
              }`}
            >
              <span>Próxima</span>
              <span className="material-symbols-outlined text-[18px]">skip_next</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

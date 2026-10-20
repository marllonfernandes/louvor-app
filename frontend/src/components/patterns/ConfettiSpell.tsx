import React, { useEffect, useState } from 'react';

interface ConfettiSpellProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  tx: string;
  ty: string;
  tr: string;
  color: string;
  shape: 'circle' | 'square' | 'star';
  size: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4'  // cyan
];

export const ConfettiSpell: React.FC<ConfettiSpellProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const generated: Particle[] = Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * 360 + (Math.random() * 20 - 10);
      const rad = (angle * Math.PI) / 180;
      const distance = 40 + Math.random() * 55;
      const tx = `${Math.cos(rad) * distance}px`;
      const ty = `${Math.sin(rad) * distance - 20}px`;
      const tr = `${Math.random() * 360 - 180}deg`;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = 5 + Math.random() * 5;

      return { id: i, tx, ty, tr, color, shape, size };
    });

    setParticles(generated);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-spell-particle"
          style={
            {
              '--tx': p.tx,
              '--ty': p.ty,
              '--tr': p.tr,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'square' ? '2px' : '30%'
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

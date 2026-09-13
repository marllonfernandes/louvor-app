import { Sparkles, Calendar, Music2, Heart, Zap, Star, LucideIcon } from 'lucide-react';
import { EventType } from '../types';

export interface EventTypeDefinition {
  id: EventType;
  label: string;
  pluralLabel: string;
  borderClass: string;
  badgeClass: string;
  activeClass: string;
  icon: LucideIcon;
  emoji: string;
}

export const EVENT_TYPES: Record<EventType, EventTypeDefinition> = {
  congresso: {
    id: 'congresso',
    label: 'Congresso',
    pluralLabel: 'Congressos',
    borderClass: 'border-l-purple-500',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    activeClass: 'bg-purple-600 text-white shadow-md border-purple-500/30',
    icon: Sparkles,
    emoji: '👑',
  },
  culto: {
    id: 'culto',
    label: 'Culto',
    pluralLabel: 'Cultos',
    borderClass: 'border-l-blue-500',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    activeClass: 'bg-blue-600 text-white shadow-md border-blue-500/30',
    icon: Calendar,
    emoji: '⛪',
  },
  ensaio: {
    id: 'ensaio',
    label: 'Ensaio',
    pluralLabel: 'Ensaios',
    borderClass: 'border-l-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    activeClass: 'bg-amber-600 text-white shadow-md border-amber-500/30',
    icon: Music2,
    emoji: '🎸',
  },
  ceia: {
    id: 'ceia',
    label: 'Santa Ceia',
    pluralLabel: 'Santa Ceia',
    borderClass: 'border-l-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    activeClass: 'bg-rose-600 text-white shadow-md border-rose-500/30',
    icon: Heart,
    emoji: '🍷',
  },
  jovens: {
    id: 'jovens',
    label: 'Jovens',
    pluralLabel: 'Jovens',
    borderClass: 'border-l-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    activeClass: 'bg-emerald-600 text-white shadow-md border-emerald-500/30',
    icon: Zap,
    emoji: '🔥',
  },
  especial: {
    id: 'especial',
    label: 'Especial',
    pluralLabel: 'Especiais',
    borderClass: 'border-l-yellow-500',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    activeClass: 'bg-yellow-600 text-white shadow-md border-yellow-500/30',
    icon: Star,
    emoji: '⭐',
  },
  outro: {
    id: 'outro',
    label: 'Outro',
    pluralLabel: 'Outros',
    borderClass: 'border-l-slate-600',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    activeClass: 'bg-slate-700 text-white shadow-md border-slate-600/30',
    icon: Calendar,
    emoji: '📌',
  },
};

export function getEventTypeDefinition(type?: EventType | string): EventTypeDefinition {
  if (type && type in EVENT_TYPES) {
    return EVENT_TYPES[type as EventType];
  }
  return EVENT_TYPES.outro;
}

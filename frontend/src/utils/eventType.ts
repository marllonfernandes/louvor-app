import { Sparkles, Calendar, Music2, Heart, Zap, Star, Droplets, LucideIcon } from 'lucide-react';
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
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/40',
    activeClass: 'bg-purple-600 text-white shadow-md border-purple-500/30',
    icon: Sparkles,
    emoji: '👑',
  },
  culto: {
    id: 'culto',
    label: 'Culto',
    pluralLabel: 'Cultos',
    borderClass: 'border-l-blue-500',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/40',
    activeClass: 'bg-blue-600 text-white shadow-md border-blue-500/30',
    icon: Calendar,
    emoji: '⛪',
  },
  ensaio: {
    id: 'ensaio',
    label: 'Ensaio',
    pluralLabel: 'Ensaios',
    borderClass: 'border-l-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40',
    activeClass: 'bg-amber-600 text-white shadow-md border-amber-500/30',
    icon: Music2,
    emoji: '🎸',
  },
  ceia: {
    id: 'ceia',
    label: 'Santa Ceia',
    pluralLabel: 'Santa Ceia',
    borderClass: 'border-l-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40',
    activeClass: 'bg-rose-600 text-white shadow-md border-rose-500/30',
    icon: Heart,
    emoji: '🍷',
  },
  batismo: {
    id: 'batismo',
    label: 'Batismo',
    pluralLabel: 'Batismos',
    borderClass: 'border-l-cyan-500',
    badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/40',
    activeClass: 'bg-cyan-600 text-white shadow-md border-cyan-500/30',
    icon: Droplets,
    emoji: '💧',
  },
  jovens: {
    id: 'jovens',
    label: 'Jovens',
    pluralLabel: 'Jovens',
    borderClass: 'border-l-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40',
    activeClass: 'bg-emerald-600 text-white shadow-md border-emerald-500/30',
    icon: Zap,
    emoji: '🔥',
  },
  especial: {
    id: 'especial',
    label: 'Especial',
    pluralLabel: 'Especiais',
    borderClass: 'border-l-yellow-500',
    badgeClass: 'bg-yellow-500/20 text-amber-800 dark:text-yellow-300 border-yellow-500/40',
    activeClass: 'bg-yellow-600 text-white shadow-md border-yellow-500/30',
    icon: Star,
    emoji: '⭐',
  },
  outro: {
    id: 'outro',
    label: 'Outro',
    pluralLabel: 'Outros',
    borderClass: 'border-l-slate-600',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
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

export interface EventCalendarBadge {
  icon: string;
  label: string;
  colorClass: string;
}

export function getEventCalendarBadge(event: { title?: string; type?: string; team?: string }): EventCalendarBadge {
  const title = (event.title || '').toLowerCase();
  const type = (event.type || '').toLowerCase();
  const team = (event.team || '').toLowerCase();

  // 1. Ensaio
  if (type === 'ensaio' || title.includes('ensaio')) {
    return {
      icon: 'headphones',
      label: 'Ensaio',
      colorClass: 'text-amber-500'
    };
  }

  // 2. Santa Ceia
  if (type === 'ceia' || title.includes('ceia')) {
    return {
      icon: 'wine_bar',
      label: 'Ceia',
      colorClass: 'text-rose-500'
    };
  }

  // 3. Culto com a Família
  if (title.includes('família') || title.includes('familia')) {
    return {
      icon: 'diversity_3',
      label: 'Família',
      colorClass: 'text-blue-500'
    };
  }

  // 4. Culto de Jovens / Adolescentes
  if (type === 'jovens' || title.includes('jovens') || title.includes('mocidade') || team.includes('jovens')) {
    return {
      icon: 'local_fire_department',
      label: 'Jovens',
      colorClass: 'text-emerald-500'
    };
  }

  // 5. Congresso / Festividade
  if (type === 'congresso' || title.includes('congresso') || title.includes('aniversário') || title.includes('aniversario')) {
    return {
      icon: 'celebration',
      label: 'Congresso',
      colorClass: 'text-purple-500'
    };
  }

  // 6. Batismo
  if (type === 'batismo' || title.includes('batismo')) {
    return {
      icon: 'water_drop',
      label: 'Batismo',
      colorClass: 'text-cyan-500'
    };
  }

  // 7. Culto de Departamento (Varões, Mulheres, Círculo de Oração, Infantil)
  if (
    title.includes('departamento') ||
    title.includes('varões') ||
    title.includes('varoes') ||
    title.includes('mulheres') ||
    title.includes('irmãs') ||
    title.includes('irmas') ||
    title.includes('círculo') ||
    title.includes('circulo') ||
    title.includes('infantil') ||
    title.includes('crianças')
  ) {
    return {
      icon: 'groups',
      label: 'Departamento',
      colorClass: 'text-indigo-500'
    };
  }

  // 8. Padrão: Culto Geral / Celebração
  return {
    icon: 'church',
    label: 'Culto',
    colorClass: 'text-primary'
  };
}

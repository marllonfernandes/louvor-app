import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-xl ${className}`}
    />
  );
};

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="h-7 w-20 rounded-xl" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
    </div>
  );
};

export const SongCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3 shadow-sm space-y-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
    </div>
  );
};

export const MemberCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
      </div>
    </div>
  );
};

export const AppLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto shadow-2xl relative">
      {/* Header Skeleton */}
      <div className="p-4 pt-6 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Top Segmented Control Skeleton */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-2xl">
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
        </div>

        {/* Search bar skeleton */}
        <Skeleton className="h-10 rounded-2xl" />

        {/* Cards */}
        <div className="space-y-3 pt-1">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
};

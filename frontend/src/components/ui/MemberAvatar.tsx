import React, { useState, useEffect } from 'react';
import { getAvatarGradient, getInitials, isValidAvatarUrl } from '../../utils/avatar';

export interface MemberAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'rounded-full' | 'rounded-xl' | 'rounded-2xl';
  isLeader?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<MemberAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-xl'
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  shape = 'rounded-2xl',
  isLeader = false,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const canShowImage = isValidAvatarUrl(avatarUrl) && !imgError;
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(name);

  if (canShowImage) {
    return (
      <img
        src={avatarUrl!.trim()}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClass} ${shape} object-cover flex-shrink-0 shadow-sm bg-slate-900 ${
          isLeader
            ? 'border-2 border-amber-400/80 ring-2 ring-amber-500/20'
            : 'border border-white/25 dark:border-slate-700'
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${shape} font-black flex items-center justify-center flex-shrink-0 shadow-md select-none ${
        isLeader
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border border-amber-300/60'
          : `bg-gradient-to-br ${getAvatarGradient(name)} text-white border border-white/20`
      } ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

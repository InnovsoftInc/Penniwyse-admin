import { Award } from 'lucide-react';
import { useMemo } from 'react';

interface BadgeIconProps {
  icon?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
};

export function BadgeIcon({ icon, className = '', size = 'md' }: BadgeIconProps) {
  const isSvg = useMemo(() => {
    if (!icon) return false;
    const trimmed = icon.trim();
    return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
  }, [icon]);

  const isEmoji = useMemo(() => {
    if (!icon || isSvg) return false;
    // Check if it's likely an emoji (single character or short string)
    return icon.length <= 4 && /[\p{Emoji}]/u.test(icon);
  }, [icon, isSvg]);

  if (!icon) {
    return <Award className={`${sizeClasses[size]} ${className}`} />;
  }

  if (isSvg) {
    // Render SVG string as HTML
    return (
      <div
        className={`${sizeClasses[size]} ${className} flex items-center justify-center`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  if (isEmoji) {
    // Render as emoji text
    return (
      <span className={`${sizeClasses[size]} ${className} flex items-center justify-center text-2xl`}>
        {icon}
      </span>
    );
  }

  // Fallback: render as text (could be icon name or other format)
  return (
    <span className={`${sizeClasses[size]} ${className} flex items-center justify-center text-xs`}>
      {icon}
    </span>
  );
}


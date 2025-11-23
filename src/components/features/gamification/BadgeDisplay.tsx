import { cn } from '../../../utils/cn';
import type { Badge } from '../../../types/gamification.types';
import { BadgeIcon } from './BadgeIcon';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function BadgeDisplay({ badge, size = 'md', showName = true }: BadgeDisplayProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        'rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-2 flex items-center justify-center shadow-lg',
        sizes[size]
      )}>
        <BadgeIcon icon={badge.icon} size={size} className="text-white" />
      </div>
      {showName && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">{badge.name}</p>
          {badge.earnedAt && (
            <p className="text-xs text-gray-500">
              {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}


import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { UserProgress } from '../../../types/gamification.types';

interface XPProgressProps {
  progress: UserProgress;
  showLevel?: boolean;
}

export function XPProgress({ progress, showLevel = true }: XPProgressProps) {
  // Handle undefined/null values
  if (!progress) {
    return (
      <div className="text-center text-gray-500 py-4">
        No progress data available
      </div>
    );
  }

  // Calculate XP needed for next level (simplified - you may want to adjust this)
  const level = progress.level ?? 0;
  const xp = progress.xp ?? 0;
  const xpForCurrentLevel = level * 1000;
  const xpForNextLevel = (level + 1) * 1000;
  const xpProgress = Math.max(0, xp - xpForCurrentLevel);
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeeded > 0 ? (xpProgress / xpNeeded) * 100 : 0;
  
  // Use completionPercentage if available, otherwise calculate it
  const completionPercentage = progress.completionPercentage ?? progressPercentage;

  return (
    <div className="space-y-4">
      {showLevel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-lg font-semibold text-gray-900">Level {level}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>{completionPercentage.toFixed(1)}% Complete</span>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{xp.toLocaleString()} XP</span>
          <span>{xpForNextLevel.toLocaleString()} XP for Level {level + 1}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(Math.max(0, progressPercentage), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}


import { Trophy, Clock, CheckCircle, Lock } from 'lucide-react';
import { Button } from '../../ui';
import { cn } from '../../../utils/cn';
import type { Quest } from '../../../types/gamification.types';

interface QuestCardProps {
  quest: Quest;
  onStart?: (questId: number) => void;
  onComplete?: (questId: number) => void;
}

export function QuestCard({ quest, onStart, onComplete }: QuestCardProps) {
  const getStatusIcon = () => {
    switch (quest.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Trophy className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (quest.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'locked':
        return 'border-gray-200 bg-gray-50 opacity-60';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className={cn('border rounded-lg p-4', getStatusColor())}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-gray-900">{quest.name}</h3>
        </div>
        <span className={cn(
          'text-xs px-2 py-1 rounded',
          quest.type === 'daily' ? 'bg-blue-100 text-blue-700' :
          quest.type === 'weekly' ? 'bg-purple-100 text-purple-700' :
          quest.type === 'monthly' ? 'bg-pink-100 text-pink-700' :
          'bg-gray-100 text-gray-700'
        )}>
          {quest.type}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">{quest.description}</p>

      {quest.status === 'in_progress' && quest.progress !== undefined && quest.target !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{quest.progress} / {quest.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(quest.progress / quest.target) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Trophy className="w-4 h-4" />
          <span>{quest.xpReward} XP</span>
        </div>
        <div className="flex gap-2">
          {quest.status === 'available' && onStart && (
            <Button size="sm" onClick={() => onStart(quest.id)}>
              Start
            </Button>
          )}
          {quest.status === 'in_progress' && onComplete && (
            <Button size="sm" onClick={() => onComplete(quest.id)}>
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


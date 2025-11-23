import { useState } from 'react';
import type { ReactNode } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  activeFilterCount?: number;
  className?: string;
}

export function FilterBar({ children, onClear, activeFilterCount = 0, className }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(activeFilterCount > 0);

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {children}
        </div>
      )}
    </div>
  );
}


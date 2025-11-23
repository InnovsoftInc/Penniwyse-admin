import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { CategoryTree as CategoryTreeType } from '../../../types/category.types';

interface CategoryTreeProps {
  categories: CategoryTreeType[];
  onSelect?: (category: CategoryTreeType) => void;
  onEdit?: (category: CategoryTreeType) => void;
  onDelete?: (category: CategoryTreeType) => void;
  selectedId?: number;
}

export function CategoryTree({
  categories,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
}: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderCategory = (category: CategoryTreeType, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded.has(category.id);
    const isSelected = selectedId === category.id;

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer',
            isSelected && 'bg-primary-50'
          )}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-gray-400" />
              ) : (
                <Folder className="w-4 h-4 text-gray-400" />
              )
            ) : null}
            <span
              className="flex-1"
              onClick={() => onSelect?.(category)}
            >
              {category.name}
            </span>
            <span className={cn(
              'text-xs px-2 py-1 rounded',
              category.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {category.type}
            </span>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No categories found</p>
      ) : (
        categories.map((category) => renderCategory(category))
      )}
    </div>
  );
}


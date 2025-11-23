import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button, Checkbox } from '../../ui';
import type { CreateQuestDto, UpdateQuestDto, Quest } from '../../../types/gamification.types';

const questSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['daily', 'weekly', 'monthly', 'achievement']),
  xpReward: z.number().min(0, 'XP reward must be 0 or greater'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with hyphens or underscores'),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  requirements: z.string().optional(),
});

type QuestFormData = CreateQuestDto | UpdateQuestDto;

interface QuestFormProps {
  onSubmit: (data: QuestFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Quest>;
  isLoading?: boolean;
}

export function QuestForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: QuestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'daily',
      xpReward: initialData?.xpReward || 0,
      slug: initialData?.slug || '',
      category: initialData?.category || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      requirements: typeof initialData?.requirements === 'string' 
        ? initialData.requirements 
        : initialData?.requirements 
          ? JSON.stringify(initialData.requirements, null, 2)
          : '',
    },
  });

  const requirementsValue = watch('requirements');

  const onFormSubmit = async (data: QuestFormData) => {
    // Parse requirements if it's a JSON string
    if (data.requirements && typeof data.requirements === 'string' && data.requirements.trim()) {
      try {
        data.requirements = JSON.parse(data.requirements);
      } catch {
        // If parsing fails, keep as string
      }
    } else if (!data.requirements) {
      delete data.requirements;
    }
    
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Input
        label="Quest Name"
        {...register('name')}
        error={errors.name?.message}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <Select
        label="Quest Type"
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'achievement', label: 'Achievement' },
        ]}
        {...register('type')}
        error={errors.type?.message}
        required
      />

      <Input
        label="XP Reward"
        type="number"
        min="0"
        step="1"
        {...register('xpReward', { valueAsNumber: true })}
        error={errors.xpReward?.message}
        required
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Badge Assignment</p>
        <p>Badges are linked to quests via <strong>Quest Rules</strong> in the Configuration tab, not directly on the quest. Use the badge <strong>key</strong> (not ID) when creating quest rules.</p>
      </div>

      <Input
        label="Slug"
        placeholder="quest-name-slug"
        {...register('slug')}
        error={errors.slug?.message}
        required
        helperText="URL-friendly identifier (lowercase, alphanumeric, hyphens/underscores)"
      />

      <Input
        label="Category"
        placeholder="Achievements"
        {...register('category')}
        error={errors.category?.message}
        helperText="Optional category for grouping quests"
      />

      <Checkbox
        label="Active"
        {...register('isActive')}
        defaultChecked={initialData?.isActive !== undefined ? initialData.isActive : true}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Requirements (JSON, optional)
        </label>
        <textarea
          {...register('requirements')}
          rows={6}
          placeholder='{"minLevel": 5, "completedQuests": [1, 2]}'
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm ${
            errors.requirements ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        />
        {errors.requirements && (
          <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enter valid JSON or leave empty. This defines quest prerequisites.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Quest' : 'Create Quest'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Maximize2 } from 'lucide-react';
import { Input, Button, Modal } from '../../ui';
import { BadgeIcon } from './BadgeIcon';
import type { CreateBadgeDto, UpdateBadgeDto, Badge } from '../../../types/gamification.types';

const badgeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_-]+$/, 'Key must be lowercase alphanumeric with underscores or hyphens'),
  category: z.string().optional(),
  slug: z.string().optional().refine(
    (val) => !val || /^[a-z0-9_-]+$/.test(val),
    { message: 'Slug must be lowercase alphanumeric with underscores or hyphens' }
  ),
});

type BadgeFormData = CreateBadgeDto | UpdateBadgeDto;

interface BadgeFormProps {
  onSubmit: (data: BadgeFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Badge>;
  isLoading?: boolean;
}

export function BadgeForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: BadgeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '',
      key: initialData?.key || '',
      category: initialData?.category || '',
      slug: initialData?.slug || '',
    },
  });

  const iconValue = watch('icon');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Badge Name"
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
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Input
          label="Icon"
          placeholder="🏆, SVG string, or icon name"
          {...register('icon')}
          error={errors.icon?.message}
          helperText="Emoji, SVG string (e.g., &lt;svg&gt;...&lt;/svg&gt;), or icon identifier"
        />
        
        {/* Icon Preview */}
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Icon Preview</label>
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              title="Click to enlarge preview"
            >
              <Maximize2 className="w-3 h-3" />
              Enlarge
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md hover:shadow-lg transition-shadow cursor-pointer group relative"
              title="Click to enlarge preview"
            >
              <BadgeIcon icon={iconValue} size="md" className="text-white" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">
                {iconValue ? (
                  <>
                    {iconValue.trim().startsWith('<svg') || iconValue.trim().startsWith('<?xml') ? (
                      <span className="text-green-600">✓ SVG detected - will render as graphic</span>
                    ) : /[\p{Emoji}]/u.test(iconValue) ? (
                      <span className="text-blue-600">✓ Emoji detected</span>
                    ) : (
                      <span className="text-gray-600">Text/Icon name</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">No icon - default icon will be shown</span>
                )}
              </p>
              {iconValue && (iconValue.trim().startsWith('<svg') || iconValue.trim().startsWith('<?xml')) && (
                <p className="text-xs text-gray-500 mt-1">
                  SVG preview: The icon will be rendered as an SVG graphic in the badge display.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Input
        label="Key"
        placeholder="first_transaction"
        {...register('key')}
        error={errors.key?.message}
        required
        helperText="Unique identifier (lowercase, alphanumeric, underscores/hyphens only)"
      />

      <Input
        label="Category"
        placeholder="Achievements"
        {...register('category')}
        error={errors.category?.message}
        helperText="Optional category for grouping badges"
      />

      {!initialData?.id && (
        <Input
          label="Slug"
          placeholder="badge-name-slug"
          {...register('slug')}
          error={errors.slug?.message}
          helperText="URL-friendly identifier (lowercase, alphanumeric, underscores/hyphens only). Not editable after creation."
        />
      )}
      {initialData?.id && initialData?.slug && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Read-only)</label>
          <Input
            value={initialData.slug}
            disabled
            helperText="Slug is auto-generated from key and cannot be changed after creation"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Badge' : 'Create Badge'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>

    {/* Enlarged Preview Modal */}
    <Modal
      isOpen={isPreviewModalOpen}
      onClose={() => setIsPreviewModalOpen(false)}
      title="Icon Preview"
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
            <BadgeIcon icon={iconValue} size="2xl" className="text-white" />
          </div>
          <p className="text-sm text-gray-600 text-center">
            {iconValue ? (
              <>
                {iconValue.trim().startsWith('<svg') || iconValue.trim().startsWith('<?xml') ? (
                  <span className="text-green-600 font-medium">✓ SVG detected - will render as graphic</span>
                ) : /[\p{Emoji}]/u.test(iconValue) ? (
                  <span className="text-blue-600 font-medium">✓ Emoji detected</span>
                ) : (
                  <span className="text-gray-600">Text/Icon name</span>
                )}
              </>
            ) : (
              <span className="text-gray-400">No icon - default icon will be shown</span>
            )}
          </p>
        </div>
        
        {iconValue && (iconValue.trim().startsWith('<svg') || iconValue.trim().startsWith('<?xml')) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">SVG Code Preview</label>
            <div className="bg-gray-900 rounded p-3 max-h-48 overflow-auto">
              <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono">
                {iconValue}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
    </>
  );
}


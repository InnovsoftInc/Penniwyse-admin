import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, Select } from '../../ui';
import type { CreateFaqDto, UpdateFaqDto, Faq } from '../../../types/faq.types';

const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  category: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  tags: z.string().optional(), // Stored as comma-separated string, converted to array
});

// Form data type matches the schema (tags as string)
type FaqFormData = {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  tags?: string; // Comma-separated string in form
};

interface FaqFormProps {
  onSubmit: (data: CreateFaqDto | UpdateFaqDto) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Faq>;
  isLoading?: boolean;
}

const faqCategories = [
  { value: 'tax', label: 'Tax' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'general', label: 'General' },
  { value: 'support', label: 'Support' },
  { value: 'features', label: 'Features' },
  { value: 'payments', label: 'Payments' },
  { value: 'other', label: 'Other' },
];

export function FaqForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: FaqFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: initialData?.question || '',
      answer: initialData?.answer || '',
      category: initialData?.category || '',
      order: initialData?.order ?? 0,
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      tags: (Array.isArray(initialData?.tags) && initialData.tags.length > 0)
        ? initialData.tags.join(', ')
        : '',
    },
  });

  const isActive = watch('isActive');

  const handleFormSubmit = async (data: FaqFormData) => {
    // Convert tags string to array for DTO
    const processedData: CreateFaqDto | UpdateFaqDto = {
      ...data,
      tags: data.tags
        ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : undefined,
    };
    await onSubmit(processedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('question')}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.question ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter the FAQ question..."
        />
        {errors.question && (
          <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
        )}
        {!errors.question && (
          <p className="mt-1 text-xs text-gray-500">
            The question that users will see
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('answer')}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.answer ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter the detailed answer..."
        />
        {errors.answer && (
          <p className="mt-1 text-sm text-red-600">{errors.answer.message}</p>
        )}
        {!errors.answer && (
          <p className="mt-1 text-xs text-gray-500">
            The detailed answer to the question
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            {...register('category')}
            error={errors.category?.message}
            placeholder="Select a category"
            options={[
              { value: '', label: 'Select a category' },
              ...faqCategories,
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Order
          </label>
          <Input
            type="number"
            {...register('order', { valueAsNumber: true })}
            error={errors.order?.message}
            placeholder="0"
            helperText="Lower numbers appear first"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <Input
          {...register('tags')}
          error={errors.tags?.message}
          placeholder="tax, calculation, liability"
          helperText="Comma-separated tags for categorization and search"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isActive')}
            checked={isActive}
            onChange={(e) => setValue('isActive', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Only active FAQs will be visible to users
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update FAQ' : 'Create FAQ'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


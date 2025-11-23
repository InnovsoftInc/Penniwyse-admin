import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button, Checkbox } from '../../ui';
import type { CreateCategoryDto, UpdateCategoryDto } from '../../../types/category.types';
import type { Category } from '../../../types/category.types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  taxable: z.boolean().optional(),
  parentCategoryId: z.number().nullable().optional(),
  keywords: z.array(z.string()).optional(),
});

interface CategoryFormProps {
  onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateCategoryDto>;
  parentCategories?: Category[];
  isLoading?: boolean;
}

export function CategoryForm({
  onSubmit,
  onCancel,
  initialData,
  parentCategories = [],
  isLoading = false,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      taxable: true,
      ...initialData,
    },
  });

  const type = watch('type');
  const filteredParents = parentCategories.filter((cat) => !type || cat.type === type);

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof CreateCategoryDto, value);
      });
    }
  }, [initialData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Category Name"
        {...register('name')}
        error={errors.name?.message}
      />

      <Select
        label="Type"
        options={[
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' },
        ]}
        {...register('type')}
        error={errors.type?.message}
      />

      {filteredParents.length > 0 && (
        <Select
          label="Parent Category (optional)"
          options={[
            { value: '', label: 'None (Top Level)' },
            ...filteredParents.map((cat) => ({
              value: cat.id.toString(),
              label: cat.name,
            })),
          ]}
          {...register('parentCategoryId', {
            setValueAs: (v) => (v === '' ? null : Number(v)),
          })}
          error={errors.parentCategoryId?.message}
        />
      )}

      <Checkbox
        label="Taxable"
        {...register('taxable')}
      />

      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


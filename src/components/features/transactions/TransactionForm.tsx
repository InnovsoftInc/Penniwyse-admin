import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, DatePicker, Button } from '../../ui';
import type { CreateTransactionDto, UpdateTransactionDto } from '../../../types/transaction.types';
import type { Category } from '../../../types/category.types';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  type: z.enum(['income', 'expense', 'savings', 'investment']),
  merchant: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  taxable: z.boolean().optional(),
  hasReceipt: z.boolean().optional(),
});

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionDto | UpdateTransactionDto) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateTransactionDto>;
  categories?: Category[];
  isLoading?: boolean;
}

export function TransactionForm({
  onSubmit,
  onCancel,
  initialData,
  categories = [],
  isLoading = false,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTransactionDto>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData,
  });

  const type = watch('type');

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof CreateTransactionDto, value);
      });
    }
  }, [initialData, setValue]);

  const filteredCategories = categories.filter(
    (cat) => !type || cat.type === type || type === 'savings' || type === 'investment'
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />
        <Select
          label="Type"
          options={[
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
            { value: 'savings', label: 'Savings' },
            { value: 'investment', label: 'Investment' },
          ]}
          {...register('type')}
          error={errors.type?.message}
        />
      </div>

      <DatePicker
        label="Date"
        {...register('date')}
        error={errors.date?.message}
      />

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
      />

      <Input
        label="Title"
        {...register('title')}
        error={errors.title?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Merchant"
          {...register('merchant')}
          error={errors.merchant?.message}
        />
        <Input
          label="Location"
          {...register('location')}
          error={errors.location?.message}
        />
      </div>

      {filteredCategories.length > 0 && (
        <Select
          label="Category"
          options={[
            { value: '', label: 'Select a category' },
            ...filteredCategories.map((cat) => ({
              value: cat.id.toString(),
              label: cat.name,
            })),
          ]}
          {...register('categoryId', { valueAsNumber: true })}
          error={errors.categoryId?.message}
        />
      )}

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


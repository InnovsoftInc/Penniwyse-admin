import { Input, Select, DatePicker, FilterBar } from '../../ui';
import type { TransactionQueryParams } from '../../../types/transaction.types';
import type { Category } from '../../../types/category.types';

interface TransactionFiltersProps {
  filters: TransactionQueryParams;
  onFilterChange: (filters: TransactionQueryParams) => void;
  categories?: Category[];
}

export function TransactionFilters({ filters, onFilterChange, categories = [] }: TransactionFiltersProps) {
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const handleChange = (key: keyof TransactionQueryParams, value: unknown) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <FilterBar onClear={handleClear} activeFilterCount={activeFilterCount}>
      <Input
        label="Search"
        placeholder="Search transactions..."
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
      />
      <Select
        label="Type"
        options={[
          { value: '', label: 'All Types' },
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' },
          { value: 'savings', label: 'Savings' },
          { value: 'investment', label: 'Investment' },
        ]}
        value={filters.type || ''}
        onChange={(e) => handleChange('type', e.target.value || undefined)}
      />
      {categories.length > 0 && (
        <Select
          label="Category"
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((cat) => ({
              value: cat.id.toString(),
              label: cat.name,
            })),
          ]}
          value={filters.categoryId?.toString() || ''}
          onChange={(e) => handleChange('categoryId', e.target.value ? Number(e.target.value) : undefined)}
        />
      )}
      <DatePicker
        label="Start Date"
        value={filters.startDate || ''}
        onChange={(e) => handleChange('startDate', e.target.value || undefined)}
      />
      <DatePicker
        label="End Date"
        value={filters.endDate || ''}
        onChange={(e) => handleChange('endDate', e.target.value || undefined)}
      />
    </FilterBar>
  );
}


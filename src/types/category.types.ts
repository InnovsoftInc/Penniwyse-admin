export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  taxable: boolean;
  parentCategoryId?: number | null;
  parentCategory?: Category | null;
  childCategories?: Category[];
  keywords?: string[];
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  taxable?: boolean;
  parentCategoryId?: number | null;
  keywords?: string[];
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CategoryQueryParams {
  type?: 'income' | 'expense';
}


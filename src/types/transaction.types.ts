import type { Category } from './category.types';

export interface Transaction {
  id: number;
  userId: number;
  amount: string;
  currency: string;
  date: string;
  description?: string;
  title?: string;
  merchant?: string;
  location?: string;
  categoryId?: number;
  category?: Category;
  type: 'income' | 'expense' | 'savings' | 'investment';
  source: 'manual' | 'bank' | 'ocr';
  taxable?: boolean;
  hasReceipt?: boolean;
  integrationId?: number | null;
  financialAccountId?: number | null;
  incomeSourceId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface TransactionSummaryResponse {
  summary: TransactionSummary;
  categoryBreakdown: Record<string, { count: number; total: number }>;
  typeBreakdown: {
    income?: { count: number; total: number };
    expense?: { count: number; total: number };
    savings?: { count: number; total: number };
    investment?: { count: number; total: number };
  };
  transactions: Transaction[];
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  type?: 'income' | 'expense' | 'savings' | 'investment';
  startDate?: string;
  endDate?: string;
  source?: 'manual' | 'bank' | 'ocr';
  search?: string;
  taxable?: boolean;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  merchant?: string;
  hasReceipt?: boolean;
  sortBy?: 'date' | 'amount' | 'createdAt' | 'title' | 'merchant';
  sortOrder?: 'asc' | 'desc';
  missingInfoType?: 'category' | 'merchant' | 'description' | 'receipt' | 'all';
}

export interface CreateTransactionDto {
  amount: number;
  date: string;
  description?: string;
  categoryId?: number;
  type: 'income' | 'expense' | 'savings' | 'investment';
  merchant?: string;
  title?: string;
  location?: string;
  taxable?: boolean;
  hasReceipt?: boolean;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {
  categoryId?: number;
  categoryName?: string;
  description?: string;
  merchant?: string;
  title?: string;
  location?: string;
}

export interface BulkUpdateTransactionDto {
  transactions: Array<{
    id: number;
    categoryId?: number;
    categoryName?: string;
    description?: string;
    merchant?: string;
    title?: string;
    location?: string;
  }>;
}

export interface BulkUpdateResponse {
  success: number;
  failed: number;
  results: Transaction[];
  errors: Array<{ id: number; error: string }>;
}

export interface TopExpense {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AccountSummary {
  accountId: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CardSummary {
  cardId: number;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface MissingInfoQueryParams {
  userId?: number;
  missingCategory?: boolean;
  missingDescription?: boolean;
  missingMerchant?: boolean;
  missingType?: boolean;
  pendingCategorization?: boolean;
  page?: number;
  limit?: number;
}

export interface BatchCategorizeRequest {
  transactionIds: number[];
}

export interface BatchCategorizeResponse {
  success: boolean;
  processed: number;
  transactions: Transaction[];
  errors?: Array<{ transactionId: number; error: string }>;
}


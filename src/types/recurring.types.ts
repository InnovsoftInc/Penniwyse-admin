export interface RecurringTransaction {
  id: number;
  userId: number;
  merchant?: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextExpectedDate: string;
  isBill?: boolean;
  isActive: boolean;
  billCategory?: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPattern {
  id: number;
  userId: number;
  merchant?: string;
  description?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  confidence: number;
  lastSeen: string;
  transactionCount: number;
}

export interface RecurringAnalysis {
  patterns: RecurringPattern[];
  recurringTransactions: RecurringTransaction[];
  summary: {
    totalPatterns: number;
    totalRecurring: number;
    billsCount: number;
    activeCount: number;
  };
}

export interface RecurringAnalysisQueryParams {
  groupBy?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  days?: number;
  minConfidence?: number;
}

export interface RecurringPrediction {
  recurringTransactionId: number;
  merchant?: string;
  description?: string;
  amount: number;
  expectedDate: string;
  confidence: number;
}

export interface Debt {
  id: number;
  type: 'bill' | 'credit_account';
  name: string;
  amount: number;
  dueDate?: string;
  frequency?: string;
  isActive: boolean;
}

export interface UpcomingPayment {
  debtId: number;
  type: 'bill' | 'credit_account';
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export interface RecurringTransactionsQueryParams {
  userId: number;
  isBill?: boolean;
  isActive?: boolean;
  billCategory?: string;
  frequency?: string;
}

export interface RecurringPatternsQueryParams {
  userId: number;
  limit?: number;
}


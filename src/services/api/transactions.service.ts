import { apiClient } from '../apiClient';
import { adminApiClient } from '../adminApiClient';
import type {
  Transaction,
  TransactionQueryParams,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionSummaryResponse,
  TopExpense,
  AccountSummary,
  CardSummary,
  MissingInfoQueryParams,
  BatchCategorizeRequest,
  BatchCategorizeResponse,
} from '../../types/transaction.types';
import type { PaginatedResponseAlt, PaginatedResponse } from '../../types/api.types';

class TransactionsService {
  async getTransactions(params?: TransactionQueryParams): Promise<PaginatedResponseAlt<Transaction> | Transaction[] | PaginatedResponse<Transaction>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<Transaction> | Transaction[] | PaginatedResponse<Transaction>>(
      '/api/transactions',
      { params }
    );
    return response.data;
  }

  async getTransactionById(id: number): Promise<Transaction> {
    const response = await apiClient.getClient().get<Transaction>(`/api/transactions/${id}`);
    return response.data;
  }

  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await apiClient.getClient().post<Transaction>('/api/transactions', data);
    return response.data;
  }

  async updateTransaction(id: number, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await apiClient.getClient().put<Transaction>(`/api/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: number): Promise<void> {
    await apiClient.getClient().delete(`/api/transactions/${id}`);
  }

  async getUncategorizedTransactions(params?: TransactionQueryParams): Promise<Transaction[]> {
    const response = await apiClient.getClient().get<Transaction[]>('/api/transactions/uncategorized', { params });
    return response.data;
  }

  async getTransactionSummary(params?: { startDate?: string; endDate?: string; type?: string }): Promise<TransactionSummaryResponse> {
    const response = await apiClient.getClient().get<TransactionSummaryResponse>('/api/transactions/summary', { params });
    return response.data;
  }

  async getTopExpenses(params?: { limit?: number; startDate?: string; endDate?: string }): Promise<TopExpense[]> {
    const response = await apiClient.getClient().get<TopExpense[]>('/api/transactions/top-expenses', { params });
    return response.data;
  }

  async getAccountSummary(accountId: number): Promise<AccountSummary> {
    const response = await apiClient.getClient().get<AccountSummary>(`/api/transactions/account/${accountId}/summary`);
    return response.data;
  }

  async getCardSummary(cardId: number): Promise<CardSummary> {
    const response = await apiClient.getClient().get<CardSummary>(`/api/transactions/card/${cardId}/summary`);
    return response.data;
  }

  // Admin endpoints
  async getTransactionsWithMissingInfo(params?: MissingInfoQueryParams): Promise<PaginatedResponseAlt<Transaction> | Transaction[] | PaginatedResponse<Transaction>> {
    const response = await adminApiClient.getClient().get<PaginatedResponseAlt<Transaction> | Transaction[] | PaginatedResponse<Transaction>>(
      '/api/admin/transactions/missing-info',
      { params }
    );
    return response.data;
  }

  async batchCategorizeTransactions(data: BatchCategorizeRequest): Promise<BatchCategorizeResponse> {
    const response = await adminApiClient.getClient().post<BatchCategorizeResponse>(
      '/api/admin/transactions/batch-categorize',
      data
    );
    return response.data;
  }
}

export const transactionsService = new TransactionsService();


import { apiClient } from '../apiClient';
import type {
  RecurringAnalysis,
  RecurringAnalysisQueryParams,
  RecurringPattern,
  RecurringPrediction,
} from '../../types/recurring.types';

class RecurringTransactionsService {
  async analyzeRecurringTransactions(params?: RecurringAnalysisQueryParams): Promise<RecurringAnalysis> {
    const response = await apiClient.getClient().get<RecurringAnalysis>('/api/recurring-transactions/analyze', { params });
    return response.data;
  }

  async getRecurringPatterns(): Promise<RecurringPattern[]> {
    const response = await apiClient.getClient().get<RecurringPattern[]>('/api/recurring-transactions/patterns');
    return response.data;
  }

  async refreshRecurringAnalysis(): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/api/recurring-transactions/refresh');
    return response.data;
  }

  async getRecurringPredictions(): Promise<RecurringPrediction[]> {
    const response = await apiClient.getClient().get<RecurringPrediction[]>('/api/recurring-transactions/predictions');
    return response.data;
  }
}

export const recurringTransactionsService = new RecurringTransactionsService();


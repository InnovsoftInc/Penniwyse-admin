import { apiClient } from '../apiClient';
import type { TransactionSummaryResponse, AccountSummary, CardSummary } from '../../types/transaction.types';

class InsightsService {
  async getTransactionSummary(params?: { startDate?: string; endDate?: string; type?: string }): Promise<TransactionSummaryResponse> {
    const response = await apiClient.getClient().get<TransactionSummaryResponse>('/api/transactions/summary', { params });
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
}

export const insightsService = new InsightsService();


import { apiClient } from '../apiClient';

interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

interface PlaidAccountsResponse {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance?: number;
  }>;
}

interface PlaidStatusResponse {
  connected: boolean;
  itemId?: string;
  lastSync?: string;
}

class PlaidService {
  async generateLinkToken(): Promise<PlaidLinkTokenResponse> {
    const response = await apiClient.getClient().post<PlaidLinkTokenResponse>('/api/integrations/plaid/link');
    return response.data;
  }

  async handleCallback(publicToken: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/api/integrations/plaid/callback', {
      publicToken,
    });
    return response.data;
  }

  async getAccounts(): Promise<PlaidAccountsResponse> {
    const response = await apiClient.getClient().get<PlaidAccountsResponse>('/api/integrations/plaid/accounts');
    return response.data;
  }

  async getStatus(): Promise<PlaidStatusResponse> {
    const response = await apiClient.getClient().get<PlaidStatusResponse>('/api/integrations/plaid/status');
    return response.data;
  }

  async sync(): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/api/integrations/plaid/sync');
    return response.data;
  }

  async disconnect(): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/api/integrations/plaid/disconnect');
    return response.data;
  }
}

export const plaidService = new PlaidService();


import { apiClient } from '../apiClient';
import { aiApiClient } from '../aiApiClient';
import type { DashboardData, DashboardQueryParams, SystemHealth, AiServiceHealth } from '../../types/dashboard.types';

class DashboardService {
  // Frontend endpoints
  async getDashboardData(params?: DashboardQueryParams): Promise<DashboardData> {
    const response = await apiClient.getClient().get<DashboardData>('/api/dashboard', { params });
    return response.data;
  }

  // Admin endpoints (using JWT auth)
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.getClient().get<SystemHealth>('/api/admin/health');
    return response.data;
  }

  // AI Service health endpoint
  async getAiServiceHealth(): Promise<AiServiceHealth> {
    const response = await aiApiClient.getClient().get<AiServiceHealth>('/health');
    return response.data;
  }
}

export const dashboardService = new DashboardService();


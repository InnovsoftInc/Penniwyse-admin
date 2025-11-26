import { apiClient } from '../apiClient';
import type { PushLogsResponse, PushLogsQueryParams } from '../../types/push-notification.types';

class PushNotificationsService {
  async getPushLogs(params?: PushLogsQueryParams): Promise<PushLogsResponse> {
    const response = await apiClient.getClient().get<PushLogsResponse>(
      '/api/admin/push-logs',
      { params }
    );
    return response.data;
  }
}

export const pushNotificationsService = new PushNotificationsService();


import { apiClient } from '../apiClient';
import type {
  NotificationTemplate,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateQueryParams,
} from '../../types/notification-template.types';

class NotificationTemplateService {
  async getTemplates(params?: NotificationTemplateQueryParams): Promise<NotificationTemplate[]> {
    const response = await apiClient.getClient().get<NotificationTemplate[]>('/api/admin/templates/notifications', { params });
    return response.data;
  }

  async getTemplateByName(name: string): Promise<NotificationTemplate> {
    const response = await apiClient.getClient().get<NotificationTemplate>(`/api/admin/templates/notifications/${name}`);
    return response.data;
  }

  async getTemplatesByType(type: string): Promise<NotificationTemplate[]> {
    const response = await apiClient.getClient().get<NotificationTemplate[]>(`/api/admin/templates/notifications/type/${type}`);
    return response.data;
  }

  async createTemplate(data: CreateNotificationTemplateDto): Promise<NotificationTemplate> {
    const response = await apiClient.getClient().post<NotificationTemplate>('/api/admin/templates/notifications', data);
    return response.data;
  }

  async updateTemplate(name: string, data: UpdateNotificationTemplateDto): Promise<NotificationTemplate> {
    const response = await apiClient.getClient().put<NotificationTemplate>(`/api/admin/templates/notifications/${name}`, data);
    return response.data;
  }

  async deleteTemplate(name: string): Promise<void> {
    await apiClient.getClient().delete(`/api/admin/templates/notifications/${name}`);
  }
}

export const notificationTemplateService = new NotificationTemplateService();


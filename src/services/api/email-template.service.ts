import { apiClient } from '../apiClient';
import type {
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateQueryParams,
} from '../../types/email-template.types';

class EmailTemplateService {
  async getTemplates(params?: EmailTemplateQueryParams): Promise<EmailTemplate[]> {
    const response = await apiClient.getClient().get<EmailTemplate[]>('/api/admin/email-templates', { params });
    return response.data;
  }

  async getTemplateById(id: number): Promise<EmailTemplate> {
    const response = await apiClient.getClient().get<EmailTemplate>(`/api/admin/email-templates/${id}`);
    return response.data;
  }

  async createTemplate(data: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const response = await apiClient.getClient().post<EmailTemplate>('/api/admin/email-templates', data);
    return response.data;
  }

  async updateTemplate(id: number, data: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const response = await apiClient.getClient().put<EmailTemplate>(`/api/admin/email-templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.getClient().delete(`/api/admin/email-templates/${id}`);
  }
}

export const emailTemplateService = new EmailTemplateService();


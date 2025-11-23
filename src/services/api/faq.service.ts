import { apiClient } from '../apiClient';
import type {
  Faq,
  CreateFaqDto,
  UpdateFaqDto,
  FaqQueryParams,
} from '../../types/faq.types';

class FaqService {
  async getFaqs(params?: FaqQueryParams): Promise<Faq[]> {
    const response = await apiClient.getClient().get<Faq[]>('/api/admin/faqs', { params });
    return response.data;
  }

  async getFaqById(id: number): Promise<Faq> {
    const response = await apiClient.getClient().get<Faq>(`/api/admin/faqs/${id}`);
    return response.data;
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    const response = await apiClient.getClient().get<Faq[]>(`/api/admin/faqs/category/${category}`);
    return response.data;
  }

  async createFaq(data: CreateFaqDto): Promise<Faq> {
    const response = await apiClient.getClient().post<Faq>('/api/admin/faqs', data);
    return response.data;
  }

  async updateFaq(id: number, data: UpdateFaqDto): Promise<Faq> {
    const response = await apiClient.getClient().put<Faq>(`/api/admin/faqs/${id}`, data);
    return response.data;
  }

  async deleteFaq(id: number): Promise<void> {
    await apiClient.getClient().delete(`/api/admin/faqs/${id}`);
  }

  async incrementViews(id: number): Promise<void> {
    await apiClient.getClient().post(`/api/admin/faqs/${id}/view`);
  }

  async markHelpful(id: number): Promise<void> {
    await apiClient.getClient().post(`/api/admin/faqs/${id}/helpful`);
  }

  async markNotHelpful(id: number): Promise<void> {
    await apiClient.getClient().post(`/api/admin/faqs/${id}/not-helpful`);
  }
}

export const faqService = new FaqService();


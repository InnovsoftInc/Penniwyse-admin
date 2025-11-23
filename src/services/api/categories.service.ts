import { apiClient } from '../apiClient';
import type {
  Category,
  CategoryTree,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryParams,
} from '../../types/category.types';

class CategoriesService {
  async getCategories(params?: CategoryQueryParams): Promise<Category[]> {
    const response = await apiClient.getClient().get<Category[]>('/api/categories', { params });
    return response.data;
  }

  async getCategoryTree(): Promise<CategoryTree[]> {
    const response = await apiClient.getClient().get<CategoryTree[]>('/api/categories/tree');
    return response.data;
  }

  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.getClient().get<Category>(`/api/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.getClient().post<Category>('/api/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.getClient().put<Category>(`/api/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await apiClient.getClient().delete(`/api/categories/${id}`);
  }
}

export const categoriesService = new CategoriesService();


import { apiClient } from '../apiClient';
import type {
  Merchant,
  CreateMerchantMappingDto,
  UpdateMerchantDto,
  MerchantsQueryParams,
  MerchantsResponse,
  BatchFetchMerchantBrandsRequest,
  BatchFetchMerchantBrandsResponse,
} from '../../types/merchant.types';

class MerchantsService {
  async getMerchants(params?: MerchantsQueryParams): Promise<MerchantsResponse> {
    const response = await apiClient.getClient().get<MerchantsResponse>('/api/merchants', { params });
    return response.data;
  }

  async createMerchantMapping(data: CreateMerchantMappingDto): Promise<Merchant> {
    const response = await apiClient.getClient().post<Merchant>('/api/merchants', data);
    return response.data;
  }

  async updateMerchantMapping(merchantName: string, data: CreateMerchantMappingDto): Promise<Merchant> {
    // POST endpoint creates or updates
    const response = await apiClient.getClient().post<Merchant>('/api/merchants', data);
    return response.data;
  }

  async updateMerchant(id: number, data: UpdateMerchantDto): Promise<Merchant> {
    const response = await apiClient.getClient().put<Merchant>(`/api/merchants/${id}`, data);
    return response.data;
  }

  async createMerchant(data: CreateMerchantMappingDto & UpdateMerchantDto): Promise<Merchant> {
    const response = await apiClient.getClient().post<Merchant>('/api/merchants', data);
    return response.data;
  }

  async batchFetchBrands(data: BatchFetchMerchantBrandsRequest): Promise<BatchFetchMerchantBrandsResponse> {
    const response = await apiClient.getClient().post<BatchFetchMerchantBrandsResponse>(
      '/api/merchants/batch-fetch-brands',
      data
    );
    return response.data;
  }
}

export const merchantsService = new MerchantsService();


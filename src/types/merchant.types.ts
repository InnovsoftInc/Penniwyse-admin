import type { Category } from './category.types';

export interface Merchant {
  id: number;
  merchantName: string;
  normalizedName?: string;
  categoryId?: number;
  category?: Category;
  confidence?: number;
  timesUsed?: number;
  lastUsed?: string;
  domain?: string;
  logo?: string; // Logo URL or Base64 data URL (data:image/...)
  logoBase64?: string; // Base64 logo (same as logo, for clarity)
  brandName?: string;
  industry?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MerchantsQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
  sortBy?: 'timesUsed' | 'lastUsed' | 'merchantName';
  sortOrder?: 'asc' | 'desc';
  missingLogo?: boolean | string; // Filter for merchants missing logo
  missingDomain?: boolean | string; // Filter for merchants missing domain
}

export interface MerchantsResponse {
  merchants: Merchant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MerchantMapping {
  merchantName: string;
  categoryId: number;
  confidence?: number;
}

export interface CreateMerchantMappingDto {
  merchantName: string;
  categoryId: number;
  confidence?: number;
}

export interface UpdateMerchantDto {
  merchantName?: string;
  categoryId?: number;
  confidence?: number;
  domain?: string;
  brandName?: string;
  industry?: string;
  logo?: string; // Base64 data URL (data:image/...)
  logoBase64?: string; // Base64 logo
}

export interface BatchFetchMerchantBrandsRequest {
  merchantIds: number[];
  async?: boolean;
}

export interface BatchFetchMerchantBrandsResponse {
  success: boolean;
  message: string;
  processed: number;
  failed?: number;
}


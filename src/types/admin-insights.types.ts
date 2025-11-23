// Admin Insights Types for fetching all users' insights

// Backend response format (matches actual API response)
export interface PeriodInsightRecordRaw {
  userId: string | number;
  profileType: string;
  insightType: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  summaryMessage?: string;
  details?: Record<string, unknown>;
  currency?: string | null;
  generatedAt: string;
  source: 'user_insights' | 'insight_summaries';
  // Legacy fields that may still exist
  id?: number;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend format (camelCase)
export interface PeriodInsightRecord {
  id: string; // Generated from userId + generatedAt or index
  userId: number;
  profileType: string;
  insightType: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  summaryMessage?: string;
  details?: Record<string, unknown>;
  currency?: string | null;
  generatedAt: string;
  source: 'user_insights' | 'insight_summaries';
  // Legacy fields
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllInsightsRequest {
  userId?: number;
  profileType?: string;
  insightType?: string;
  startDate?: string; // ISO format
  endDate?: string; // ISO format
  source?: 'user_insights' | 'insight_summaries' | 'all'; // default: 'all'
  limit?: number; // 1-10000, default: 1000
  offset?: number; // default: 0
}

// Backend response format (API returns camelCase)
export interface AllInsightsResponseRaw {
  insights: PeriodInsightRecordRaw[];
  totalCount: number;
  returnedCount: number;
  limit: number;
  offset: number;
}

// Frontend response format
export interface AllInsightsResponse {
  insights: PeriodInsightRecord[];
  totalCount: number;
  returnedCount: number;
  limit: number;
  offset: number;
}


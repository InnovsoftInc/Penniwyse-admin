export type PlaidLogStatus = 'success' | 'error';

export interface PlaidLog {
  id: number;
  userId: number;
  endpoint: string;
  method: string;
  requestId: string;
  status: PlaidLogStatus;
  statusCode: number;
  errorCode?: string | null;
  errorType?: string | null;
  errorMessage?: string | null;
  environment: string;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: number;
    email: string;
  };
}

export interface PlaidLogsQueryParams {
  userId?: number;
  endpoint?: string;
  status?: PlaidLogStatus;
  requestId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface PlaidLogsPagination {
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

export interface PlaidLogsResponse {
  success: boolean;
  logs: PlaidLog[];
  pagination: PlaidLogsPagination;
}


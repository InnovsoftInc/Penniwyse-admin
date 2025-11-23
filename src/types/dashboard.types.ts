export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
}

export interface DashboardData {
  summary: {
    totalTransactions: number;
    totalAmount: number;
    averageAmount: number;
  };
  categoryBreakdown: Record<string, { count: number; total: number }>;
  typeBreakdown: {
    income?: { count: number; total: number };
    expense?: { count: number; total: number };
  };
  recentTransactions: Array<{
    id: number;
    amount: string;
    description: string;
    date: string;
  }>;
}

export interface DashboardQueryParams {
  year?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services?: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
  }>;
}

export interface AiServiceHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  dependencies?: Record<string, string>;
}


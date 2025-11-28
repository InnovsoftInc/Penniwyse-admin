export const PushNotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  ERROR: 'error',
} as const;

export type PushNotificationStatus = typeof PushNotificationStatus[keyof typeof PushNotificationStatus];

export interface PushNotificationLog {
  id: number;
  userId: number;
  notificationId?: number | null;
  pushToken: string;
  deviceId?: string | null;
  deviceName?: string | null;
  title: string;
  body: string;
  data?: any;
  status: PushNotificationStatus;
  ticketId?: string | null;
  receiptId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  sentAt: Date | string;
  deliveredAt?: Date | string | null;
  failedAt?: Date | string | null;
  retryCount: number;
  metadata?: any;
  user?: {
    id: number;
    email: string;
  };
  notification?: {
    id: number;
    type: string;
    title: string | null;
    message: string;
  } | null;
}

export interface PushNotificationDevice {
  id: string;
  token: string;
  deviceName?: string | null;
  deviceModel?: string | null;
  platform?: string | null;
  registeredAt?: Date | string;
  lastActiveAt?: Date | string | null;
}

export interface PushNotificationStatistics {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  error: number;
  deliveryRate: number;
  failureRate: number;
}

export interface PushLogsQueryParams {
  userId?: number;
  status?: PushNotificationStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface PushLogsPagination {
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

export interface PushLogsResponse {
  success: boolean;
  logs: PushNotificationLog[];
  pagination: PushLogsPagination;
}


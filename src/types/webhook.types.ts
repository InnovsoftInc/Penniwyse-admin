export interface WebhookLog {
  id: number;
  type: string;
  source: string;
  payload: Record<string, unknown>;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  processedAt: string;
  createdAt: string;
}

export interface PlaidWebhook {
  webhook_type: 'TRANSACTIONS' | 'ITEM' | 'ACCOUNTS' | 'INVESTMENTS_TRANSACTIONS';
  webhook_code: string;
  item_id: string;
  new_transactions?: number;
  removed_transactions?: string[];
  [key: string]: unknown;
}

export interface WebhookResponse {
  status: 'success' | 'error';
  message?: string;
}


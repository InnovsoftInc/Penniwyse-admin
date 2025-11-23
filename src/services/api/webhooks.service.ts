import { adminApiClient } from '../adminApiClient';
import type { PlaidWebhook, WebhookResponse } from '../../types/webhook.types';

class WebhooksService {
  async handlePlaidWebhook(data: PlaidWebhook): Promise<WebhookResponse> {
    const response = await adminApiClient.getClient().post<WebhookResponse>('/webhooks/plaid', data);
    return response.data;
  }
}

export const webhooksService = new WebhooksService();


import { HttpClient } from '../http-client';
import { PayPalWebhook, PayPalWebhookEventTypeDescriptor, PayPalWebhookCreateParams, PayPalWebhookPatchParams, PayPalWebhookVerificationParams, PayPalWebhookVerificationStatus } from '../interfaces';

export class WebhookClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async getAll(): Promise<PayPalWebhook[]> {
        const response = await this.httpClient.get<PayPalWebhook[]>({ path: 'v1/notifications/webhooks' });
        return response;
    }

    public async get(id: string): Promise<PayPalWebhook> {
        const response = await this.httpClient.get<PayPalWebhook>({ path: `v1/notifications/webhooks/${id}` });
        return response;
    }

    public async getEventTypes(): Promise<{ event_types: PayPalWebhookEventTypeDescriptor[] }> {
        const response = await this.httpClient.get<{ event_types: PayPalWebhookEventTypeDescriptor[] }>({ path: `v1/notifications/webhooks-event-types` });
        return response;
    }

    public async create(params: PayPalWebhookCreateParams): Promise<PayPalWebhook> {
        const response = await this.httpClient.post<PayPalWebhook>({ path: 'v1/notifications/webhooks', data: params });
        return response;
    }

    public async update(id: string, params: PayPalWebhookPatchParams): Promise<PayPalWebhook> {
        const response = await this.httpClient.patch<PayPalWebhook>({ path: `v1/notifications/webhooks/${id}`, data: params });
        return response;
    }

    public async remove(id: string): Promise<void> {
        await this.httpClient.delete({ path: `v1/notifications/webhooks/${id}` });
    }

    public async verify(params: PayPalWebhookVerificationParams): Promise<PayPalWebhookVerificationStatus> {
        const response = await this.httpClient.post<PayPalWebhookVerificationStatus>({ path: `v1/notifications/verify-webhook-signature`, data: params });
        return response;
    }
}
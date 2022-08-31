import { HttpClient } from '../http-client';
import { UnipaasCreateWebhookParams, UnipaasUpdateWebhookParams, UnipaasWebhook } from '../interfaces';

export class WebhookClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async getAll(): Promise<UnipaasWebhook[]> {
        const response = await this.httpClient.get<UnipaasWebhook[]>('webhooks');
        return response;
    }

    public async get(id: string): Promise<UnipaasWebhook> {
        const response = await this.httpClient.get<UnipaasWebhook>(`webhooks/${id}`);
        return response;
    }

    public async create(params: UnipaasCreateWebhookParams): Promise<UnipaasWebhook> {
        const response = await this.httpClient.post<UnipaasWebhook>('webhooks', params);
        return response;
    }

    public async update(id: string, params: UnipaasUpdateWebhookParams): Promise<UnipaasWebhook> {
        const response = await this.httpClient.patch<UnipaasWebhook>(`webhooks/${id}`, params);
        return response;
    }

    public async remove(id: string): Promise<UnipaasWebhook> {
        const response = await this.httpClient.delete<UnipaasWebhook>(`webhooks/${id}`);
        return response;
    }
}
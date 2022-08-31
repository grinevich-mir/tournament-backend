import { PayInClient, WebhookClient } from './clients';
import { HttpClient } from './http-client';

export class UnipaasClient {
    private readonly httpClient: HttpClient;
    public readonly payIn: PayInClient;
    public readonly webhook: WebhookClient;

    constructor(apiKey: string, env: 'test' | 'live' = 'test') {
        this.httpClient = new HttpClient(apiKey, env);
        this.payIn = new PayInClient(this.httpClient);
        this.webhook = new WebhookClient(this.httpClient);
    }
}
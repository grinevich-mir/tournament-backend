import { AccessTokenClient, OrderClient, PaymentClient, WebhookClient } from './clients';
import { HttpClient } from './http-client';
import { PayPalEnvironment } from './interfaces';

export class PayPalClient {
    private readonly http: HttpClient;

    public readonly token: AccessTokenClient;
    public readonly order: OrderClient;
    public readonly webhook: WebhookClient;
    public readonly payment: PaymentClient;

    constructor(environment: PayPalEnvironment) {
        this.token = new AccessTokenClient(environment);
        this.http = new HttpClient(environment, this.token);
        this.order = new OrderClient(this.http);
        this.webhook = new WebhookClient(this.http);
        this.payment = new PaymentClient(this.http);
    }
}
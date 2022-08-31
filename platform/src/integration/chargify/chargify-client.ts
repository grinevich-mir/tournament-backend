import { CustomerClient, PaymentProfileClient, ProductClient, SubscriptionClient, TransactionClient } from './clients';
import { HttpClient } from './http-client';

export class ChargifyClient {
    public readonly customers: CustomerClient;
    public readonly paymentProfiles: PaymentProfileClient;
    public readonly subscriptions: SubscriptionClient;
    public readonly transactions: TransactionClient;
    public readonly products: ProductClient;

    constructor(subdomain: string, apiKey: string) {
        const httpClient = new HttpClient(subdomain, apiKey);
        this.customers = new CustomerClient(httpClient);
        this.paymentProfiles = new PaymentProfileClient(httpClient);
        this.subscriptions = new SubscriptionClient(httpClient);
        this.transactions = new TransactionClient(httpClient);
        this.products = new ProductClient(httpClient);
    }
}
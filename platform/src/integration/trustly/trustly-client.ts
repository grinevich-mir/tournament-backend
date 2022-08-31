import { TransactionClient, CustomerClient } from './clients';
import { HttpClient } from './http-client';

export class TrustlyClient {
    private readonly httpClient: HttpClient;
    public readonly transaction: TransactionClient;
    public readonly customer: CustomerClient;

    constructor(accessId: string, accessKey: string, env: 'test' | 'live' = 'test') {
        this.httpClient = new HttpClient(accessId, accessKey, env);
        this.transaction = new TransactionClient(this.httpClient);
        this.customer = new CustomerClient(this.httpClient);
    }
}
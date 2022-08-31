import { HttpClient } from '../http-client';
import { SkrillCheckoutParams, SkrillPrepareCheckoutParams } from '../interfaces';
import { SkrillEnvironment } from '../skrill-environment';

export class CheckoutClient {
    constructor(
        private readonly env: SkrillEnvironment,
        private readonly httpClient: HttpClient) {
    }

    public async prepare(params: SkrillPrepareCheckoutParams): Promise<string> {
        const data: SkrillCheckoutParams = {
            prepare_only: '1',
            pay_to_email: this.env.email,
            status_url: this.env.statusUrl,
            ...params
        };

        const sessionId = await this.httpClient.post<string>(this.env.checkoutUrl, data);
        return `${this.env.checkoutUrl}/app/?sid=${sessionId}`;
    }
}
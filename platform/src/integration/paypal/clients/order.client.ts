import { HttpClient } from '../http-client';
import { PayPalOrder, PayPalOrderParams } from '../interfaces';
import { PayPalError } from '../paypal-error';

export class OrderClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async get(id: string, headers?: { [name: string]: string }): Promise<PayPalOrder | undefined> {
        try {
            const response = await this.httpClient.get<PayPalOrder>({ path: `v2/checkout/orders/${id}`, headers });
            return response;
        } catch (err) {
            if (err instanceof PayPalError)
                if (err.statusCode === 404)
                    return undefined;

            throw err;
        }
    }

    public async capture(id: string, headers?: { [name: string]: string }): Promise<PayPalOrder> {
        const response = await this.httpClient.post<PayPalOrder>({ path: `v2/checkout/orders/${id}/capture`, headers });
        return response;
    }

    public async create(params: PayPalOrderParams): Promise<PayPalOrder> {
        const response = await this.httpClient.post<PayPalOrder>({ path: 'v2/checkout/orders', data: params });
        return response;
    }
}
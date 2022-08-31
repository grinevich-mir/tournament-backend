import { HttpClient } from '../http-client';
import { PayPalPaymentCapture } from '../interfaces';
import { PayPalError } from '../paypal-error';

export class PaymentClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async getCaptureDetails(id: string): Promise<PayPalPaymentCapture | undefined> {
        try {
            const response = await this.httpClient.get<PayPalPaymentCapture>({ path: `v2/payments/captures/${id}` });
            return response;
        } catch (err) {
            if (err instanceof PayPalError)
                if (err.statusCode === 404)
                    return undefined;

            throw err;
        }
    }
}
import { HttpClient } from '../http-client';
import { PaymentwallPayment, PaymentwallApiError } from '../interfaces';
import { PaymentwallPaymentStatusError } from '../paymentwall-error';

export class PaymentStatusClient {
    constructor(private readonly httpClient: HttpClient) { }

    public async get(paymentRef: string): Promise<PaymentwallPayment | undefined> {
        const response = await this.httpClient.get<PaymentwallPayment | PaymentwallApiError>('rest/payment', { ref: paymentRef });

        if (response instanceof Array)
            if (response.length === 0)
                return undefined;

        if (response.object === 'Error') {
            const err = response as PaymentwallApiError;
            throw new PaymentwallPaymentStatusError(err.error, err.code);
        }

        return response as PaymentwallPayment;
    }
}
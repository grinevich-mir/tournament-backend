import { HttpClient } from '../http-client';
import { DeliveryConfirmation, DeliveryConfirmationParams } from '../interfaces';
import { PaymentwallDeliveryError } from '../paymentwall-error';
import qs from 'querystring';

export class DeliveryClient {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly secretKey: string
    ) { }

    public async confirm(params: DeliveryConfirmationParams): Promise<DeliveryConfirmation> {
        const response = await this.httpClient.post<DeliveryConfirmation>('delivery', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-ApiKey': this.secretKey
            },
            transformRequest: (req: any) => {
                return qs.stringify(req);
            }
        });

        if (!response.success)
            throw new PaymentwallDeliveryError(
                response.error,
                response.error_code,
                response.notices
            );

        return response;
    }
}
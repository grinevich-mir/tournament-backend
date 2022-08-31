import Paymentwall from 'paymentwall';
import { HttpClient } from './http-client';
import { PaymentwallApiType } from './interfaces';
import { WidgetClient, PaymentStatusClient, DeliveryClient } from './clients';

export class PaymentwallClient {
    private readonly http: HttpClient;

    public readonly widget: WidgetClient;
    public readonly payment: PaymentStatusClient;
    public readonly delivery: DeliveryClient;

    constructor(appKey: string, secretKey: string) {
        Paymentwall.Configure(
            PaymentwallApiType.DigitalGoods,
            appKey,
            secretKey
        );

        this.http = new HttpClient(appKey, secretKey);
        this.widget = new WidgetClient();
        this.payment = new PaymentStatusClient(this.http);
        this.delivery = new DeliveryClient(this.http, secretKey);
    }
}
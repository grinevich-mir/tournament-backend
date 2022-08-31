import { PaymentProvider } from '@tcom/platform/lib/payment';

export interface OrderPaymentModel {
    provider: PaymentProvider;
    data: { [key: string]: string };
}
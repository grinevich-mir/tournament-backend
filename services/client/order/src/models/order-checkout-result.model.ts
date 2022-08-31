import { PaymentProvider } from '@tcom/platform/lib/payment';

export interface OrderCheckoutResultModel {
    checkoutUrl: string;
    provider: PaymentProvider;
}
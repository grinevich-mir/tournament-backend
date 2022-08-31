import { PaymentProvider } from '@tcom/platform/lib/payment';

export interface OrderCheckoutParamsModel {
    orderId: number;
    provider: PaymentProvider;
    returnUrl?: string;
    cancelUrl?: string;
}
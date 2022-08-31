import { PaymentProvider } from './payment-provider';

export interface PaymentMethodInitResult {
    provider: PaymentProvider;
    data: any;
}
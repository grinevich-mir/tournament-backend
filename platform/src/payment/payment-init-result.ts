import { PaymentProvider } from './payment-provider';

export interface PaymentInitResult {
    provider: PaymentProvider;
    data: any;
}
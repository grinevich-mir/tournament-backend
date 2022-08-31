import { PaymentProvider } from './payment-provider';

export interface PaymentOptionFilter {
    provider?: PaymentProvider;
    country?: string;
    currency?: string;
    enabled?: boolean;
    public?: boolean;
}
import { PaymentProvider } from '@tcom/platform/lib/payment';

export interface PaymentMethodInitParamsModel {
    provider: PaymentProvider;
    returnUrl?: string;
}
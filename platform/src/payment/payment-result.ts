import { PaymentProvider } from './payment-provider';
import { PaymentAction } from './payment-action';
import { PaymentStatus } from './payment-status';

export interface PaymentResult {
    provider: PaymentProvider;
    status: PaymentStatus;
    action?: PaymentAction;
}
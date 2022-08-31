import { PagedFilter } from '../core';
import { Payment } from './payment';
import { PaymentProvider } from './payment-provider';
import { PaymentStatus } from './payment-status';
import { PaymentType } from './payment-type';

export interface PaymentFilter extends PagedFilter<Payment> {
    userId?: number;
    type?: PaymentType;
    paymentMethodId?: number;
    provider?: PaymentProvider;
    status?: PaymentStatus;
}
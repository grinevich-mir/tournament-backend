import { PagedFilter } from '../core';
import { PaymentMethod } from './payment-method';
import { PaymentMethodType } from './payment-method-type';
import { PaymentProvider } from './payment-provider';

export interface PaymentMethodFilter extends PagedFilter<PaymentMethod> {
    userId?: number;
    provider?: PaymentProvider;
    type?: PaymentMethodType;
    enabled?: boolean;
    expired?: boolean;
}

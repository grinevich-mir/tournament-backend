import { SubscriptionStatus } from './subscription-status';
import { Subscription } from './subscription';
import { PagedFilter } from '../core';
import { PaymentProvider } from '../payment';

export interface SubscriptionFilter extends PagedFilter<Subscription> {
    userId?: number;
    status?: SubscriptionStatus;
    provider?: PaymentProvider;
}
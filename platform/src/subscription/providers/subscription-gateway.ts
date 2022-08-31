import { Subscription } from '../subscription';
import { SubscriptionPromo } from '../subscription-promo';
import { SubscriptionTier } from '../subscription-tier';
import { User } from '../../user';
import { PaymentMethod } from '../../payment';
import { SubscriptionTierVariant } from '../subscription-tier-variant';

export interface SubscriptionGateway {
    get(skinId: string, providerRef: string): Promise<Subscription>;
    create(user: User, tier: SubscriptionTier, variant: SubscriptionTierVariant, paymentMethod: PaymentMethod, newSubscriber: boolean): Promise<Subscription>;
    changeTier(subscription: Subscription, newTier: SubscriptionTier, variant: SubscriptionTierVariant, immediate: boolean): Promise<Subscription>;
    reactivate(subscription: Subscription): Promise<Subscription>;
    cancel(subscription: Subscription): Promise<Subscription>;
    applyPromo(subscription: Subscription, tier: SubscriptionTier, promo: SubscriptionPromo): Promise<Subscription>;
}
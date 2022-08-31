import { Singleton, Inject } from '../core/ioc';
import { SubscriptionGatewayFactory } from './providers/subscription-gateway.factory';
import { SubscriptionRepository } from './repositories';
import { NotFoundError, ConflictError, PagedResult, ForbiddenError } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { SubscriptionStatusChangedEvent } from './events';
import { SubscriptionStatus } from './subscription-status';
import { UserLog, LogClass, LogMethod } from '../core/logging';
import { Subscription } from './subscription';
import { SubscriptionFilter } from './subscription-filter';
import { SubscriptionTierManager } from './subscription-tier-manager';
import { SubscriptionTier } from './subscription-tier';
import { SubscriptionSynchroniser } from './utilities';
import { UserManager } from '../user';
import { PaymentMethodManager, PaymentProvider } from '../payment';
import { SubscriptionTierVariant } from './subscription-tier-variant';
import { SubscriptionTierChangeOptions } from './subscription-tier-change-options';
import { ActiveSubscriptionsAndRevenue } from './active-subscriptions-and-revenue';

// TODO: Add caching?
@Singleton
@LogClass()
export class SubscriptionManager {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly subscriptionRepository: SubscriptionRepository,
        @Inject private readonly subscriptionTierManager: SubscriptionTierManager,
        @Inject private readonly subscriptionSynchroniser: SubscriptionSynchroniser,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly gatewayFactory: SubscriptionGatewayFactory,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly userLog: UserLog) {
        }

    public async getAll(filter?: SubscriptionFilter): Promise<PagedResult<Subscription>> {
        return this.subscriptionRepository.getAll(filter);
    }

    public async get(id: number): Promise<Subscription | undefined> {
        return this.subscriptionRepository.get(id);
    }

    public async getByProviderRef(provider: PaymentProvider, ref: string): Promise<Subscription | undefined> {
        return this.subscriptionRepository.getByProviderRef(provider, ref);
    }

    public async getLatest(userId: number): Promise<Subscription | undefined> {
        return this.subscriptionRepository.getLatest(userId);
    }

    @LogMethod({ arguments: false })
    public async create(provider: PaymentProvider, userId: number, tier: SubscriptionTier, variantId?: number): Promise<Subscription> {
        return this.userLog.handle(userId, 'Subscription:Create', async (logData) => {
            const user = await this.userManager.get(userId);

            if (!user)
                throw new NotFoundError('User not found.');

            logData.subscriptionProvider = provider;
            logData.subscriptionTierId = tier.id;

            if (variantId)
                logData.subscriptionTierVariantId = variantId;

            if (!user.currencyCode)
                throw new NotFoundError('User currency not found.');

            const lastSubscription = await this.subscriptionRepository.getLatest(user.id);

            if (lastSubscription && lastSubscription.status !== SubscriptionStatus.Expired)
                throw new ConflictError('User already has an active subscription.');

            const paymentMethod = await this.paymentMethodManager.getActiveForUser(user.id);

            if (paymentMethod?.provider !== provider)
                throw new NotFoundError('Payment method not found.');

            const variant = this.getTierVariant(tier, variantId);

            if (!variant.enabled)
                throw new ForbiddenError('Variant not available.');

            const gateway = this.gatewayFactory.create(provider);
            const newSub = await gateway.create(user, tier, variant, paymentMethod, !lastSubscription);
            newSub.userId = userId;

            const created = await this.subscriptionRepository.add(newSub);
            await this.userManager.setSubscriptionState(user.id, { subscribed: true, subscribing: true });
            const result = await this.getSubscription(created.id);
            await this.eventDispatcher.send(new SubscriptionStatusChangedEvent(result.id, result, SubscriptionStatus.Pending, newSub.status));
            logData.subscriptionId = result.id;
            return result;
        });
    }

    public async add(subscription: Subscription): Promise<Subscription> {
        return this.subscriptionRepository.add(subscription);
    }

    public async changeTier(idOrSubscription: number | Subscription, tierId: number, options?: SubscriptionTierChangeOptions): Promise<Subscription> {
        const subscription = await this.getSubscription(idOrSubscription);
        const tier = await this.subscriptionTierManager.get(tierId);

        if (!tier)
            throw new NotFoundError('Tier not found.');

        const variant = this.getTierVariant(tier, options?.variantId);

        if (!variant.enabled)
            throw new ForbiddenError('Variant not available.');

        if (subscription.trialling && subscription.status !== SubscriptionStatus.Cancelled)
            throw new ForbiddenError('Cannot change tier whilst in trial.');

        if (subscription.status === SubscriptionStatus.PastDue)
            throw new ForbiddenError('Cannot change tier whilst subscription is past due.');

        return this.userLog.handle(subscription.userId, `Subscription:TierChange`, async (logData) => {
            logData.subscriptionId = subscription.id;
            logData.subscriptionTierId = tier.id;
            logData.subscriptionTierVariantId = variant.id;
            logData.immediate = options?.immediate || false;

            const gateway = this.gatewayFactory.create(subscription.provider);
            const updatedSub = await gateway.changeTier(subscription, tier, variant, options?.immediate || false);
            await this.subscriptionSynchroniser.sync(subscription, updatedSub);
            return updatedSub;
        });
    }

    public async cancel(idOrSubscription: number | Subscription): Promise<Subscription> {
        const subscription = await this.getSubscription(idOrSubscription);

        return this.userLog.handle(subscription.userId, 'Subscription:Cancel', async (logData) => {
            logData.subscriptionId = subscription.id;

            const gateway = this.gatewayFactory.create(subscription.provider);
            const cancelledSub = await gateway.cancel(subscription);
            await this.subscriptionSynchroniser.sync(subscription, cancelledSub);
            return await this.get(subscription.id) as Subscription;
        });
    }

    public async sync(idOrSubscription: Subscription | number): Promise<Subscription> {
        let platformSub: Subscription | undefined;
        if (typeof idOrSubscription === 'number') {
            platformSub = await this.get(idOrSubscription);

            if (!platformSub)
                throw new NotFoundError('Subscription not found.');
        } else
            platformSub = idOrSubscription;

        const gateway = this.gatewayFactory.create(platformSub.provider);
        const providerSub = await gateway.get(platformSub.skinId, platformSub.providerRef);
        await this.subscriptionSynchroniser.sync(platformSub, providerSub);
        return await this.get(platformSub.id) as Subscription;
    }

    public async addPayment(subscriptionId: number, paymentId: number): Promise<void> {
        await this.subscriptionRepository.addPayment(subscriptionId, paymentId);
    }

    private async getSubscription(idOrSubscription: number | Subscription): Promise<Subscription> {
        let subscription: Subscription | undefined;
        if (typeof idOrSubscription === 'number') {
            subscription = await this.get(idOrSubscription);

            if (!subscription)
                throw new NotFoundError('Subscription not found.');
        } else
            subscription = idOrSubscription;

        if (subscription.status === SubscriptionStatus.Expired)
            throw new ConflictError('Subscription has expired and cannot be changed.');

        return subscription;
    }

    private getTierVariant(tier: SubscriptionTier, variantId?: number): SubscriptionTierVariant {
        let variant: SubscriptionTierVariant | undefined;

        if (variantId) {
            variant = tier.variants.find(v => v.id === variantId && v.enabled);

            if (!variant)
                throw new Error('Specified variant not found.');
        } else {
            variant = tier.variants.find(v => v.default && v.enabled);

            if (!variant)
                throw new Error('No default subscription tier variant set.');
        }

        return variant;
    }

    public async getCurrentActiveAndEstimatedRevenue(): Promise<ActiveSubscriptionsAndRevenue> {
        return this.subscriptionRepository.getCurrentActiveAndEstimatedRevenue();
    }
}
import _ from 'lodash';
import moment from 'moment';
import { centsToMoney } from '../../../banking/utilities';
import { NotFoundError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ChargifyClientFactory, ChargifyProductPricePoint, ChargifySubscription, ChargifySubscriptionState } from '../../../integration/chargify';
import { PaymentMethodManager, PaymentProvider } from '../../../payment';
import { Subscription } from '../../subscription';
import { SubscriptionStatus } from '../../subscription-status';
import { SubscriptionTier } from '../../subscription-tier';
import { SubscriptionTierManager } from '../../subscription-tier-manager';

@Singleton
@LogClass()
export class ChargifySubscriptionMapper {
    constructor(
        @Inject private readonly tierManager: SubscriptionTierManager,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly chargifyClientFactory: ChargifyClientFactory) {
        }

    public async map(skinId: string, subscription: ChargifySubscription, tier?: SubscriptionTier, nextTier?: SubscriptionTier): Promise<Subscription> {
        const code = subscription.product.handle;

        if (!tier)
            tier = await this.getTier(skinId, code);

        const variantCode = subscription.product.product_price_point_handle.replace('-trial', '');
        const variant = tier.variants.find(v => v.code === variantCode);

        if (!variant)
            throw new Error(`Could not find tier variant with code '${variantCode}'`);

        const paymentProfileId = subscription.credit_card?.id || subscription.bank_account?.id;

        if (!paymentProfileId)
            throw new Error('Could not get payment profile ID from subscription');

        const paymentMethod = await this.paymentMethodManager.getByProviderRef(PaymentProvider.Chargify, paymentProfileId.toString());

        if (!paymentMethod)
            throw new Error(`Chargify payment method with reference ${paymentProfileId} could not be found.`);

        const platformSub: Partial<Subscription> = {
            skinId,
            tierId: tier.id,
            tierVariantId: variant.id,
            level: tier.level,
            period: variant.period,
            frequency: variant.frequency,
            activatedTime: this.getDate(subscription.activated_at),
            amount: centsToMoney(subscription.product_price_in_cents, subscription.currency || 'USD').toUnit(),
            cancelledTime: this.getDate(subscription.delayed_cancel_at || subscription.canceled_at),
            currencyCode: subscription.currency || 'USD',
            expireTime: this.getDate(subscription.delayed_cancel_at || subscription.canceled_at),
            provider: PaymentProvider.Chargify,
            providerRef: subscription.id.toString(),
            periodStartTime: this.getDate(subscription.current_period_started_at, false),
            periodEndTime: this.getDate(subscription.current_period_ends_at, false),
            trialling: subscription.state === ChargifySubscriptionState.Trialing,
            trialStartTime: this.getDate(subscription.trial_started_at),
            trialEndTime: this.getDate(subscription.trial_ended_at),
            status: this.mapStatus(subscription),
            paymentMethodId: paymentMethod.id,
            createTime: this.getDate(subscription.created_at, false),
            updateTime: this.getDate(subscription.updated_at, false),
            pauseTime: this.getDate(subscription.on_hold_at)
        };

        if (subscription.next_product_handle) {
            nextTier = nextTier || await this.getTier(skinId, subscription.next_product_handle);
            platformSub.nextTierId = nextTier.id;
            platformSub.nextTierTime = moment(subscription.current_period_ends_at).toDate();
        }

        if (subscription.next_product_price_point_id) {
            const productId = subscription.next_product_id || subscription.product.id;
            const pricePoint = await this.getPricePoint(skinId, productId, subscription.next_product_price_point_id);
            const relevantTier = nextTier || tier;
            const nextVariantCode = pricePoint.handle.replace('-trial', '');
            const nextVariant = relevantTier.variants.find(v => v.code === nextVariantCode);

            if (!nextVariant)
                throw new Error(`Could not find tier variant with code ${pricePoint.handle} on tier ${relevantTier.id}`);

            platformSub.nextTierVariantId = nextVariant.id;
        }

        if (subscription.customer?.reference)
            platformSub.userId = Number(subscription.customer.reference);

        platformSub.expirationReason = subscription.state === ChargifySubscriptionState.Canceled ? 'canceled' : (null as unknown as undefined);

        return platformSub as Subscription;
    }

    private mapStatus(subscription: ChargifySubscription): SubscriptionStatus {
        if (subscription.delayed_cancel_at)
            return SubscriptionStatus.Cancelled;

        switch (subscription.state) {
            case ChargifySubscriptionState.PastDue:
                return SubscriptionStatus.PastDue;

            case ChargifySubscriptionState.Canceled:
            case ChargifySubscriptionState.Expired:
            case ChargifySubscriptionState.TrialEnded:
            case ChargifySubscriptionState.Unpaid:
                return SubscriptionStatus.Expired;

            case ChargifySubscriptionState.OnHold:
            case ChargifySubscriptionState.Suspended:
                return SubscriptionStatus.Paused;
        }

        return SubscriptionStatus.Active;
    }

    private async getTier(skinId: string, code: string): Promise<SubscriptionTier> {
        const tier = await this.tierManager.getByCode(skinId, code);

        if (!tier)
            throw new NotFoundError(`Could not find tier with code '${code}' on skin '${skinId}'.`);

        return tier;
    }

    private getDate(value?: string, nullable: boolean = true): Date | undefined {
        if (!value)
            if (nullable)
                return null as unknown as undefined;
            else
                return undefined;

        return moment(value).toDate();
    }

    private async getPricePoint(skinId: string, productId: number, pricePointId: number): Promise<ChargifyProductPricePoint> {
        const client = await this.chargifyClientFactory.create(skinId);
        const pricePoint = await client.products.getPricePoint(productId, pricePointId);

        if (!pricePoint)
            throw new Error('Could not found Chargify price point on product ${productId} with ID ${pricePointId}');

        return pricePoint;
    }
}
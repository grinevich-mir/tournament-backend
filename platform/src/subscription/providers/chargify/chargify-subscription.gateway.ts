import moment from 'moment';
import { NotFoundError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import Logger, { LogClass } from '../../../core/logging';
import { ChargifyClientFactory, CreateSubscriptionRequest } from '../../../integration/chargify';
import { PaymentMethod } from '../../../payment';
import { User } from '../../../user';
import { Subscription } from '../../subscription';
import { SubscriptionPeriod } from '../../subscription-period';
import { SubscriptionPromo } from '../../subscription-promo';
import { SubscriptionTier } from '../../subscription-tier';
import { SubscriptionTierVariant } from '../../subscription-tier-variant';
import { SubscriptionGateway } from '../subscription-gateway';
import { ChargifySubscriptionMapper } from './chargify-subscription.mapper';

@Singleton
@LogClass()
export class ChargifySubscriptionGateway implements SubscriptionGateway {
    constructor(
        @Inject private readonly clientFactory: ChargifyClientFactory,
        @Inject private readonly mapper: ChargifySubscriptionMapper) {
        }

    public async get(skinId: string, providerRef: string): Promise<Subscription> {
        const client = await this.clientFactory.create(skinId);
        const chargifySub = await client.subscriptions.get(Number(providerRef));

        if (!chargifySub)
            throw new NotFoundError('Chargify subscription not found.');

        return this.mapper.map(skinId, chargifySub);
    }

    public async create(user: User, tier: SubscriptionTier, variant: SubscriptionTierVariant, paymentMethod: PaymentMethod, newSubscriber: boolean): Promise<Subscription> {
        const client = await this.clientFactory.create(user.skinId);
        const customer = await client.customers.lookup(user.id.toString());

        if (!customer)
            throw new NotFoundError('Chargify customer not found.');

        let pricePointHandle = variant.code;

        if (variant.trialEnabled && newSubscriber)
            pricePointHandle = `${pricePointHandle}-trial`;

        const request: CreateSubscriptionRequest = {
            subscription: {
                product_handle: tier.code,
                payment_profile_id: Number(paymentMethod.providerRef),
                customer_id: customer.id,
                currency: user.currencyCode,
                product_price_point_handle: pricePointHandle
            }
        };

        const chargifySub = await client.subscriptions.create(request);
        return this.mapper.map(user.skinId, chargifySub, tier);
    }

    public async changeTier(subscription: Subscription, newTier: SubscriptionTier, variant: SubscriptionTierVariant, immediate: boolean): Promise<Subscription> {
        const client = await this.clientFactory.create(subscription.skinId);
        let chargifySub = await client.subscriptions.get(Number(subscription.providerRef));

        if (!chargifySub)
            throw new NotFoundError('Chargify subscription not found.');

        const nextProductHandle = chargifySub.next_product_handle;

        if (chargifySub.delayed_cancel_at) {
            await client.subscriptions.removeDelayedCancel(chargifySub.id);
            chargifySub.canceled_at = undefined;
            chargifySub.delayed_cancel_at = undefined;
            chargifySub.cancellation_message = undefined;
            chargifySub.cancellation_method = undefined;
            chargifySub.cancel_at_end_of_period = false;
        }

        if (nextProductHandle && chargifySub.product.handle === newTier.code) {
            Logger.info('Requested subscription tier is the same as current, removing pending change.');
            chargifySub = await client.subscriptions.cancelProductChange(chargifySub.id);
        } else if (chargifySub.product.handle !== newTier.code && (!nextProductHandle || nextProductHandle !== newTier.code))
            chargifySub = await client.subscriptions.changeProduct(chargifySub.id, newTier.code, variant.code, !immediate);

        return this.mapper.map(subscription.skinId, chargifySub, immediate ? newTier : undefined, !immediate ? newTier : undefined);
    }

    public async reactivate(subscription: Subscription): Promise<Subscription> {
        const client = await this.clientFactory.create(subscription.skinId);
        await client.subscriptions.removeDelayedCancel(Number(subscription.providerRef));
        const chargifySub = await client.subscriptions.get(Number(subscription.providerRef));

        if (!chargifySub)
            throw new NotFoundError('Chargify subscription not found.');

        return this.mapper.map(subscription.skinId, chargifySub);
    }

    public async cancel(subscription: Subscription): Promise<Subscription> {
        const client = await this.clientFactory.create(subscription.skinId);
        await client.subscriptions.delayedCancel(Number(subscription.providerRef));
        const chargifySub = await client.subscriptions.get(Number(subscription.providerRef));

        if (!chargifySub)
            throw new NotFoundError('Chargify subscription not found.');

        return this.mapper.map(subscription.skinId, chargifySub);
    }

    public async applyPromo(subscription: Subscription, tier: SubscriptionTier, promo: SubscriptionPromo): Promise<Subscription> {
        const client = await this.clientFactory.create(subscription.skinId);
        const newEndDate = this.addTime(subscription.periodEndTime, promo.cycles, promo.period);
        const chargifySub = await client.subscriptions.update(Number(subscription.providerRef), {
            subscription: {
                next_billing_at: newEndDate.toISOString()
            }
        });

        return this.mapper.map(subscription.skinId, chargifySub, tier);
    }

    private addTime(date: Date, amount: number, period: SubscriptionPeriod): Date {
        switch (period) {
            case SubscriptionPeriod.Day:
                return moment(date).add(amount, 'day').toDate();

            case SubscriptionPeriod.Week:
                return moment(date).add(amount, 'week').toDate();

            case SubscriptionPeriod.Month:
                return moment(date).add(amount, 'month').toDate();

            case SubscriptionPeriod.Year:
                return moment(date).add(amount, 'year').toDate();
        }
    }
}
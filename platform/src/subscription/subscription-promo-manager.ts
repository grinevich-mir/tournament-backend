import { SubscriptionPromoRepository } from './repositories';
import { Inject, Singleton } from '../core/ioc';
import { SubscriptionPromo } from './subscription-promo';
import { SubscriptionPromoEntityMapper } from './entities/mappers';
import { UserLog, LogClass } from '../core/logging';
import { GeneralError } from '../core';
import { SubscriptionGatewayFactory } from './providers';
import { SubscriptionTierManager } from './subscription-tier-manager';
import { SubscriptionPromoUsageEntity } from './entities';
import moment from 'moment';
import { SubscriptionSynchroniser } from './utilities';
import { SubscriptionPromoUsage } from './subscription-promo-usage';
import { Subscription } from './subscription';

// TODO: Add caching
@Singleton
@LogClass()
export class SubscriptionPromoManager {
    constructor(
        @Inject private readonly subscriptionTierManager: SubscriptionTierManager,
        @Inject private readonly subscriptionSynchroniser: SubscriptionSynchroniser,
        @Inject private readonly repository: SubscriptionPromoRepository,
        @Inject private readonly entityMapper: SubscriptionPromoEntityMapper,
        @Inject private readonly gatewayFactory: SubscriptionGatewayFactory,
        @Inject private readonly userLog: UserLog) {
        }

    public async get(skinId: string, userId: number): Promise<SubscriptionPromo | undefined> {
        if (await this.repository.usageActiveForUser(userId))
            return undefined;

        const entity = await this.repository.getCurrent(skinId);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async accept(subscription: Subscription, promo: SubscriptionPromo): Promise<SubscriptionPromoUsage | undefined> {
        if (!promo)
            return;

        const tier = await this.subscriptionTierManager.get(subscription.tierId);

        if (!tier)
            throw new GeneralError('Subscription tier not found.');

        return this.userLog.handle(subscription.userId, 'Subscription:Promo:Accept', async (logData) => {
            logData.subscriptionId = subscription.id;
            logData.promoId = promo.id;

            const gateway = this.gatewayFactory.create(subscription.provider);
            const extendedSub = await gateway.applyPromo(subscription, tier, promo);

            const entity = this.createUsageEntity(promo, subscription, true);
            const created = await this.repository.addUsage(entity);
            await this.subscriptionSynchroniser.sync(subscription, extendedSub);
            logData.subscriptionPromoUsageId = entity.id;
            return this.entityMapper.usageFromEntity(created);
        });
    }

    public async decline(subscription: Subscription, promo: SubscriptionPromo): Promise<SubscriptionPromoUsage | undefined> {
        if (!promo)
            return;

        return this.userLog.handle(subscription.userId, 'Subscription:Promo:Decline', async (logData) => {
            logData.subscriptionId = subscription.id;
            logData.promoId = promo.id;

            const entity = this.createUsageEntity(promo, subscription, false);
            await this.repository.addUsage(entity);
            logData.subscriptionPromoUsageId = entity.id;
            return entity;
        });
    }

    private createUsageEntity(promo: SubscriptionPromo, subscription: Subscription, accepted: boolean): SubscriptionPromoUsageEntity {
        const entity = new SubscriptionPromoUsageEntity();
        entity.userId = subscription.userId;
        entity.subscriptionId = subscription.id;
        entity.promoId = promo.id;
        entity.accepted = accepted;
        entity.expireTime = moment().utc().add(promo.expireIn, 'months').toDate();
        return entity;
    }
}
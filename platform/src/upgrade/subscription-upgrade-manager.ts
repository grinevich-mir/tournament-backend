import { Singleton, Inject } from '../core/ioc';
import { SubscriptionStatus, SubscriptionManager, Subscription, SubscriptionTierManager, SubscriptionPromo, SubscriptionTier } from '../subscription';
import { NotFoundError, ConflictError, ForbiddenError } from '../core';
import { SubscriptionUpgradeUpdateResult } from './subscription-upgrade-update-result';
import { UserLog, LogClass } from '../core/logging';
import { UpgradeRepository } from './repositories';
import { UserManager } from '../user';
import { UpgradeStatus } from './upgrade-status';
import { UpgradeStatusMapper } from './upgrade-status.mapper';
import { SubscriptionUpgradeEntity } from './entities';
import { SubscriptionPromoManager } from '../subscription/subscription-promo-manager';
import { UpgradeEntityMapper } from './entities/mappers';
import { UpgradeManagerBase } from './upgrade-manager-base';
import { PaymentProvider } from '../payment';

@Singleton
@LogClass()
export class SubscriptionUpgradeManager extends UpgradeManagerBase {
    constructor(
        @Inject upgradeRepository: UpgradeRepository,
        @Inject userManager: UserManager,
        @Inject private readonly subscriptionManager: SubscriptionManager,
        @Inject private readonly subscriptionTierManager: SubscriptionTierManager,
        @Inject private readonly subscriptionPromoManager: SubscriptionPromoManager,
        @Inject private readonly statusMapper: UpgradeStatusMapper,
        @Inject private readonly entityMapper: UpgradeEntityMapper,
        @Inject private readonly userLog: UserLog) {
            super(upgradeRepository, userManager);
    }

    public async create(provider: PaymentProvider, userId: number, tier: SubscriptionTier, variantId?: number): Promise<SubscriptionUpgradeUpdateResult> {
        const subscription = await this.subscriptionManager.create(provider, userId, tier, variantId);
        return this.createFromSubscription(subscription);
    }

    public async createFromSubscription(subscription: Subscription, status?: UpgradeStatus): Promise<SubscriptionUpgradeUpdateResult> {
        return this.userLog.handle(subscription.userId, 'Upgrade:Subscription:Create', async (logData) => {
            const level = subscription.level;
            logData.subscriptionId = subscription.id;
            logData.subscriptionProvider = subscription.provider;
            logData.subscriptionTierId = subscription.tierId;

            if (!status)
                status = this.statusMapper.fromSubscription(subscription.status);

            let entity = new SubscriptionUpgradeEntity();
            entity.level = level;
            entity.status = status;
            entity.userId = subscription.userId;
            entity.subscriptionId = subscription.id;
            entity = await this.upgradeRepository.addSubscription(entity);
            logData.subscriptionUpgradeId = entity.id;

            const newLevel = await this.updateUserLevel(subscription.userId);

            logData.userLevel = newLevel;

            const upgrade = this.entityMapper.fromEntity(entity);

            return {
                upgrade,
                subscription,
                level: newLevel
            };
        });
    }

    public async changeTier(userId: number, tierId: number, variantId?: number, promoCheck: boolean = false): Promise<SubscriptionUpgradeUpdateResult> {
        return this.userLog.handle(userId, 'Upgrade:Subscription:ChangeTier', async (logData) => {
            const subscription = await this.getSubscription(userId);

            if (subscription.trialling)
                promoCheck = false;

            logData.requestedTierId = tierId;

            if (variantId)
                logData.requestTierVariantId = variantId;

            logData.promoCheck = promoCheck;
            logData.subscriptionId = subscription.id;
            logData.currentSubscriptionTierId = subscription.tierId;

            const newTier = await this.subscriptionTierManager.get(tierId);

            if (!newTier || !newTier.enabled)
                throw new NotFoundError(`Subscription tier not found.`);

            logData.newSubscriptionTierId = newTier.id;

            const entity = await this.upgradeRepository.getBySubscriptionId(subscription.id);

            if (!entity)
                throw new NotFoundError('Upgrade not found.');

            logData.subscriptionUpgradeId = entity.id;

            const isUpgrade = newTier.level >= entity.level;

            logData.isUpgrade = isUpgrade;

            const promo = promoCheck ? await this.subscriptionPromoManager.get(subscription.skinId, subscription.userId) : undefined;

            if (promo)
                logData.subscriptionPromoId = promo.id;

            if (!isUpgrade && promo && promo.onDowngrade)
                throw new ForbiddenError('Promo must be accepted or declined.');

            const updatedSub = await this.subscriptionManager.changeTier(subscription, newTier.id, {
                variantId,
                immediate: isUpgrade
            });

            if (isUpgrade && entity.level !== newTier.level)
                await this.upgradeRepository.setLevel(entity.id, newTier.level);

            const newLevel = await this.updateUserLevel(userId);

            const upgrade = this.entityMapper.fromEntity(entity);

            const result: SubscriptionUpgradeUpdateResult = {
                upgrade,
                subscription: updatedSub,
                level: newLevel
            };

            logData.newUserLevel = newLevel;

            if (updatedSub.nextTierId && updatedSub.nextTierTime) {
                const nextTier = await this.subscriptionTierManager.get(updatedSub.nextTierId);
                result.nextTier = nextTier;
                result.nextTierTime = updatedSub.nextTierTime;
            }

            return result;
        });
    }

    public async cancel(userId: number, promoCheck: boolean = false): Promise<Date> {
        return this.userLog.handle(userId, 'Upgrade:Subscription:Cancel', async (logData) => {
            const subscription = await this.getSubscription(userId);

            if (subscription.trialling)
                promoCheck = false;

            logData.promoCheck = promoCheck;
            logData.subscriptionId = subscription.id;

            if (subscription.status === SubscriptionStatus.Cancelled)
                throw new ConflictError('Subscription is already cancelled.');

            const promo = promoCheck ? await this.subscriptionPromoManager.get(subscription.skinId, subscription.userId) : undefined;

            if (promo)
                logData.subscriptionPromoId = promo.id;

            if (promo && promo.onCancellation)
                throw new ForbiddenError('Promo must be accepted or declined.');

            const cancelledSub = await this.subscriptionManager.cancel(subscription);

            if (!cancelledSub.expireTime)
                throw new Error('Subscription has no expire date.');

            logData.subscriptionExpireTime = cancelledSub.expireTime.toISOString();

            return cancelledSub.expireTime;
        });
    }

    public async getPromo(userId: number): Promise<SubscriptionPromo | undefined> {
        const subscription = await this.getSubscription(userId);

        if (subscription.trialling)
            return undefined;

        return this.subscriptionPromoManager.get(subscription.skinId, subscription.userId);
    }

    public async acceptPromo(userId: number): Promise<void> {
        await this.userLog.handle(userId, 'Upgrade:Subscription:Promo:Accept', async (logData) => {
            const subscription = await this.getSubscription(userId);
            logData.subscriptionId = subscription.id;

            const promo = await this.subscriptionPromoManager.get(subscription.skinId, subscription.userId);

            if (!promo)
                throw new NotFoundError('Promo not found.');

            logData.subscriptionPromoId = promo.id;

            await this.subscriptionPromoManager.accept(subscription, promo);
        });
    }

    public async declinePromo(userId: number): Promise<void> {
        await this.userLog.handle(userId, 'Upgrade:Subscription:Promo:Decline', async (logData) => {
            const subscription = await this.getSubscription(userId);
            logData.subscriptionId = subscription.id;

            const promo = await this.subscriptionPromoManager.get(subscription.skinId, subscription.userId);

            if (!promo)
                throw new NotFoundError('Promo not found.');

            logData.subscriptionPromoId = promo.id;

            await this.subscriptionPromoManager.decline(subscription, promo);
        });
    }

    public async updateFromSubscription(subscription: Subscription): Promise<void> {
        const upgrade = await this.upgradeRepository.getBySubscriptionId(subscription.id);
        const newStatus = this.statusMapper.fromSubscription(subscription.status);

        if (upgrade) {
            if (upgrade.status !== newStatus)
                await this.upgradeRepository.setStatus(upgrade.id, newStatus);

            if (upgrade.level !== subscription.level)
                await this.upgradeRepository.setLevel(upgrade.id, subscription.level);

            await this.updateUserLevel(upgrade.userId);
            return;
        }

        console.warn(`Subscription upgrade for subscription ID ${subscription.id} not found, creating...`);
        await this.createFromSubscription(subscription, newStatus);
    }

    private async getSubscription(userId: number): Promise<Subscription> {
        const subscription = await this.subscriptionManager.getLatest(userId);

        if (!subscription)
            throw new NotFoundError('Subscription not found.');

        if (subscription.status === SubscriptionStatus.Expired)
            throw new ConflictError('Subscription is not active.');

        return subscription;
    }
}
import { Tags, Get, Route, Security, Put, Body, Post, Delete, Path, Response, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UpgradeSubscriptionTierChangeModel, UpgradeSubscriptionTiersModel, UpgradeSubscriptionTierModel, UpgradeSubscriptionTierChangeResultModel, UpgradeSubscriptionPromoModel, UpgradeSubscriptionCreateResultModel, SubscriptionOptionsModel } from '../models';
import { NotFoundError } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { SubscriptionUpgradeManager } from '@tcom/platform/lib/upgrade';
import { SubscriptionManager, SubscriptionStatus, SubscriptionTierManager, SubscriptionTier } from '@tcom/platform/lib/subscription';
import { SubscriptionModelMapper, SubscriptionModel } from '@tcom/platform/lib/subscription/models';
import { LogClass, LogMethod } from '@tcom/platform/lib/core/logging';
import { PaymentProvider } from '@tcom/platform/lib/payment';

@Route('upgrade/subscription')
@Security('cognito')
@LogClass()
export class SubscriptionController extends ClientController {
    constructor(
        @Inject private readonly subscriptionTierManager: SubscriptionTierManager,
        @Inject private readonly upgradeManager: SubscriptionUpgradeManager,
        @Inject private readonly subscriptionManager: SubscriptionManager,
        @Inject private readonly modelMapper: SubscriptionModelMapper) {
        super();
    }

    /**
     * @summary Gets the latest subscription for the authenticated user.
     */
    @Tags('Subscription')
    @Get()
    @Response<NotFoundError>(404, 'Subscription not found')
    public async getLatest(): Promise<SubscriptionModel> {
        const subscription = await this.subscriptionManager.getLatest(this.user.id);

        if (!subscription)
            throw new NotFoundError('Subscription not found.');

        const tier = await this.subscriptionTierManager.get(subscription.tierId);

        if (!tier)
            throw new NotFoundError('Subscription tier not found.');

        return this.modelMapper.map(subscription, tier);
    }

    /**
     * @summary Changes the authenticated users subscription tier using the supplied tier code.
     */
    @Tags('Subscription')
    @Put()
    public async changeTier(@Body() change: UpgradeSubscriptionTierChangeModel): Promise<UpgradeSubscriptionTierChangeResultModel> {
        if (change.tierId === 0) {
            const cancelDate = await this.upgradeManager.cancel(this.user.id, true);
            return {
                nextLevel: 0,
                nextTierId: 0,
                nextTierTime: cancelDate
            };
        }

        const result = await this.upgradeManager.changeTier(this.user.id, change.tierId, change.variantId, true);

        return {
            level: result.level,
            nextLevel: result.nextTier?.level,
            nextTierId: result.nextTier?.id,
            nextTierTime: result.nextTierTime
        };
    }

    /**
     * @summary Gets the current promotion if available to the user.
     */
    @Tags('Subscription')
    @Get('promo')
    public async getPromo(): Promise<UpgradeSubscriptionPromoModel | false> {
        const subscription = await this.subscriptionManager.getLatest(this.user.id);

        if (!subscription)
            throw new NotFoundError('Subscription not found.');

        const tier = await this.subscriptionTierManager.get(subscription.tierId);

        if (!tier)
            throw new NotFoundError('Subscription tier not found.');

        const promo = await this.getPromoModel();

        if (!promo)
            return false;

        return promo;
    }

    /**
     * @summary Accepts the current promotion if available to the user.
     */
    @Tags('Subscription')
    @Post('promo')
    public async acceptPromo(): Promise<void> {
        await this.upgradeManager.acceptPromo(this.user.id);
    }

    /**
     * @summary Declines the current promotion if available to the user.
     */
    @Tags('Subscription')
    @Delete('promo')
    public async declinePromo(): Promise<void> {
        await this.upgradeManager.declinePromo(this.user.id);
    }

    private async getPromoModel(): Promise<UpgradeSubscriptionPromoModel | undefined> {
        const promo = await this.upgradeManager.getPromo(this.user.id);

        if (!promo)
            return;

        return {
            cycles: promo.cycles,
            period: promo.period,
            onCancellation: promo.onCancellation,
            onDowngrade: promo.onDowngrade
        };
    }

    /**
     * @summary Creates a new subscription.
     */
    @Tags('Subscription')
    @Post('{tierId}')
    @LogMethod({ arguments: false })
    public async create(@Path() tierId: number, @Body() options?: SubscriptionOptionsModel): Promise<UpgradeSubscriptionCreateResultModel> {
        const tier = await this.subscriptionTierManager.get(tierId);

        if (!tier || !tier.enabled)
            throw new NotFoundError('Subscription tier not found.');

        const result = await this.upgradeManager.create(PaymentProvider.Chargify, this.user.id, tier, options?.variantId);

        return {
            userLevel: result.level,
            subscription: this.modelMapper.map(result.subscription, tier)
        };
    }

    /**
     * Gets available upgrade subscription tiers for the authenticated user.
     */
    @Tags('Subscription')
    @Get('tier')
    public async getTiers(): Promise<UpgradeSubscriptionTiersModel> {
        const tiers = await this.subscriptionTierManager.getAll({
            skinId: this.user.skinId
        });

        const enabledTiers = tiers.filter(t => t.enabled);

        if (enabledTiers.length === 0)
            throw new NotFoundError('No upgrade tiers found');

        let currentSubLevel = 0;
        let currentTierId = 0;
        let nextTierId: number | undefined;
        let nextTierVariantId: number | undefined;
        let nextLevel: number | undefined;
        let nextTierTime: Date | undefined;
        let promo: UpgradeSubscriptionPromoModel | undefined;
        const subscription = await this.subscriptionManager.getLatest(this.user.id);

        if (subscription && subscription.status !== SubscriptionStatus.Expired) {
            currentSubLevel = subscription.level;
            currentTierId = subscription.tierId;

            if (subscription.nextTierId) {
                const nextTier = await this.subscriptionTierManager.get(subscription.nextTierId) as SubscriptionTier;
                nextTierId = nextTier.id;
                nextTierVariantId = subscription.nextTierVariantId;
                nextLevel = nextTier.level;
                nextTierTime = subscription.nextTierTime;
            } else if (subscription.cancelledTime) {
                nextTierId = 0;
                nextLevel = 0;
                nextTierTime = subscription.cancelledTime;
            }

            promo = await this.getPromoModel();
        }

        const freeTier: UpgradeSubscriptionTierModel = {
            id: 0,
            name: 'Free',
            level: 0
        };

        const mappedTiers = enabledTiers.map<UpgradeSubscriptionTierModel>(t => ({
            id: t.id,
            name: t.name,
            level: t.level,
            variants: t.variants.filter(v => v.enabled).map(v => ({
                id: v.id,
                name: v.name,
                frequency: v.frequency,
                period: v.period,
                trialDuration: v.trialEnabled ? v.trialDuration : undefined,
                trialPeriod: v.trialEnabled ? v.trialPeriod : undefined,
                prices: _.chain(v.prices)
                    .filter(p => p.enabled)
                    .orderBy(p => p.currencyCode)
                    .keyBy(p => p.currencyCode)
                    .mapValues(p => ({
                        amount: p.amount,
                        trialAmount: v.trialEnabled ? p.trialAmount : undefined
                    }))
                    .value()
            }))
        }));

        return {
            currentTierId,
            currentLevel: currentSubLevel,
            nextTierId,
            nextTierVariantId,
            nextLevel,
            nextTierTime,
            promo,
            tiers: [freeTier].concat(mappedTiers)
        };
    }
}
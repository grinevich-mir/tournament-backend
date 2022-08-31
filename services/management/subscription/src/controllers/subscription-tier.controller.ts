import { AdminController, Route, Tags, Query, Get, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core';
import { SubscriptionTier, SubscriptionTierManager, SubscriptionTierFilter } from '@tcom/platform/lib/subscription';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Tiers')
@Route('subscription/tier')
@Security('admin', ['subscription:tier:read'])
@LogClass()
export class SubscriptionTierController extends AdminController {
    constructor(
        @Inject private readonly tierManager: SubscriptionTierManager) {
        super();
    }

    /**
     * @summary Gets all subscription tiers
     */
    @Get()
    public async getAll(
        @Query() enabled?: boolean,
        @Query() skinId?: string): Promise<SubscriptionTier[]> {
        const filter: SubscriptionTierFilter = {
            enabled,
            skinId
        };

        return this.tierManager.getAll(filter);
    }

    /**
     * @summary Gets a subscription tier by ID
     */
    @Get('{id}')
    public async get(id: number): Promise<SubscriptionTier> {
        const subscription = await this.tierManager.get(id);

        if (!subscription)
            throw new NotFoundError('Subscription tier not found.');

        return subscription;
    }
}

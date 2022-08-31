import { AdminController, Route, Tags, Query, Get, Security, Post } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { SubscriptionStatus, SubscriptionFilter, Subscription } from '@tcom/platform/lib/subscription';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { SubscriptionManager } from '@tcom/platform/lib/subscription';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentProvider } from '@tcom/platform/lib/payment';

@Tags('Subscriptions')
@Route('subscription')
@LogClass()
export class SubscriptionController extends AdminController {
    constructor(
        @Inject private readonly subscriptionManager: SubscriptionManager) {
        super();
    }

    /**
     * @summary Gets all subscriptions
     */
    @Get()
    @Security('admin', ['subscription:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() provider?: PaymentProvider,
        @Query() status?: SubscriptionStatus,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Subscription>> {
        const filter: SubscriptionFilter = {
            userId,
            provider,
            status,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        return this.subscriptionManager.getAll(filter);
    }

    /**
     * @summary Gets a subscription by ID
     */
    @Get('{id}')
    @Security('admin', ['subscription:read'])
    public async get(id: number): Promise<Subscription> {
        const subscription = await this.subscriptionManager.get(id);

        if (!subscription)
            throw new NotFoundError('Subscription not found.');

        return subscription;
    }

    /**
     * @summary Synchronise a subscription from the provider to the platform
     */
    @Post('{id}/sync')
    @Security('admin', ['subscription:write'])
    public async sync(id: number): Promise<Subscription> {
        const subscription = await this.subscriptionManager.sync(id);

        if (!subscription)
            throw new NotFoundError('Subscription not found.');

        return subscription;
    }
}

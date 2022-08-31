import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { SubscriptionEntity } from '../entities';
import { SubscriptionStatus } from '../subscription-status';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { SubscriptionFilter } from '../subscription-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';
import { PaymentProvider } from '../../payment';
import { SubscriptionEntityMapper } from '../entities/mappers';
import { Subscription } from '../subscription';
import { ActiveSubscriptionsAndRevenue } from '../active-subscriptions-and-revenue';

@Singleton
@LogClass()
export class SubscriptionRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: SubscriptionEntityMapper) {
        }

    public async getAll(filter?: SubscriptionFilter): Promise<PagedResult<Subscription>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<SubscriptionEntity> = {};

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.provider)
                options.where.provider = filter.provider;

            if (filter.status)
                options.where.status = filter.status;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(SubscriptionEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const items = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, count, page, pageSize);
    }

    public async get(id: number): Promise<Subscription | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(SubscriptionEntity, id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByProviderRef(provider: PaymentProvider, ref: string): Promise<Subscription | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionEntity> = {
            where: {
                provider,
                providerRef: ref
            }
        };

        const entity = await connection.manager.findOne(SubscriptionEntity, findOptions);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getLatest(userId: number): Promise<Subscription | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionEntity> = {
            where: {
                userId
            },
            order: {
                createTime: 'DESC'
            }
        };

        const entity = await connection.manager.findOne(SubscriptionEntity, findOptions);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(subscription: Subscription): Promise<Subscription> {
        const connection = await this.db.getConnection();
        let entity = this.entityMapper.toEntity(subscription);
        delete (entity as any).id;
        entity = await connection.manager.save(SubscriptionEntity, entity);
        return this.entityMapper.fromEntity(entity);
    }

    public async update(subscription: Subscription): Promise<Subscription> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.toEntity(subscription);
        delete (entity as any).status;
        await connection.manager.save(entity, { reload: false });
        entity.updateTime = new Date();
        return this.entityMapper.fromEntity(entity);
    }

    public async setStatus(id: number, to: SubscriptionStatus, from?: SubscriptionStatus): Promise<void> {
        from = from || await this.getCurrentStatus(id);

        if (!from)
            return;

        if (from === to)
            return;

        const connection = await this.db.getConnection();
        await connection.manager.update(SubscriptionEntity, id, { status: to });
    }

    public async addPayment(id: number, paymentId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.createQueryBuilder()
            .relation(SubscriptionEntity, 'payments')
            .of(id)
            .add(paymentId);
    }

    private async getCurrentStatus(id: number): Promise<SubscriptionStatus | undefined> {
        const currentSub = await this.get(id);

        if (!currentSub)
            return;

        return currentSub.status;
    }

    public async getCurrentActiveAndEstimatedRevenue(): Promise<ActiveSubscriptionsAndRevenue> {
        const connection = await this.db.getConnection();

        const result: ActiveSubscriptionsAndRevenue = await connection.createQueryBuilder(SubscriptionEntity, 'subscription')
            .select(['COUNT(subscription.id) as currentTotalActiveSubscriptions', 'SUM(subscription.amount) as estimatedMonthlyRevenue'])
            .innerJoin('subscription.user', 'user', 'subscription.userId = user.id AND user.type = "Standard"')
            .where({
                status: SubscriptionStatus.Active
            })
            .getRawOne();

        return result;
    }
}
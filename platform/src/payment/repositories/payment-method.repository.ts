import { FindOneOptions, Not } from 'typeorm';
import { NotFoundError, PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { convertOrdering } from '../../core/db/orm';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentMethodEntity } from '../entities';
import { PaymentMethodEntityMapper } from '../entities/mappers';
import { PaymentMethod } from '../payment-method';
import { PaymentMethodFilter } from '../payment-method-filter';
import { PaymentProvider } from '../payment-provider';

@Singleton
@LogClass()
export class PaymentMethodRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: PaymentMethodEntityMapper) {
    }

    public async getAll(filter?: PaymentMethodFilter): Promise<PagedResult<PaymentMethod>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(PaymentMethodEntity, 'paymentMethod');

        if (filter) {
            if (filter.type)
                query = query.andWhere('paymentMethod.type = :type', { type: filter.type });

            if (filter.userId)
                query = query.andWhere('paymentMethod.userId = :userId', { userId: filter.userId });

            if (filter.provider)
                query = query.andWhere('paymentMethod.provider = :provider', { provider: filter.provider });

            if (filter.enabled !== undefined)
                query = query.andWhere('paymentMethod.enabled = :enabled', { provider: filter.enabled });

            if (filter.expired !== undefined)
                if (filter.expired)
                    query = query.andWhere(`DATE_ADD(CONCAT(paymentMethod.expiryYear,'-',paymentMethod.expiryMonth,'-','01'), INTERVAL 1 MONTH) <= CURDATE() AND enabled = true`);
                else
                    query = query.andWhere(`DATE_ADD(CONCAT(paymentMethod.expiryYear,'-',paymentMethod.expiryMonth,'-','01'), INTERVAL 1 MONTH) > CURDATE()`);

            if (filter.page && filter.pageSize) {
                query.skip((filter.page - 1) * filter.pageSize);
                query.take(filter.pageSize);
            }

            if (filter.order)
                query = query.orderBy(convertOrdering('paymentMethod', filter.order));

        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const payments = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(payments, count, page, pageSize);
    }

    public async get(id: number): Promise<PaymentMethod | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(PaymentMethodEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getActiveForUser(userId: number, provider?: PaymentProvider): Promise<PaymentMethod | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(PaymentMethodEntity, {
            where: {
                userId,
                provider,
                enabled: true
            }
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getByProviderRef(provider: PaymentProvider, providerRef: string): Promise<PaymentMethod | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<PaymentMethodEntity> = {
            where: {
                provider,
                providerRef
            }
        };

        const entity = await connection.manager.findOne(PaymentMethodEntity, findOptions);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
        const connection = await this.db.getConnection();
        delete (paymentMethod as any).id;
        const entity = this.mapper.toEntity(paymentMethod);

        return connection.transaction(async manager => {
            if (paymentMethod.enabled)
                await manager.update(PaymentMethodEntity, {
                    userId: paymentMethod.userId
                },
                    {
                        enabled: false
                    });

            const created = await manager.save(entity);
            return this.mapper.fromEntity(created);
        });
    }

    public async update(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.toEntity(paymentMethod);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as PaymentMethod;
    }

    public async enable(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        const paymentMethod = await this.get(id);

        if (!paymentMethod)
            throw new NotFoundError('Payment method not found.');

        await connection.manager.update(PaymentMethodEntity, {
            id: Not(id),
            userId: paymentMethod.userId
        },
            {
                enabled: false
            });
    }

    public async disable(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(PaymentMethodEntity, id,
            {
                enabled: false
            });
    }

    public async getForExpiration(expiresIn: number): Promise<PaymentMethod[]> {
        const connection = await this.db.getConnection();

        const query = connection.createQueryBuilder(PaymentMethodEntity, 'paymentMethod')
            .andWhere(`DATEDIFF(DATE_ADD(CONCAT(paymentMethod.expiryYear,'-',paymentMethod.expiryMonth,'-','01'), INTERVAL 1 MONTH), NOW()) = :expiresIn AND enabled = true`, { expiresIn });

        const entities = await query.getMany();
        return entities.map(e => this.mapper.fromEntity(e));
    }
}

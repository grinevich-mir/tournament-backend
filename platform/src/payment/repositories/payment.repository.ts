import { FindOneOptions } from 'typeorm';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { convertOrdering } from '../../core/db/orm';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentEntity } from '../entities';
import { PaymentEntityMapper } from '../entities/mappers';
import { NewPayment } from '../new-payment';
import { Payment } from '../payment';
import { PaymentFilter } from '../payment-filter';
import { PaymentProvider } from '../payment-provider';
import { PaymentStatus } from '../payment-status';

@Singleton
@LogClass()
export class PaymentRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: PaymentEntityMapper) {
    }

    public async getAll(filter?: PaymentFilter): Promise<PagedResult<Payment>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(PaymentEntity, 'payment')
            .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod');

        if (filter) {
            if (filter.paymentMethodId) {
                delete filter.userId;
                query = query.andWhere('payment.paymentMethodId = :paymentMethodId', { paymentMethodId: filter.paymentMethodId });
            }

            if (filter.userId)
                query = query.andWhere('payment.userId = :userId', { userId: filter.userId });

            if (filter.provider)
                query = query.andWhere('payment.provider = :provider', { provider: filter.provider });

            if (filter.type)
                query = query.andWhere('payment.type = :type', { provider: filter.type });

            if (filter.page && filter.pageSize) {
                query.skip((filter.page - 1) * filter.pageSize);
                query.take(filter.pageSize);
            }

            if (filter.order)
                query = query.orderBy(convertOrdering('payment', filter.order));
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const payments = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(payments, count, page, pageSize);
    }

    public async get(id: number): Promise<Payment | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(PaymentEntity, id, {
            relations: ['paymentMethod']
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getByProviderRef(provider: PaymentProvider, providerRef: string): Promise<Payment | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<PaymentEntity> = {
            where: {
                provider,
                providerRef
            },
            relations: ['paymentMethod']
        };

        const entity = await connection.manager.findOne(PaymentEntity, findOptions);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(payment: NewPayment): Promise<Payment> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.newToEntity(payment);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as Payment;
    }

    public async update(payment: Payment): Promise<Payment> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.toEntity(payment);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as Payment;
    }

    public async setStatus(id: number, status: PaymentStatus, memo?: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(PaymentEntity, id, {
            status,
            memo,
            refundTime: status === PaymentStatus.Refunded ? () => 'CURRENT_TIMESTAMP' : null as unknown as undefined
        });
    }

    public async addWalletEntry(id: number, walletEntryId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.createQueryBuilder()
            .relation(PaymentEntity, 'walletEntries')
            .of(id)
            .add(walletEntryId);
    }
}
import { GlobalDB } from '../../core/db';
import { LogClass } from '../../core/logging';
import { Inject, Singleton } from '../../core/ioc';
import { OrderFilter } from '../order-filter';
import { PagedResult } from '../../core';
import { NewOrder, Order } from '../order';
import { FindManyOptions, In, Raw } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '../entities';
import { OrderEntityMapper } from '../entities/mappers';
import { OrderStatus } from '../order-status';

@Singleton
@LogClass()
export class OrderRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: OrderEntityMapper) {
    }

    public async getAll(filter?: OrderFilter): Promise<PagedResult<Order>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<OrderEntity> = {
            relations: ['items', 'payments', 'payments.paymentMethod']
        };
        options.where = {};

        if (filter) {
            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.statuses && filter.statuses.length > 0)
                options.where.status = In(filter.statuses);

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(OrderEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        const orders = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(orders, count, page, pageSize);
    }

    public async get(id: number): Promise<Order | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(OrderEntity, id, {
            relations: ['items', 'payments', 'payments.paymentMethod']
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(order: NewOrder): Promise<Order> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.newToEntity(order);

        await connection.manager.transaction(async manager => {
            entity = await manager.save(entity);

            if (entity.items) {
                for (const item of entity.items)
                    item.orderId = entity.id;

                await manager.save(entity.items);
            }
        });

        return await this.get(entity.id) as Order;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.transaction(async manager => {
            await manager.delete(OrderItemEntity, { orderId: id });
            await manager.delete(OrderEntity, id);
        });
    }

    public async setStatus(id: number, status: OrderStatus): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(OrderEntity, id, {
            status,
            completeTime: () => status === OrderStatus.Complete ? 'CURRENT_TIMESTAMP' : 'NULL'
        });
    }

    public async setStatuses(ids: number[], status: OrderStatus): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(OrderEntity, {
            id: In(ids)
        },
            {
                status
            });
    }

    public async addPayment(id: number, paymentId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.createQueryBuilder()
            .relation(OrderEntity, 'payments')
            .of(id)
            .add(paymentId);
    }

    public async setItemProcessed(itemId: number, processed: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(OrderItemEntity, itemId, {
            processedTime: () => processed ? 'CURRENT_TIMESTAMP' : 'NULL'
        });
    }

    public async getForExpiration(maxAgeMins: number): Promise<Order[]> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<OrderEntity> = {
            relations: ['items', 'payments', 'payments.paymentMethod'],
            where: {
                createTime: Raw(alias => `DATE_ADD(${alias}, INTERVAL ${maxAgeMins} MINUTE) <= CURRENT_TIMESTAMP`),
                status: OrderStatus.Pending
            }
        };

        const entities = await connection.manager.find(OrderEntity, options);
        return entities.map(e => this.mapper.fromEntity(e));
    }
}
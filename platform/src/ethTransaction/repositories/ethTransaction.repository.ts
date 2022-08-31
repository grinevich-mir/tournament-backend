import { GlobalDB } from '../../core/db';
import { LogClass } from '../../core/logging';
import { Inject, Singleton } from '../../core/ioc';
import { PagedResult } from '../../core';
import { EthTransaction ,NewEthTransaction} from '../ethTransaction';
import { FindManyOptions, In, Raw } from 'typeorm';
import { EthTransactionEntity, } from '../entities';
import { EthTransactionEntityMapper } from '../entities/mappers';

@Singleton
@LogClass()
export class EthTransactionRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: EthTransactionEntityMapper) {
    }

   

    public async get(id: number): Promise<EthTransaction | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(EthTransactionEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(order: NewEthTransaction): Promise<EthTransaction> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.newToEntity(order);

        await connection.manager.transaction(async (manager:any) => {
            entity = await manager.save(entity);

          
        });

        return await this.get(entity.id) as EthTransaction;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.transaction(async (manager:any) => {
           
            await manager.delete(EthTransactionEntity, id);
        });
    }

   


}
import { FindManyOptions, In } from 'typeorm';
import { toMoney } from '../../banking/utilities';
import { GlobalDB } from '../../core/db';
import { NumericTransformer } from '../../core/db/orm';
import { Singleton, Inject } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { FixedJackpotEntity, JackpotAdjustmentEntity, JackpotEntity, JackpotPayoutEntity, ProgressiveJackpotEntity } from '../entities';
import { JackpotEntityMapper } from '../entities/mappers';
import { Jackpot } from '../jackpot';
import { JackpotAdjustmentPurpose } from '../jackpot-adjustment-purpose';
import { JackpotFilter } from '../jackpot-filter';
import { JackpotPayout } from '../jackpot-payout';
import { JackpotType } from '../jackpot-type';
import { JackpotUpdate } from '../jackpot-update';
import { NewJackpot } from '../new-jackpot';

@Singleton
@LogClass()
export class JackpotRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: JackpotEntityMapper) {
    }

    public async get(id: number): Promise<Jackpot | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(JackpotEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getAll(filter?: JackpotFilter): Promise<Jackpot[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<JackpotEntity> = {};

        if (filter) {
            options.where = {};

            if (filter.type)
                options.where.type = filter.type;

            if (filter.enabled !== undefined)
                options.where.enabled = filter.enabled;
        }

        const entities = await connection.manager.find(JackpotEntity, options);
        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async getMany(...ids: number[]): Promise<Jackpot[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(JackpotEntity, {
            where: {
                id: In(ids)
            }
        });

        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async add(jackpot: NewJackpot): Promise<Jackpot> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(jackpot);
        const created = await connection.manager.save(entity);
        return this.mapper.fromEntity(created);
    }

    public async update(id: number, update: JackpotUpdate): Promise<void> {
        const connection = await this.db.getConnection();
        let entityType = JackpotEntity;

        switch (update.type) {
            case JackpotType.Fixed:
                entityType = FixedJackpotEntity;
                break;

            case JackpotType.Progressive:
                entityType = ProgressiveJackpotEntity;
                break;

            default:
                throw new Error(`Jackpot type ${update.type} is not supported.`);
        }

        await connection.manager.update(entityType, id, update);
    }

    public async setEnabled(id: number, enabled: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(JackpotEntity, id, { enabled });
    }

    public async addAdjustment(id: number, amount: number, purpose: JackpotAdjustmentPurpose, source: string): Promise<number> {
        const connection = await this.db.getConnection();
        const entity = new JackpotAdjustmentEntity();
        entity.jackpotId = id;
        entity.amount = amount;
        entity.purpose = purpose;
        entity.sourceRef = source;

        return connection.transaction(async manager => {
            const { rawBalance } = await manager.createQueryBuilder(FixedJackpotEntity, 'jackpot')
                .select('jackpot.balance', 'rawBalance')
                .where({
                    id
                }).getRawOne();

            const transformer = new NumericTransformer();
            const balance = transformer.from(rawBalance as string) || 0;
            const newBalance = toMoney(balance, 'USD').add(toMoney(amount, 'USD')).toUnit();
            entity.balance = newBalance;

            await manager.save(entity, { reload: false });

            await manager.update(FixedJackpotEntity, id, {
                balance: newBalance,
                balanceUpdateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newBalance;
        });
    }

    public async addPayout(id: number, userId: number, amount: number, walletEntryId: number): Promise<JackpotPayout> {
        const connection = await this.db.getConnection();
        const entity = new JackpotPayoutEntity();
        entity.jackpotId = id;
        entity.userId = userId;
        entity.amount = amount;
        entity.walletEntryId = walletEntryId;

        const created = await connection.manager.save(entity);
        return this.mapper.mapPayout(created);
    }

    public async setLastPayout(id: number, time: Date, amount: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(FixedJackpotEntity, id, {
            lastPayoutTime: time,
            lastPayoutAmount: amount
        });
    }

    public async getPayouts(count: number): Promise<JackpotPayout[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(JackpotPayoutEntity, {
            order: {
                createTime: 'DESC'
            },
            take: count
        });

        return entities.map(e => this.mapper.mapPayout(e));
    }
}
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralCommissionGroupEntityMapper } from '../entities/mappers';
import { ReferralCommissionRate, NewReferralCommissionRate, ReferralCommissionRateUpdate } from '../referral-commission-rate';
import { ReferralCommissionRateEntity } from '../entities/referral-commission-rate.entity';

@Singleton
@LogClass()
export class ReferralCommissionRateRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: ReferralCommissionGroupEntityMapper) {
    }

    public async getAll(): Promise<ReferralCommissionRate[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(ReferralCommissionRateEntity, {
            order: {
                groupId: 'ASC',
                level: 'ASC'
            }
        });
        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async get(groupId: number, level: number): Promise<ReferralCommissionRate | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralCommissionRateEntity, undefined, {
            where: {
                groupId,
                level
            }
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(groupId: number, level: number, rate: NewReferralCommissionRate): Promise<ReferralCommissionRate> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(groupId, level, rate);
        await connection.manager.insert(ReferralCommissionRateEntity, entity);
        return await this.get(groupId, level) as ReferralCommissionRate;
    }

    public async update(groupId: number, level: number, rate: ReferralCommissionRateUpdate): Promise<ReferralCommissionRate> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.updateToEntity(groupId, level, rate);
        await connection.manager.save(entity);
        return await this.get(groupId, level) as ReferralCommissionRate;
    }

    public async remove(groupId: number, level: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(ReferralCommissionRateEntity, { level, groupId });
    }
}
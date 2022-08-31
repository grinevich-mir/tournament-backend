import { FindManyOptions, FindConditions } from 'typeorm';
import { toMoney } from '../../banking/utilities';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { NumericTransformer } from '../../core/db/orm';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralEntity, ReferralRewardEntity } from '../entities';
import { ReferralEntityMapper, ReferralRewardEntityMapper } from '../entities/mappers';
import { Referral } from '../referral';
import { ReferralFilter } from '../referral-filter';
import { ReferralRewardFilter } from '../referral-reward-filter';
import { NewReferralReward, ReferralReward } from '../referral-reward';

@Singleton
@LogClass()
export class ReferralRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: ReferralEntityMapper,
        @Inject private readonly rewardMapper: ReferralRewardEntityMapper) {
    }

    public async getAll(filter?: ReferralFilter): Promise<PagedResult<Referral>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<ReferralEntity> = {
            relations: ['referrer', 'referee']
        };

        if (filter) {
            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(ReferralEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const referrals = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(referrals, count, page, pageSize);
    }

    public async get(id: number): Promise<Referral | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralEntity, id, {
            relations: ['referrer', 'referee']
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getByReferee(refereeUserId: number): Promise<Referral | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralEntity, {
            refereeUserId
        }, {
            relations: ['referrer', 'referee']
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getByReferrer(referrerUserId: number, filter?: ReferralFilter): Promise<PagedResult<Referral>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<ReferralEntity> = {
            where: {
                referrerUserId
            },
            relations: ['referrer', 'referee']
        };

        if (filter) {
            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(ReferralEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const referrals = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(referrals, count, page, pageSize);
    }

    public async add(referrerUserId: number, refereeUserId: number): Promise<Referral> {
        const connection = await this.db.getConnection();
        const entity = new ReferralEntity();
        entity.referrerUserId = referrerUserId;
        entity.refereeUserId = refereeUserId;
        const created = await connection.manager.save(entity);
        return await this.get(created.id) as Referral;
    }

    public async getRewards(id: number, filter?: ReferralRewardFilter): Promise<PagedResult<ReferralReward>> {
        const connection = await this.db.getConnection();
        const where: FindConditions<ReferralRewardEntity> = {
            referralId: id
        };
        const options: FindManyOptions<ReferralRewardEntity> = {
            where,
            relations: ['referral', 'referral.referrer', 'referral.referee']
        };

        if (filter) {
            if (filter.type)
                where.type = filter.type;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
            else
                options.order = {
                    createTime: 'DESC'
                };
        }

        const [entities, count] = await connection.manager.findAndCount(ReferralRewardEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const rewards = entities.map(e => this.rewardMapper.fromEntity(e));
        return new PagedResult(rewards, count, page, pageSize);
    }

    public async getReward(id: number): Promise<ReferralReward | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralRewardEntity, id, {
            relations: ['referral', 'referral.referrer', 'referral.referee']
        });

        if (!entity)
            return undefined;

        return this.rewardMapper.fromEntity(entity);
    }

    public async addReward(reward: NewReferralReward): Promise<ReferralReward> {
        const connection = await this.db.getConnection();
        const entity = this.rewardMapper.newToEntity(reward);
        const result = await connection.manager.save(entity, { reload: false });
        return await this.getReward(result.id) as ReferralReward;
    }

    public async adjustRevenue(id: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawRevenue } = await manager.createQueryBuilder(ReferralEntity, 'referral')
                .select('referral.revenue', 'rawRevenue')
                .where({
                    id
                }).getRawOne();

            const transformer = new NumericTransformer();
            const revenue = transformer.from(rawRevenue as string) || 0;
            const newRevenue = toMoney(revenue, 'USD').add(toMoney(amount, 'USD')).toUnit();

            await manager.update(ReferralEntity, id, {
                revenue: newRevenue,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newRevenue;
        });
    }

    public async adjustRewardCount(id: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawRewardCount } = await manager.createQueryBuilder(ReferralEntity, 'referral')
                .select('referral.rewardCount', 'rawRewardCount')
                .where({
                    id
                }).getRawOne();

            const newCount = rawRewardCount + amount;

            await manager.update(ReferralEntity, id, {
                rewardCount: newCount,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newCount;
        });
    }

    public async adjustDiamondCount(id: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawDiamondCount } = await manager.createQueryBuilder(ReferralEntity, 'referral')
                .select('referral.diamondCount', 'rawDiamondCount')
                .where({
                    id
                }).getRawOne();

            const newCount = rawDiamondCount + amount;

            await manager.update(ReferralEntity, id, {
                diamondCount: newCount,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newCount;
        });
    }
}
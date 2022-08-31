import { toMoney } from '../../banking/utilities';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { NumericTransformer } from '../../core/db/orm';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralRewardEntity, ReferralUserEntity } from '../entities';
import { ReferralRewardEntityMapper, ReferralUserEntityMapper } from '../entities/mappers';
import { ReferralReward } from '../referral-reward';
import { ReferralRewardFilter } from '../referral-reward-filter';
import { NewReferralUser, ReferralUser } from '../referral-user';
import { FindManyOptions, FindConditions } from 'typeorm';

@Singleton
@LogClass()
export class ReferralUserRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: ReferralUserEntityMapper,
        @Inject private readonly rewardMapper: ReferralRewardEntityMapper) {
        }

    public async get(userId: number): Promise<ReferralUser | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralUserEntity, userId);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getByCode(code: string): Promise<ReferralUser | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralUserEntity, { code });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getBySlug(slug: string): Promise<ReferralUser | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralUserEntity, { slug });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(newUser: NewReferralUser): Promise<ReferralUser> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(newUser);
        const created = await connection.manager.save(entity);
        return this.mapper.fromEntity(created);
    }

    public async activate(userId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(ReferralUserEntity, userId, { active: true });
    }

    public async deactivate(userId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(ReferralUserEntity, userId, { active: false });
    }

    public async setSlug(userId: number, slug: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(ReferralUserEntity, userId, { slug });
    }

    public async codeExists(code: string): Promise<boolean> {
        const connection = await this.db.getConnection();
        return await connection.manager.count(ReferralUserEntity, {
            where: {
                code
            }
        }) > 0;
    }

    public async slugExists(slug: string): Promise<boolean> {
        const connection = await this.db.getConnection();
        return await connection.manager.count(ReferralUserEntity, {
            where: {
                slug
            }
        }) > 0;
    }

    public async getRewards(userId: number, filter?: ReferralRewardFilter): Promise<PagedResult<ReferralReward>> {
        const connection = await this.db.getConnection();
        const where: FindConditions<ReferralRewardEntity> = {
            userId
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

    public async adjustRevenue(userId: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawRevenue } = await manager.createQueryBuilder(ReferralUserEntity, 'user')
                .select('user.revenue', 'rawRevenue')
                .where({
                    userId
                }).getRawOne();

            const transformer = new NumericTransformer();
            const revenue = transformer.from(rawRevenue as string) || 0;
            const newRevenue = toMoney(revenue, 'USD').add(toMoney(amount, 'USD')).toUnit();

            await manager.update(ReferralUserEntity, userId, {
                revenue: newRevenue,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newRevenue;
        });
    }

    public async adjustReferralCount(userId: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawReferrals } = await manager.createQueryBuilder(ReferralUserEntity, 'user')
                .select('user.referralCount', 'rawReferrals')
                .where({
                    userId
                }).getRawOne();

            const newCount = rawReferrals + amount;

            await manager.update(ReferralUserEntity, userId, {
                referralCount: newCount,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newCount;
        });
    }

    public async adjustRewardCount(userId: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawRewardCount } = await manager.createQueryBuilder(ReferralUserEntity, 'user')
                .select('user.rewardCount', 'rawRewardCount')
                .where({
                    userId
                }).getRawOne();

            const newCount = rawRewardCount + amount;

            await manager.update(ReferralUserEntity, userId, {
                rewardCount: newCount,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newCount;
        });
    }

    public async adjustDiamondCount(userId: number, amount: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.transaction(async manager => {
            const { rawDiamondCount } = await manager.createQueryBuilder(ReferralUserEntity, 'user')
                .select('user.diamondCount', 'rawDiamondCount')
                .where({
                    userId
                }).getRawOne();

            const newCount = rawDiamondCount + amount;

            await manager.update(ReferralUserEntity, userId, {
                diamondCount: newCount,
                updateTime: () => 'CURRENT_TIMESTAMP'
            });

            return newCount;
        });
    }

    public async setGroupId(userId: number, groupId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(ReferralUserEntity, userId, {
            groupId,
            updateTime: () => 'CURRENT_TIMESTAMP'
        });
    }
}
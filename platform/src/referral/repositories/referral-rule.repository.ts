import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralRuleEntity, ReferralRuleActionEntity } from '../entities';
import { ReferralRuleEntityMapper, ReferralRuleActionEntityMapper } from '../entities/mappers';
import { ReferralRule, NewReferralRule, ReferralRuleUpdate } from '../referral-rule';
import { NewReferralRuleAction, ReferralRuleAction, ReferralRuleActionUpdate } from '../referral-rule-action';

@Singleton
@LogClass()
export class ReferralRuleRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: ReferralRuleEntityMapper,
        @Inject private readonly actionMapper: ReferralRuleActionEntityMapper) {
    }

    public async getAll(): Promise<ReferralRule[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(ReferralRuleEntity, {
            order: {
                event: 'ASC',
                groupId: 'ASC',
                order: 'ASC'
            },
            relations: ['actions']
        });
        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async get(id: number): Promise<ReferralRule | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralRuleEntity, id, {
            relations: ['actions']
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(rule: NewReferralRule): Promise<ReferralRule> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(rule);
        const created = await connection.manager.save(entity);
        return await this.get(created.id) as ReferralRule;
    }

    public async update(id: number, rule: ReferralRuleUpdate): Promise<ReferralRule> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.updateToEntity(id, rule);
        await connection.manager.save(entity);
        return await this.get(id) as ReferralRule;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(ReferralRuleEntity, id);
    }

    public async addAction(ruleId: number, action: NewReferralRuleAction): Promise<ReferralRuleAction> {
        const connection = await this.db.getConnection();
        const entity = this.actionMapper.newToEntity(ruleId, action);
        const created = await connection.manager.save(entity);
        return await this.getAction(created.id) as ReferralRuleAction;
    }

    public async getAction(id: number): Promise<ReferralRuleAction | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralRuleActionEntity, id);

        if (!entity)
            return undefined;

        return this.actionMapper.fromEntity(entity);
    }

    public async updateAction(id: number, action: ReferralRuleActionUpdate): Promise<ReferralRuleAction> {
        const connection = await this.db.getConnection();
        const entity = this.actionMapper.updateToEntity(id, action);
        const created = await connection.manager.save(entity);
        return this.actionMapper.fromEntity(created);
    }

    public async removeAction(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(ReferralRuleActionEntity, id);
    }
}
import { Singleton, Inject } from '../../../core/ioc';
import { ReferralRuleEntity, SignupReferralRuleEntity, PaymentReferralRuleEntity } from '../referral-rule.entity';
import { ReferralRule, NewReferralRule, ReferralRuleUpdate } from '../../referral-rule';
import { ReferralEventType } from '../../referral-event-type';
import { ReferralRuleActionEntityMapper } from './referral-rule-action.mapper';

@Singleton
export class ReferralRuleEntityMapper {
    constructor(@Inject private readonly actionMapper: ReferralRuleActionEntityMapper) {
    }

    public fromEntity(source: ReferralRuleEntity): ReferralRule {
        if (source instanceof SignupReferralRuleEntity)
            return {
                id: source.id,
                groupId: source.groupId,
                event: ReferralEventType.SignUp,
                order: source.order,
                count: source.count,
                every: source.every ?? false,
                actions: source.actions.map(a => this.actionMapper.fromEntity(a)),
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof PaymentReferralRuleEntity)
            return {
                id: source.id,
                groupId: source.groupId,
                event: ReferralEventType.Payment,
                order: source.order,
                actions: source.actions.map(a => this.actionMapper.fromEntity(a)),
                enabled: source.enabled,
                minAmount: source.minAmount,
                minRevenue: source.minRevenue,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        throw new Error(`Unsupported referral rule event ${source.event}.`);
    }

    public newToEntity(source: NewReferralRule): ReferralRuleEntity {
        switch (source.event) {
            case ReferralEventType.SignUp:
                const signUpEntity = new SignupReferralRuleEntity();
                signUpEntity.count = source.count;
                signUpEntity.every = source.every || false;
                return this.mapNewBaseEntity(source, signUpEntity);

            case ReferralEventType.Payment:
                const paymentEntity = new PaymentReferralRuleEntity();
                paymentEntity.minAmount = source.minAmount;
                paymentEntity.minRevenue = source.minRevenue;
                return this.mapNewBaseEntity(source, paymentEntity);
        }
    }

    public updateToEntity(id: number, source: ReferralRuleUpdate): ReferralRuleEntity {
        switch (source.event) {
            case ReferralEventType.SignUp:
                const signUpEntity = new SignupReferralRuleEntity();
                signUpEntity.id = id;
                signUpEntity.count = source.count;
                signUpEntity.every = source.every || false;
                return this.mapUpdateBaseEntity(source, signUpEntity);

            case ReferralEventType.Payment:
                const paymentEntity = new PaymentReferralRuleEntity();
                paymentEntity.id = id;
                paymentEntity.minAmount = source.minAmount;
                paymentEntity.minRevenue = source.minRevenue;
                return this.mapUpdateBaseEntity(source, paymentEntity);
        }
    }

    private mapNewBaseEntity(source: NewReferralRule, target: ReferralRuleEntity): ReferralRuleEntity {
        target.event = source.event;
        target.order = source.order;
        target.groupId = source.groupId;
        target.enabled = source.enabled;
        return target;
    }

    private mapUpdateBaseEntity(source: ReferralRuleUpdate, target: ReferralRuleEntity): ReferralRuleEntity {
        target.event = source.event;
        target.order = source.order;
        target.enabled = source.enabled;
        return target;
    }
}
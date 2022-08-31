import { Singleton } from '../../../core/ioc';
import { ReferralRuleActionEntity, AwardDiamondsReferralRuleActionEntity, ChangeGroupReferralRuleActionEntity } from '../referral-rule-action.entity';
import { ReferralRuleAction, NewReferralRuleAction, ReferralRuleActionUpdate } from '../../referral-rule-action';
import { ReferralRuleActionType } from '../../referral-rule-action-type';

@Singleton
export class ReferralRuleActionEntityMapper {
    public fromEntity(source: ReferralRuleActionEntity): ReferralRuleAction {
        if (source instanceof AwardDiamondsReferralRuleActionEntity)
            return {
                id: source.id,
                ruleId: source.ruleId,
                type: ReferralRuleActionType.AwardDiamonds,
                amount: source.amount,
                target: source.target,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof ChangeGroupReferralRuleActionEntity)
            return {
                id: source.id,
                ruleId: source.ruleId,
                type: ReferralRuleActionType.ChangeGroup,
                groupId: source.groupId,
                target: source.target,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        throw new Error(`Unsupported referral rule action type ${source.type}.`);
    }

    public newToEntity(ruleId: number, source: NewReferralRuleAction): ReferralRuleActionEntity {
        switch (source.type) {
            case ReferralRuleActionType.AwardDiamonds:
                const awardDiamondsEntity = new AwardDiamondsReferralRuleActionEntity();
                awardDiamondsEntity.amount = source.amount;
                awardDiamondsEntity.target = source.target;
                return this.mapNewBaseEntity(ruleId, source, awardDiamondsEntity);

            case ReferralRuleActionType.ChangeGroup:
                const changeGroupEntity = new ChangeGroupReferralRuleActionEntity();
                changeGroupEntity.groupId = source.groupId;
                changeGroupEntity.target = source.target;
                return this.mapNewBaseEntity(ruleId, source, changeGroupEntity);
        }
    }

    public updateToEntity(id: number, source: ReferralRuleActionUpdate): ReferralRuleActionEntity {
        switch (source.type) {
            case ReferralRuleActionType.AwardDiamonds:
                const awardDiamondsEntity = new AwardDiamondsReferralRuleActionEntity();
                awardDiamondsEntity.id = id;
                awardDiamondsEntity.amount = source.amount;
                awardDiamondsEntity.target = source.target;
                awardDiamondsEntity.enabled = source.enabled;
                return awardDiamondsEntity;

            case ReferralRuleActionType.ChangeGroup:
                const changeGroupEntity = new ChangeGroupReferralRuleActionEntity();
                changeGroupEntity.id = id;
                changeGroupEntity.groupId = source.groupId;
                changeGroupEntity.target = source.target;
                changeGroupEntity.enabled = source.enabled;
                return changeGroupEntity;
        }
    }

    private mapNewBaseEntity(ruleId: number, source: NewReferralRuleAction, target: ReferralRuleActionEntity): ReferralRuleActionEntity {
        target.type = source.type;
        target.ruleId = ruleId;
        target.enabled = source.enabled;
        return target;
    }
}
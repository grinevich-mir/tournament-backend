import { ReferralRuleActionType } from './referral-rule-action-type';
import { ReferralTarget } from './referral-target';

interface NewReferralRuleActionBase {
    enabled: boolean;
}

interface ReferralRuleActionUpdateBase extends NewReferralRuleActionBase {
}

interface ReferralRuleActionBase extends NewReferralRuleActionBase {
    id: number;
    ruleId: number;
    createTime: Date;
    updateTime: Date;
}

interface AwardDiamondsReferralRuleActionBase {
    type: ReferralRuleActionType.AwardDiamonds;
    amount: number;
    target: ReferralTarget;
}

interface ChangeGroupReferralRuleActionBase {
    type: ReferralRuleActionType.ChangeGroup;
    groupId: number;
    target: ReferralTarget;
}

export type NewAwardDiamondsReferralRuleAction = AwardDiamondsReferralRuleActionBase & NewReferralRuleActionBase;
export type AwardDiamondsReferralRuleAction = AwardDiamondsReferralRuleActionBase & ReferralRuleActionBase;
export type AwardDiamondsReferralRuleActionUpdate = AwardDiamondsReferralRuleActionBase & ReferralRuleActionUpdateBase;

export type NewChangeGroupReferralRuleAction = ChangeGroupReferralRuleActionBase & NewReferralRuleActionBase;
export type ChangeGroupReferralRuleAction = ChangeGroupReferralRuleActionBase & ReferralRuleActionBase;
export type ChangeGroupReferralRuleActionUpdate = ChangeGroupReferralRuleActionBase & ReferralRuleActionUpdateBase;

export type NewReferralRuleAction = NewAwardDiamondsReferralRuleAction | NewChangeGroupReferralRuleAction;
export type ReferralRuleAction = AwardDiamondsReferralRuleAction | ChangeGroupReferralRuleAction;
export type ReferralRuleActionUpdate = AwardDiamondsReferralRuleActionUpdate | ChangeGroupReferralRuleActionUpdate;
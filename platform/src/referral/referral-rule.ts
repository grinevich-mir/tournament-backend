import { ReferralEventType } from './referral-event-type';
import { ReferralRuleAction } from './referral-rule-action';

interface NewReferralRuleBase {
    groupId: number;
    event: ReferralEventType;
    order: number;
    enabled: boolean;
}

interface ReferralRuleUpdateBase {
    event: ReferralEventType;
    order: number;
    enabled: boolean;
}

interface ReferralRuleBase extends NewReferralRuleBase {
    id: number;
    actions: ReferralRuleAction[];
    createTime: Date;
    updateTime: Date;
}

interface ReferralSignUpReferralRuleBase {
    event: ReferralEventType.SignUp;
    count: number;
    every?: boolean;
}

interface ReferralPaymentReferralRuleBase {
    event: ReferralEventType.Payment;
    minAmount?: number;
    minRevenue?: number;
}

export type NewReferralSignUpReferralRule = ReferralSignUpReferralRuleBase & NewReferralRuleBase;
export type ReferralSignUpReferralRule = ReferralSignUpReferralRuleBase & ReferralRuleBase;
export type ReferralSignUpReferralRuleUpdate = ReferralSignUpReferralRuleBase & ReferralRuleUpdateBase;

export type NewReferralPaymentReferralRule = ReferralPaymentReferralRuleBase & NewReferralRuleBase;
export type ReferralPaymentReferralRule = ReferralPaymentReferralRuleBase & ReferralRuleBase;
export type ReferralPaymentReferralRuleUpdate = ReferralPaymentReferralRuleBase & ReferralRuleUpdateBase;

export type NewReferralRule = NewReferralSignUpReferralRule | NewReferralPaymentReferralRule;
export type ReferralRule = ReferralSignUpReferralRule | ReferralPaymentReferralRule;
export type ReferralRuleUpdate = ReferralSignUpReferralRuleUpdate | ReferralPaymentReferralRuleUpdate;
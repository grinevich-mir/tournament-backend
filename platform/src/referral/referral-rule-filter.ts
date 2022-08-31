import { ReferralEventType } from './referral-event-type';

export interface ReferralRuleFilter {
    event?: ReferralEventType;
    groupId?: number;
    enabled?: boolean;
}
import { PagedFilter } from '../core';
import { ReferralReward} from './referral-reward';
import { ReferralRewardType } from './referral-reward-type';

export interface ReferralRewardFilter extends PagedFilter<ReferralReward> {
    type?: ReferralRewardType;
}
import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { ReferralReward, ReferralRewardType } from '@tcom/platform/lib/referral';
import { ReferralRewardModel } from '../referral-reward.model';
import { ReferralModelMapper } from './referral.mapper';

@Singleton
export class ReferralRewardModelMapper {
    constructor(@Inject private readonly referralModelMapper: ReferralModelMapper) {
    }

    public async map(source: ReferralReward): Promise<ReferralRewardModel> {
        switch (source.type) {
            case ReferralRewardType.Diamonds:
                return {
                    id: source.id,
                    type: ReferralRewardType.Diamonds,
                    amount: source.amount,
                    event: source.event,
                    referral: await this.referralModelMapper.map(source.referral),
                    createTime: source.createTime
                };

            case ReferralRewardType.Commission:
                return {
                    id: source.id,
                    type: ReferralRewardType.Commission,
                    commission: source.commission,
                    event: source.event,
                    level: source.level,
                    rate: source.rate,
                    referral: await this.referralModelMapper.map(source.referral),
                    sourceAmount: source.sourceAmount,
                    sourceType: source.sourceType,
                    createTime: source.createTime
                };
        }
    }
}
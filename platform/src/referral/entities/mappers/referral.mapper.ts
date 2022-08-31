import { Inject, Singleton } from '../../../core/ioc';
import { Referral } from '../../referral';
import { ReferralEntity } from '../referral.entity';
import { ReferralUserEntityMapper } from './referral-user.mapper';

@Singleton
export class ReferralEntityMapper {
    constructor(
        @Inject private readonly referralUserMapper: ReferralUserEntityMapper) {
        }

    public fromEntity(source: ReferralEntity): Referral {
        return {
            id: source.id,
            referrer: this.referralUserMapper.fromEntity(source.referrer),
            referee: this.referralUserMapper.fromEntity(source.referee),
            revenue: source.revenue,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
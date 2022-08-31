import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { Referral } from '@tcom/platform/lib/referral';
import { ReferralModel } from '../referral.model';
import { ReferralUserModelMapper } from './referral-user.mapper';

@Singleton
export class ReferralModelMapper {
    constructor(
        @Inject private readonly userMapper: ReferralUserModelMapper) {
    }

    public async map(source: Referral): Promise<ReferralModel> {
        return {
            id: source.id,
            referrer: await this.userMapper.map(source.referrer),
            referee: await this.userMapper.map(source.referee),
            revenue: source.revenue,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
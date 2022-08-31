import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { Referral } from '@tcom/platform/lib/referral';
import { UserManager } from '@tcom/platform/lib/user';
import { NotFoundError } from '@tcom/platform/lib/core';
import { ReferralModel } from '../referral.model';

@Singleton
export class ReferralModelMapper {
    constructor(@Inject private readonly userManager: UserManager) {
    }

    public async map(source: Referral): Promise<ReferralModel> {
        const refereeUser = await this.userManager.get(source.referee.userId);

        if (!refereeUser)
            throw new NotFoundError('Referee user not found.');

        return {
            id: source.id,
            displayName: refereeUser.displayName || 'Anonymous',
            active: source.referee.active,
            revenue: source.revenue,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
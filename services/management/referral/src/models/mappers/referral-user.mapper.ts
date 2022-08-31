import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { ReferralUser } from '@tcom/platform/lib/referral';
import { UserManager } from '@tcom/platform/lib/user';
import { NotFoundError } from '@tcom/platform/lib/core';
import { ReferralUserModel } from '../referral-user.model';

@Singleton
export class ReferralUserModelMapper {
    constructor(
        @Inject private readonly userManager: UserManager) {
    }

    public async map(source: ReferralUser): Promise<ReferralUserModel> {
        const user = await this.userManager.get(source.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        return {
            userId: source.userId,
            displayName: user.displayName || 'Anonymous',
            revenue: source.revenue,
            referralCount: source.referralCount,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            groupId: source.groupId,
            code: source.code,
            slug: source.slug,
            active: source.active,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
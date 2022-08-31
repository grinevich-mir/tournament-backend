import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { ReferralUser, ReferralGroupManager } from '@tcom/platform/lib/referral';
import { UserManager } from '@tcom/platform/lib/user';
import { NotFoundError } from '@tcom/platform/lib/core';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';
import { PublicReferralUserModel } from '../public-referral-user.model';
import { ReferralUserModel } from '../referral-user.model';
import { ReferralGroupModelMapper } from './referral-group.mapper';

@Singleton
export class ReferralUserModelMapper {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver,
        @Inject private readonly groupManager: ReferralGroupManager,
        @Inject private readonly groupMapper: ReferralGroupModelMapper) {
    }

    public async map(source: ReferralUser): Promise<ReferralUserModel> {
        const group = await this.groupManager.get(source.groupId);

        if (!group)
            throw new NotFoundError('Referral group not found.');

        return {
            revenue: source.revenue,
            referralCount: source.referralCount,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            code: source.code,
            group: this.groupMapper.map(group),
            slug: source.slug,
            active: source.active,
        };
    }

    public async mapPublic(source: ReferralUser): Promise<PublicReferralUserModel> {
        const user = await this.userManager.get(source.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        return {
            code: source.code,
            slug: source.slug,
            displayName: user.displayName || 'Anonymous',
            avatarUrl: this.avatarUrlResolver.resolve(user)
        };
    }
}
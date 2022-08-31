import { Singleton } from '../../../core/ioc';
import { NewReferralUser, ReferralUser } from '../../referral-user';
import { ReferralUserEntity } from '../referral-user.entity';

@Singleton
export class ReferralUserEntityMapper {
    public fromEntity(source: ReferralUserEntity): ReferralUser {
        return {
            userId: source.userId,
            code: source.code,
            slug: source.slug,
            revenue: source.revenue,
            referralCount: source.referralCount,
            rewardCount: source.rewardCount,
            diamondCount: source.diamondCount,
            active: source.active,
            groupId: source.groupId,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(source: NewReferralUser): ReferralUserEntity {
        const entity = new ReferralUserEntity();
        entity.userId = source.userId;
        entity.slug = source.slug;
        entity.code = source.code;
        entity.groupId = source.groupId;
        entity.active = source.active;
        return entity;
    }
}
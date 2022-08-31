import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ReferralGroup } from '../../referral-group';
import { ReferralGroupEntity } from '../referral-group.entity';

@Singleton
@LogClass()
export class ReferralGroupEntityMapper {
    public fromEntity(source: ReferralGroupEntity): ReferralGroup {
        return {
            id: source.id,
            name: source.name,
            default: source.default,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
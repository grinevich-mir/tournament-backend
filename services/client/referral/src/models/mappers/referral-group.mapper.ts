import { Singleton } from '@tcom/platform/lib/core/ioc';
import { ReferralGroup } from '@tcom/platform/lib/referral';
import { ReferralGroupModel } from '../referral-group.model';

@Singleton
export class ReferralGroupModelMapper {
    public map(source: ReferralGroup): ReferralGroupModel {
        return {
            id: source.id,
            name: source.name
        };
    }
}
import { Referral } from '@tcom/platform/lib/referral';
import { ReferralUserModel } from './referral-user.model';

export interface ReferralModel extends Omit<Referral, 'referrer' | 'referee'> {
    referrer: ReferralUserModel;
    referee: ReferralUserModel;
}
import { ReferralUser } from '@tcom/platform/lib/referral';

export interface ReferralUserModel extends ReferralUser {
    displayName: string;
}
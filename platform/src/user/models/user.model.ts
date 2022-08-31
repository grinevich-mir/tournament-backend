import { UserVerificationStatus } from '../user-verification-status';
import { UserAddressStatus } from '../user-address-status';
import {UserMetadata} from '../user-metadata';

export interface UserPreferencesModel {
    notifications?: UserNotificationPreferencesModel;
}

export interface UserNotificationPreferencesModel {
    sms?: boolean;
    push?: boolean;
    email?: boolean;
}

export interface UserModel {
    id: number;
    secureId: string;
    skinId: string;
    displayName?: string;
    avatarUrl?: string;
    chatToken: string;
    regCountry: string;
    country: string;
    currency?: string;
    level: number;
    identityStatus: UserVerificationStatus;
    addressStatus: UserAddressStatus;
    lastPlayed?: Date;
    consecutivePlayedDays: number;
    subscribed: boolean;
    subscribing: boolean;
    hasPaymentMethod: boolean;
    metadata?: UserMetadata;
}

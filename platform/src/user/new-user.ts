import { UserType } from './user-type';
import { UserRegistrationType } from './user-registration-type';

export interface NewUserProfile {
    forename?: string;
    surname?: string;
    dob?: Date;
    mobileNumber?: string;
    mobileVerified?: boolean;
    email: string;
    emailVerified?: boolean;
    taxId?: string;
}

export interface NewUser extends NewUserProfile {
    skinId: string;
    regType: UserRegistrationType;
    type: UserType;
    secureId?: string;
    displayName?: string;
    customAvatarId?: string;
    regCountry?: string;
    regState?: string;
    country?: string;
    currencyCode?: string;
    referredCode?: string;
    bTag?: string;
    clickId?: string;
}
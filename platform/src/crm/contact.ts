import { UserAddressStatus, UserType, UserVerificationStatus } from '../user';

export interface ContactUpdate {
    email?: string;
    emailVerified?: boolean;
    forename?: string;
    surname?: string;
    dob?: Date;
    displayName?: string;
    sms?: string;
    smsVerified?: boolean;
    level?: number;
    skinId?: string;
    type?: UserType;
    regCountry?: string;
    regState?: string;
    country?: string;
    currencyCode?: string;
    identityStatus?: UserVerificationStatus;
    addressStatus?: UserAddressStatus;
    enabled?: boolean;
    hasPlayed?: boolean;
    lastPlayed?: Date;
    hasSubscribed?: boolean;
    hasActiveSubscription?: boolean;
    subscriptionCancelling?: boolean;
    subscriptionPastDue?: boolean;
    lastSubscribed?: Date;
    hasTournamentWin?: boolean;
    lastTournamentWin?: Date;
    hasTournamentJackpotWin?: boolean;
    lastTournamentJackpotWin?: Date;
    hasPaidToPlayTournament?: boolean;
    hasPurchased?: boolean;
    hasPurchasedDiamonds?: boolean;
    lastPurchased?: Date;
    lastPurchasedDiamonds?: Date;
}

export interface NewContact extends ContactUpdate {
    userId: number;
    email: string;
    createTime: Date;
}

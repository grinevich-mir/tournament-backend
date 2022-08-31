import { PlatformEvent } from '../../core/events';
import { UserAddressStatus } from '../user-address-status';
import { UserType } from '../user-type';
import { UserVerificationStatus } from '../user-verification-status';

interface Payload {
    id: number;
    type?: UserType;
    displayName?: string;
    avatarUrl?: string;
    currencyCode?: string;
    enabled?: boolean;
    country?: string;
    regCountry?: string;
    regState?: string;
    identityStatus?: UserVerificationStatus;
    addressStatus?: UserAddressStatus;
}

export class UserUpdatedEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('User:Updated');
    }
}
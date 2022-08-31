import { UserProfile } from '../user-profile';
import { UserAddress } from '../user-address';

export interface UserProfileModel extends UserProfile {
}

export interface UserProfileUpdateModel {
    forename?: string;
    surname?: string;
    dob?: Date;
    address?: UserAddress;
    taxId?: string;
}
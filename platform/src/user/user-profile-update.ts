import { UserAddress } from './user-address';

export interface UserProfileUpdate {
    forename?: string;
    surname?: string;
    email?: string;
    mobileNumber?: string;
    mobileNumberVerified?: boolean;
    dob?: Date;
    address?: UserAddress;
    taxId?: string;
}
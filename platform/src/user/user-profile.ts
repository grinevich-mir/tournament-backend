import { UserProfileUpdate } from './user-profile-update';

export interface UserProfile extends UserProfileUpdate {
    userId: number;
    emailVerified?: boolean;
    mobileVerified?: boolean;
    createTime: Date;
    updateTime: Date;
}
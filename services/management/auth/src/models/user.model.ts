export enum UserStatus {
    Confirmed = 'CONFIRMED',
    Unconfirmed = 'UNCONFIRMED'
}

export interface UserModel {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    phone: string;
    phoneVerified: boolean;
    status: UserStatus;
    enabled: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface UsersModel {
    users: UserModel[];
    paginationToken?: string;
}

export interface UsersFilter {
    query?: string;
    pagination?: boolean;
    paginationToken?: string;
}
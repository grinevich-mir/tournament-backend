import { User } from './user';
import { PagedFilter } from '../core';
import { UserType } from './user-type';

export interface UserFilter extends PagedFilter<User> {
    enabled?: boolean;
    type?: UserType;
    subscribed?: boolean;
    subscribing?: boolean;
    regCountry?: string;
    fields?: {
        displayName?: string;
        email?: string;
        playedFrom?: Date;
        playedTo?: Date;
        lastUpdatedFrom?: Date;
        lastUpdatedTo?: Date;
        createdFrom?: Date;
        createdTo?: Date;
    };
}

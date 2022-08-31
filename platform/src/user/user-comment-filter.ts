import { PagedFilter } from '../core';
import { UserComment } from './user-comment';

export interface UserCommentFilter extends PagedFilter<UserComment> {
    userId: number;
}

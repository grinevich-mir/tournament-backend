import { Inject, Singleton } from '../core/ioc';
import { UserCommentRepository } from './repositories';
import { UserCommentFilter } from './user-comment-filter';
import { UserComment } from './user-comment';
import { NewUserComment } from './new-user-comment';
import { UserCommentUpdate } from './user-comment-update';
import { UserCommentMapper } from './entities/mappers';
import { LogClass } from '../core/logging';
import { PagedResult } from '../core';

@Singleton
@LogClass()
export class UserCommentManager {
    constructor(
        @Inject private readonly userCommentRepository: UserCommentRepository,
        @Inject private readonly userCommentMapper: UserCommentMapper) {
    }

    public async getAll(filter?: UserCommentFilter): Promise<PagedResult<UserComment>> {
        const result = await this.userCommentRepository.getAll(filter);
        const comments = result.items.map((e) => this.userCommentMapper.fromEntity(e));
        return new PagedResult(comments, result.totalCount, result.page, result.pageSize);
    }

    public async add(newComment: NewUserComment): Promise<UserComment> {
        const entity = this.userCommentMapper.newToEntity(newComment);
        const created = await this.userCommentRepository.add(entity);
        return this.userCommentMapper.fromEntity(created);
    }

    public async update(id: number, updatedComment: UserCommentUpdate): Promise<void> {
        const entity = this.userCommentMapper.updateToEntity(id, updatedComment);
        await this.userCommentRepository.update(entity);
    }

}

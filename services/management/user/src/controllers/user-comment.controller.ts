import { AdminController, Body, Get, Path, Post, Put, Query, Response, Route, Security, Tags } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserComment, UserCommentFilter, UserCommentManager, UserCommentUpdate } from '@tcom/platform/lib/user';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { NewUserCommentModel } from '../models';

@Tags('Comments')
@Route('user/comment')
@LogClass()
export class UserCommentController extends AdminController {
    constructor(@Inject private readonly commentManager: UserCommentManager) {
        super();
    }

    /**
     * @summary Get all comments for a user
     */
    @Get()
    @Security('admin', ['user:comment:read'])
    public async getAll(
        @Query() userId: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<UserComment>> {
        const filter: UserCommentFilter = {
            userId,
            page,
            pageSize
        };
        const comment = await this.commentManager.getAll(filter);
        if (!comment) throw new NotFoundError('Comment not found.');
        return comment;
    }

    /**
     * @summary Creates a comment
     */
    @Post()
    @Security('admin', ['user:comment:write'])
    public async add(@Body() entryComment: NewUserCommentModel): Promise<UserComment> {
        return this.commentManager.add({
            ...entryComment,
            author: this.user.id
        });
    }

    /**
     * @summary Updates a comment
     */
    @Put('{id}')
    @Security('admin', ['user:comment:write'])
    @Response<NotFoundError>(404, 'Comment not found')
    public async update(@Path() id: number, @Body() updateComment: UserCommentUpdate): Promise<void> {
        await this.commentManager.update(id, updateComment);
    }
}

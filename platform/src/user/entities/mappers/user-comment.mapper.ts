import { Singleton } from 'typescript-ioc';
import { UserCommentEntity } from '../user-comment.entity';
import { UserComment } from '../../user-comment';
import { NewUserComment } from '../../new-user-comment';
import { UserCommentUpdate } from '../../user-comment-update';

@Singleton
export class UserCommentMapper {
    public fromEntity(source: UserCommentEntity): UserComment {
        return {
            id: source.id,
            comment: source.comment,
            createTime: source.createTime,
            userId: source.userId,
            author: source.author,
        };
    }

    public newToEntity(source: NewUserComment): UserCommentEntity {
        const entity = new UserCommentEntity();
        entity.userId = source.userId;
        entity.comment = source.comment;
        entity.author = source.author;
        return entity;
    }

    public updateToEntity(id: number, source: UserCommentUpdate): UserCommentEntity {
        const entity = new UserCommentEntity();
        entity.id = id;
        entity.comment = source.comment;
        return entity;
    }
}

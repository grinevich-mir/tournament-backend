import { Singleton } from '../../../core/ioc';
import { UserAvatarEntity } from '../user-avatar.entity';
import { UserAvatar } from '../../user-avatar';

@Singleton
export class UserAvatarEntityMapper {
    public fromEntity(source: UserAvatarEntity): UserAvatar {
        return {
            id: source.id,
            skinId: source.skinId,
            url: source.url
        };
    }
}
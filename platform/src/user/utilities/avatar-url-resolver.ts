import { Singleton } from '../../core/ioc';
import * as env from 'env-var';
import { User } from '../user';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class AvatarUrlResolver {
    public resolve(id: string): string;
    public resolve(user: User): string | undefined;
    public resolve(idOrUser: string | User) {
        const baseUrl = env.get('CONTENT_BASE_URL').asString();

        if (!baseUrl)
            return undefined;

        if (typeof idOrUser === 'string')
            return `${baseUrl}/avatars/custom/${idOrUser}`;

        if (idOrUser.customAvatarId)
            return `${baseUrl}/avatars/custom/${idOrUser.customAvatarId}`;

        if (idOrUser.avatar)
            return idOrUser.avatar.url;

        return undefined;
    }
}
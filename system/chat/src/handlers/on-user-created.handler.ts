import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager } from '@tcom/platform/lib/chat';
import { UserCreatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserCreatedHandler extends PlatformEventHandler<UserCreatedEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
            super();
    }

    protected async process(event: Readonly<UserCreatedEvent>): Promise<void> {
        const user = event.user;
        const avatarUrl = this.avatarUrlResolver.resolve(user) || '';
        const chatUser = await this.chatManager.createUser({
            userId: user.id,
            displayName: user.displayName || 'Anonymous',
            avatarUrl,
            country: user.country || 'US',
            level: user.level
        });
        await this.userManager.setChatToken(user.id, chatUser.accessToken);
    }
}

export const onUserCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserCreatedHandler).execute(event));
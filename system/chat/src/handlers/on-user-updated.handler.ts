import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager, ChatUserUpdate } from '@tcom/platform/lib/chat';
import { UserUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserUpdatedHandler extends PlatformEventHandler<UserUpdatedEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager) {
            super();
    }

    protected async process(event: Readonly<UserUpdatedEvent>): Promise<void> {
        const payload = event.payload;

        const update: ChatUserUpdate = {};

        if (payload.displayName)
            update.displayName = payload.displayName;
        if (payload.avatarUrl)
            update.avatarUrl = payload.avatarUrl;
        if (payload.country)
            update.country = payload.country;

        if (Object.keys(update).length > 0)
            await this.chatManager.updateUser(payload.id, update);
    }
}

export const onUserUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserUpdatedHandler).execute(event));
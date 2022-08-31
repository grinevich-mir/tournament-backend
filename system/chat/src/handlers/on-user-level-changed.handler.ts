import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager } from '@tcom/platform/lib/chat';
import { UserLevelChangedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserLevelChangedHandler extends PlatformEventHandler<UserLevelChangedEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager) {
            super();
    }

    protected async process(event: Readonly<UserLevelChangedEvent>): Promise<void> {
        await this.chatManager.updateUser(event.id, {
            level: event.to
        });
    }
}

export const onUserLevelChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserLevelChangedHandler).execute(event));
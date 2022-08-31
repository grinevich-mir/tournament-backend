import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserCreatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { Voluum } from '@tcom/platform/lib/integration/voluum';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserCreatedHandler extends PlatformEventHandler<UserCreatedEvent> {
    constructor(
        @Inject private readonly voluum: Voluum,
        @Inject private readonly userManager: UserManager
    ) {
        super();
    }

    protected async process(event: Readonly<UserCreatedEvent>): Promise<void> {
        const user = await this.userManager.get(event.user.id);
        if (!user)
            return;

        if (!event.user.clickId)
            return;

        await this.voluum.sendRegEvent(event.user.clickId);

        Logger.info('Voluum', 'Registration event sent');
    }
}

export const onUserCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserCreatedHandler).execute(event));
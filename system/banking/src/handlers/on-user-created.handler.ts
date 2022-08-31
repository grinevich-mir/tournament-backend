import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserCreatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { WalletManager } from '@tcom/platform/lib/banking';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserCreatedHandler extends PlatformEventHandler<UserCreatedEvent> {
    constructor(
        @Inject private readonly walletManager: WalletManager) {
        super();
    }

    protected async process(event: Readonly<UserCreatedEvent>): Promise<void> {
        const user = event.user;
        await this.walletManager.addForUser(user.id, user.currencyCode);
    }
}

export const onUserCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserCreatedHandler).execute(event));

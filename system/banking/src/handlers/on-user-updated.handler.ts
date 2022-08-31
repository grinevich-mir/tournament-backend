import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { NotFoundError, lambdaHandler } from '@tcom/platform/lib/core';
import { WalletManager, WalletAccountManager } from '@tcom/platform/lib/banking';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserUpdatedHandler extends PlatformEventHandler<UserUpdatedEvent> {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly accountManager: WalletAccountManager) {
        super();
    }

    protected async process(event: Readonly<UserUpdatedEvent>): Promise<void> {
        const payload = event.payload;

        if (!payload.currencyCode)
            return;

        const wallet = await this.walletManager.getForUser(payload.id);

        if (!wallet)
            throw new NotFoundError(`Wallet for user '${payload.id}' not found.`);

        await this.accountManager.addUserDefaults(wallet.id, payload.currencyCode);
    }
}

export const onUserUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserUpdatedHandler).execute(event));

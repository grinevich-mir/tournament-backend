import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { CurrencyAddedEvent } from '@tcom/platform/lib/banking/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { PlatformWallets, WalletManager, WalletAccountManager } from '@tcom/platform/lib/banking';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnCurrencyAddedHandler extends PlatformEventHandler<CurrencyAddedEvent> {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly accountManager: WalletAccountManager) {
        super();
    }

    protected async process(event: Readonly<CurrencyAddedEvent>): Promise<void> {
        for (const walletName of Object.keys(PlatformWallets) as PlatformWallets[]) {
            const wallet = await this.walletManager.getForPlatform(walletName);

            if (!wallet) {
                console.error(`Platform wallet '${walletName}' could not be found.`);
                continue;
            }

            await this.accountManager.addPlatformCurrency(wallet.id, event.code);
        }
    }
}

export const onCurrencyAdded = lambdaHandler((event: SNSEvent) => IocContainer.get(OnCurrencyAddedHandler).execute(event));

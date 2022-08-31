import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { WalletManager, PlatformWallets, CurrencyManager, WalletAccountManager } from '@tcom/platform/lib/banking';

interface AddPlatformWalletEvent {
    name: PlatformWallets;
    allowNegative?: boolean;
}

@Singleton
@LogClass()
export class AddPlatformWalletHandler {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly walletAccountManager: WalletAccountManager,
        @Inject private readonly currencyManager: CurrencyManager) {
    }

    public async execute(event: AddPlatformWalletEvent): Promise<void> {
        const name = event.name;

        if (!name)
            throw new Error('Name not supplied.');

        if (!Object.keys(PlatformWallets).includes(name))
            throw new Error(`${name} is not a valid platform wallet name, please add it to the enum.`);

        const existing = await this.walletManager.getForPlatform(name);

        if (existing)
            throw new Error(`Platform wallet ${name} already exists.`);

        const wallet = await this.walletManager.addForPlatform(name);
        const currencies = await this.currencyManager.getAll();

        for (const currency of currencies)
            await this.walletAccountManager.addPlatformCurrency(wallet.id, currency.code, event.allowNegative);
    }
}

export const addPlatformWallet = lambdaHandler((event: AddPlatformWalletEvent) => IocContainer.get(AddPlatformWalletHandler).execute(event));
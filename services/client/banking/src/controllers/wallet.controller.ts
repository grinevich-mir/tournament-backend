import { Get, Route, Tags, Security, ClientController } from '@tcom/platform/lib/api';
import { UserWalletAccounts, WalletAccountManager } from '@tcom/platform/lib/banking';
import { UserWalletModel } from '@tcom/platform/lib/banking/models';
import { Inject } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

const DEFAULT_WALLET: UserWalletModel = {
    diamonds: 0,
    withdrawable: {
        balance: 0,
        currencyCode: 'USD'
    }
};

@Tags('Wallet')
@Route('banking/wallet')
@Security('cognito')
@LogClass()
export class WalletController extends ClientController {
    constructor(
        @Inject private readonly accountManager: WalletAccountManager) {
            super();
        }

    /**
     * @summary Gets the authenticated users wallet information
     */
    @Get()
    public async get(): Promise<UserWalletModel> {
        const visibleAccounts: UserWalletAccounts[] = [
            UserWalletAccounts.Withdrawable,
            UserWalletAccounts.Diamonds
        ];
        const accounts = await this.accountManager.getManyForUser(this.user.id, ...visibleAccounts);

        if (accounts.length === 0) {
            Logger.warn(`Wallet not found for user ${this.user.id}`);
            return DEFAULT_WALLET;
        }

        let withdrawableBalance = 0;
        let currencyCode = 'USD';
        let diamondsBalance = 0;

        const withdrawableAccount = accounts.find(a => a.name === UserWalletAccounts.Withdrawable);
        const diamondsAccount = accounts.find(a => a.name === UserWalletAccounts.Diamonds);

        if (withdrawableAccount) {
            withdrawableBalance = withdrawableAccount.balance;
            currencyCode = withdrawableAccount.currencyCode;
        }

        if (diamondsAccount)
            diamondsBalance = diamondsAccount.balance;

        return {
            withdrawable: {
                balance: withdrawableBalance,
                currencyCode
            },
            diamonds: diamondsBalance
        };
    }
}

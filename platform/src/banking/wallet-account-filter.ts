import { UserWalletAccounts } from './user-wallet-accounts';
import { PagedFilter } from '../core';
import { WalletAccount } from './wallet-account';

export interface WalletAccountFilter extends PagedFilter<WalletAccount> {
    walletId?: number;
    currencyCode?: string;
    name?: UserWalletAccounts;
}
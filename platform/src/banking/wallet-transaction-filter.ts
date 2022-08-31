import { UserWalletAccounts } from './user-wallet-accounts';
import { TransactionPurpose } from './transaction-purpose';
import { WalletTransaction } from './wallet-transaction';
import { PagedFilter } from '../core';

export interface WalletTransactionFilter extends PagedFilter<WalletTransaction> {
    walletId?: number;
    accountId?: number;
    accounts?: UserWalletAccounts[];
    purpose?: TransactionPurpose;
    currencyCode?: string;
    from?: Date;
    to?: Date;
}
import { TransactionPurpose } from './transaction-purpose';
import { WalletEntry } from './wallet-entry';
import { PagedFilter } from '../core';

export interface WalletEntryFilter extends PagedFilter<WalletEntry> {
    walletId?: number;
    accountId?: number;
    purpose?: TransactionPurpose;
    from?: Date;
    to?: Date;
}
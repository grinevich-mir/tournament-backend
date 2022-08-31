import { WalletType } from '../wallet-type';
import { UserWalletAccounts } from '../user-wallet-accounts';
import { PlatformWallets } from '../platform-wallets';

interface TransactionDescriptorBase {
    target: WalletType;
    type: 'Debit' | 'Credit';
    bypassFlow?: boolean;
}

interface PlatformTransactionDescriptor extends TransactionDescriptorBase {
    target: WalletType.Platform;
    wallet: PlatformWallets;
}

interface UserTransactionDescriptor extends TransactionDescriptorBase {
    target: WalletType.User;
    userId: number;
    account: UserWalletAccounts;
}

export declare type TransactionDescriptor = PlatformTransactionDescriptor | UserTransactionDescriptor;
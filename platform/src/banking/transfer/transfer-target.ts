import { WalletType } from '../wallet-type';
import { UserWalletAccounts } from '../user-wallet-accounts';
import { PlatformWallets } from '../platform-wallets';

export interface PlatformTransferTarget {
    type: WalletType.Platform;
    name: PlatformWallets;
}

export interface UserTransferTarget {
    type: WalletType.User;
    userId: number;
    account: UserWalletAccounts;
}

export declare type TransferTarget = PlatformTransferTarget | UserTransferTarget;

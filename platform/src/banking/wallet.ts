import { WalletType } from './wallet-type';
import { WalletFlow } from './wallet-flow';

interface WalletBase {
    id: number;
    type: WalletType;
    flow: WalletFlow;
    createTime: Date;
}

export interface UserWallet extends WalletBase {
    type: WalletType.User;
    userId: number;
}

export interface PlatformWallet extends WalletBase {
    type: WalletType.Platform;
    name: string;
}

export type Wallet = UserWallet | PlatformWallet;
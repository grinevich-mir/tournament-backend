import { WalletType } from './wallet-type';
import { PlatformWallets } from './platform-wallets';
import { WalletFlow } from './wallet-flow';
import { PagedFilter } from '../core';
import { Wallet } from './wallet';

export interface WalletFilter extends PagedFilter<Wallet> {
    type?: WalletType;
    userId?: number;
    name?: PlatformWallets;
    flow?: WalletFlow;
}
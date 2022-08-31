export interface WalletAccount {
    id: number;
    name: string;
    walletId: number;
    currencyCode: string;
    balance: number;
    balanceRaw: number;
    baseBalance: number;
    balanceUpdateTime: Date;
    allowNegative: boolean;
    createTime: Date;
}
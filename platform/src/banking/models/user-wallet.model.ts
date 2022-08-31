export interface UserWalletBalanceModel {
    balance: number;
    currencyCode: string;
}

export interface UserWalletModel {
    withdrawable: UserWalletBalanceModel;
    diamonds: number;
}
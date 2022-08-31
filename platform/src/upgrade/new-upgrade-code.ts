export interface NewUpgradeCode {
    code: string;
    userId: number;
    upgradeLevel: number;
    upgradeDuration: number;
    diamonds: number;
    expireTime: Date;
    processExpireTime: Date;
}
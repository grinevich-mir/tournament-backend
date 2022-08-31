export interface UpgradeLevelConfig {
    skinId: string;
    level: number;
    tournamentMaxActiveEntries: number;
    withdrawalMinAmounts?: { [currencyCode: string]: number; };
    withdrawalTargetDays: number;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}
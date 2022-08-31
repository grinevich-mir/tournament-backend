import { CashPrize, TangiblePrize, UpgradePrize } from './prize';

interface RankedPrizeBase {
    startRank: number;
    endRank: number;
}

export type CashRankedPrize = RankedPrizeBase & CashPrize;
export type TangibleRankedPrize = RankedPrizeBase & TangiblePrize;
export type UpgradeRankedPrize = RankedPrizeBase & UpgradePrize;
export type RankedPrize = CashRankedPrize | TangibleRankedPrize | UpgradeRankedPrize;
import { PrizeType } from './prize-type';

interface PrizeBase {
    type: PrizeType;
}

export interface CashPrize extends PrizeBase {
    type: PrizeType.Cash;
    amount: number;
    currencyCode: string;
}

export interface UpgradePrize extends PrizeBase {
    type: PrizeType.Upgrade;
    level: number;
    duration: number;
}

export interface TangiblePrize extends PrizeBase {
    type: PrizeType.Tangible;
    name: string;
    shortName: string;
    imageUrl: string;
    cashAlternativeAmount: number;
}

export type Prize = CashPrize | TangiblePrize | UpgradePrize;
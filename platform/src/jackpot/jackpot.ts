import { JackpotType } from './jackpot-type';

interface JackpotBase {
    id: number;
    type: JackpotType;
    name: string;
    label: string;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}

interface CashJackpot extends JackpotBase {
    seed: number;
    balance: number;
    balanceUpdateTime: Date;
    splitPayout: boolean;
    lastPayoutTime?: Date;
    lastPayoutAmount?: number;
}

export interface TangibleJackpot extends JackpotBase {
    type: JackpotType.Tangible;
    imageUrl: string;
}

export interface FixedJackpot extends CashJackpot {
    type: JackpotType.Fixed;
}

export interface ProgressiveJackpot extends CashJackpot {
    type: JackpotType.Progressive;
    contributionGroup: string;
    contributionMultiplier: number;
    maxContribution?: number;
    maxBalance?: number;
}

export type Jackpot = FixedJackpot | ProgressiveJackpot | TangibleJackpot;
import { JackpotType } from './jackpot-type';

interface NewJackpotBase {
    type: JackpotType;
    label: string;
    name: string;
}

interface NewCashJackpot extends NewJackpotBase {
    seed?: number;
    splitPayout?: boolean;
}

export interface NewFixedJackpot extends NewCashJackpot {
    type: JackpotType.Fixed;
}

export interface NewProgressiveJackpot extends NewCashJackpot {
    type: JackpotType.Progressive;
    contributionGroup: string;
    contributionMultiplier: number;
    maxContribution?: number;
    maxBalance?: number;
}

export interface NewTangibleJackpot extends NewJackpotBase {
    type: JackpotType.Tangible;
    imageUrl: string;
}

export type NewJackpot = NewFixedJackpot | NewProgressiveJackpot | NewTangibleJackpot;
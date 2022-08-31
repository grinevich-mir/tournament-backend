import { JackpotType } from './jackpot-type';

export interface JackpotFilter {
    type?: JackpotType;
    enabled?: boolean;
}
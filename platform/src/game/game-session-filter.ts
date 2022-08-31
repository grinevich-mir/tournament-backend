import { GameSessionStatus } from './game-session-status';

export interface SingleGameSessionFilter {
    currencyCode?: string;
    statuses?: GameSessionStatus[];
    expired?: boolean;
}
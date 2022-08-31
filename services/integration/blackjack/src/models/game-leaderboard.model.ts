import { Prize } from '@tcom/platform/lib/prize';

export interface GameLeaderboardInfoRequestModel {
    gameId: number;
}

export interface GameLeaderboardRequestModel extends GameLeaderboardInfoRequestModel {
    token: string;
    count: number;
    mode?: string;
}

export interface GameLeaderboardTopRequestModel {
    gameId: number;
    token: string;
    count: number;
}

export interface GameLeaderboardPositionModel {
    rank: number;
    points: number;
    displayName: string;
    isPlayer: boolean;
}

export interface GameLeaderboardInfoResponseModel {
    totalCount: number;
    prizes: Prize[];
}

export interface GameLeaderboardResponseModel extends GameLeaderboardInfoResponseModel {
    positions: GameLeaderboardPositionModel[];
}
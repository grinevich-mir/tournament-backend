export interface GameAuthRequestModel {
    token: string;
    gameId: number;
}

export interface GameAuthResponseModel {
    playerId: string;
    token: string;
    nickname?: string;
    inPlay: boolean;
}

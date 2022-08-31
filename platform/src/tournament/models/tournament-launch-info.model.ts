
export interface TournamentLaunchInfoModel {
    tournamentId: number;
    type: 'webview' | 'embedded';
    location: string;
    chatChannel?: string;
}

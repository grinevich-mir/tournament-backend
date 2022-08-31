import { TournamentIntroUpdate } from './tournament-intro-update';

export interface TournamentIntro extends TournamentIntroUpdate {
    id: number;
    createTime: Date;
    updateTime: Date;
}
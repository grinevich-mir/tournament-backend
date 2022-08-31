import { Inject, Singleton } from '../../core/ioc';
import { TournamentGameUrlResolver } from './tournament-game-url-resolver';
import { Tournament } from '../tournament';
import { TournamentLaunchInfoModel } from '../models';
import { TournamentEntry } from '../tournament-entry';
import { DeviceType } from '../../core';

@Singleton
export class TournamentLaunchInfoResolver {
    constructor(@Inject private readonly urlResolver: TournamentGameUrlResolver) {
    }

    public async resolve(tournament: Tournament, entry: TournamentEntry, deviceType?: DeviceType): Promise<TournamentLaunchInfoModel> {
        const location = await this.urlResolver.resolve(tournament, entry, deviceType);
        let chatChannel: string | undefined;

        if (tournament.chatEnabled)
            chatChannel = tournament.chatChannel || `Tournament_${tournament.id}`;

        return {
            tournamentId: tournament.id,
            type: 'webview',
            location,
            chatChannel
        };
    }
}
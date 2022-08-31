import { Singleton, Inject } from '../core/ioc';
import { TournamentWinnerCache } from './cache';
import { TournamentWinner } from './tournament-winner';
import { TournamentManager } from './tournament-manager';
import { TournamentEntryManager } from './tournament-entry-manager';
import { UserManager } from '../user';
import { NotFoundError } from '../core';
import uuid from 'uuid/v4';
import Logger, { LogClass } from '../core/logging';
import { Prize } from '../prize';

@Singleton
@LogClass()
export class TournamentWinnerManager {
    constructor(
        @Inject private readonly cache: TournamentWinnerCache,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly entryManager: TournamentEntryManager,
        @Inject private readonly userManager: UserManager) {
    }

    public async add(entryId: number, prize: Prize): Promise<void> {
        const entry = await this.entryManager.getById(entryId, true);

        if (!entry)
            throw new NotFoundError(`Entry ${entryId} not found.`);

        const tournament = await this.tournamentManager.get(entry.tournamentId, true);

        if (!tournament)
            throw new NotFoundError(`Tournament ${entry.tournamentId} not found.`);

        if (!tournament.public) {
            Logger.info(`Tournament ${tournament.id} is not public, ignored.`);
            return;
        }

        const user = await this.userManager.get(entry.userId);

        if (!user)
            throw new NotFoundError(`User ${entry.userId} not found.`);

        const winner: TournamentWinner = {
            id: uuid(),
            entryId: entry.id,
            skins: tournament.skins,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            tournamentType: tournament.type,
            userId: entry.userId,
            prize,
            date: new Date()
        };

        await this.cache.add(winner);
    }

    public async getAll(skinId: string, count: number): Promise<TournamentWinner[]> {
        return this.cache.getAll(skinId, count);
    }
}
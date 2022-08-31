import { ForbiddenError, NotFoundError, BadRequestError } from '../../core';
import moment from 'moment';
import { UserType, UserManager } from '../../user';
import { Singleton, Inject } from '../../core/ioc';
import { UpgradeConfigManager } from '../../upgrade/upgrade-config-manager';
import { TournamentEntryCache, TournamentCache } from '../cache';
import { Tournament } from '../tournament';
import Logger, { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class TournamentEntryValidator {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly upgradeConfigManager: UpgradeConfigManager,
        @Inject private readonly tournamentCache: TournamentCache,
        @Inject private readonly entryCache: TournamentEntryCache) {
    }

    public async validate(tournament: Tournament, userId: number): Promise<void> {
        if (tournament.playerCount >= tournament.maxPlayers)
            throw new ForbiddenError('Tournament has reached capacity.');

        if (!tournament.allowJoinAfterStart && moment().isSameOrAfter(tournament.startTime))
            throw new ForbiddenError('Tournament has already started.');

        if (moment().isSameOrAfter(tournament.entryCutOffTime))
            throw new ForbiddenError('Tournament entry cut off time has lapsed.');

        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!user.displayName || !user.currencyCode)
            throw new BadRequestError('Display name or currency code missing.');

        if (user.type !== UserType.Standard)
            return;

        if (!tournament.public)
            throw new ForbiddenError('Access Denied');

        if (user.level < tournament.minLevel)
            throw new ForbiddenError(`You must be level ${tournament.minLevel} or higher to enter this tournament.`);

        if (tournament.maxLevel !== undefined && tournament.maxLevel !== null && user.level > tournament.maxLevel)
            throw new ForbiddenError(`You must be level ${tournament.maxLevel} or lower to enter this tournament.`);

        const config = await this.upgradeConfigManager.getForLevel(user.skinId, user.level);

        if (!config) {
            Logger.warn(`Could not find an upgrade level config for ${user.skinId} level ${user.level}.`);
            return;
        }

        if (!config.enabled)
            return;

        const joinedCount = await this.countJoined(userId);

        if (joinedCount >= config.tournamentMaxActiveEntries)
            throw new ForbiddenError('Maximum active entries reached.');
    }

    private async countJoined(userId: number): Promise<number> {
        let count = 0;

        const tournaments = await this.tournamentCache.getAll();

        for (const tournament of tournaments)
            if (await this.entryCache.exists(tournament.id, userId))
                count++;

        return count;
    }
}
import { Singleton, Inject } from '../core/ioc';
import { TournamentCache } from './cache';
import { TournamentRepository } from './repositories';
import { TournamentEntityMapper, TournamentEntryEntityMapper } from './entities/mappers';
import { Tournament } from './tournament';
import { TournamentFilter } from './tournament-filter';
import { UserTournament } from './user-tournament';
import { NotFoundError, Region, BadRequestError, PagedResult } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { TournamentCreatedEvent, TournamentUpdatedEvent, TournamentCompleteEvent } from './events';
import { TournamentState, TournamentStateGroups } from './tournament-state';
import moment from 'moment';
import { TournamentType } from './tournament-type';
import { LeaderboardManager, LeaderboardType, LeaderboardInfo } from '../leaderboard';
import { TournamentLeaderboardMode } from './tournament-leaderboard-mode';
import Logger, { LogClass } from '../core/logging';
import { TournamentTemplateManager } from './tournament-template-manager';
import { TournamentTemplate } from './tournament-template';
import { TournamentUpdate } from './tournament-update';
import { RankedPrize } from '../prize';
import { JackpotTrigger } from '../jackpot';
import _ from 'lodash';

@Singleton
@LogClass()
export class TournamentManager {
    constructor(
        @Inject private readonly cache: TournamentCache,
        @Inject private readonly tournamentRepository: TournamentRepository,
        @Inject private readonly templateManager: TournamentTemplateManager,
        @Inject private readonly tournamentEntityMapper: TournamentEntityMapper,
        @Inject private readonly entryEntityMapper: TournamentEntryEntityMapper,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
    }

    public async getActive(): Promise<Tournament[]> {
        return this.cache.getAll();
    }

    public async getAll(filter?: TournamentFilter): Promise<PagedResult<Tournament>> {
        const result = await this.tournamentRepository.getAll(filter);
        const tournaments = result.items.map(e => this.tournamentEntityMapper.fromEntity(e));
        return new PagedResult(tournaments, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number, cacheOnly: boolean = false): Promise<Tournament | undefined> {
        const cachedItem = await this.cache.get(id);

        if (cachedItem || cacheOnly)
            return cachedItem;

        const entity = await this.tournamentRepository.get(id);

        if (!entity)
            return undefined;

        const tournament = this.tournamentEntityMapper.fromEntity(entity);
        await this.cache.store(tournament);
        return tournament;
    }

    public async getByTaskId(taskId: string): Promise<Tournament | undefined> {
        const entity = await this.tournamentRepository.getByTaskId(taskId);

        if (!entity)
            return undefined;

        return this.tournamentEntityMapper.fromEntity(entity);
    }

    public async getAllForUser(userId: number, filter?: TournamentFilter): Promise<PagedResult<UserTournament>> {
        const result = await this.tournamentRepository.getAllForUser(userId, filter);
        const items = result.items.map(t => {
            const tournament = this.tournamentEntityMapper.fromEntity(t) as UserTournament;

            if (t.entries.length > 0)
                tournament.entry = this.entryEntityMapper.fromEntity(t.entries[0]);

            return tournament;
        });

        return new PagedResult(items, result.totalCount, result.page, result.pageSize);
    }

    public async getForLaunch(region?: Region): Promise<Tournament[]> {
        const entities = await this.tournamentRepository.getForLaunch(region);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.tournamentEntityMapper.fromEntity(e));
    }

    public async getUnlaunched(region?: Region): Promise<Tournament[]> {
        const entities = await this.tournamentRepository.getUnlaunched(region);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.tournamentEntityMapper.fromEntity(e));
    }

    public async addFromTemplate(templateId: number, launchTime: Date, startTime: Date): Promise<Tournament>;
    public async addFromTemplate(template: TournamentTemplate, launchTime: Date, startTime: Date): Promise<Tournament>;
    public async addFromTemplate(idOrTemplate: number | TournamentTemplate, launchTime: Date, startTime: Date): Promise<Tournament> {
        let template: TournamentTemplate | undefined;

        if (typeof idOrTemplate === 'number') {
            template = await this.templateManager.get(idOrTemplate);

            if (!template)
                throw new NotFoundError(`Template ${idOrTemplate} not found.`);
        } else
            template = idOrTemplate;

        if (template.chatChannel)
            template.chatChannel = template.chatChannel
                .replace(/YYYYMMDD/i, moment(startTime).format('YYYYMMDD'))
                .replace(/YYYYMM/i, moment(startTime).format('YYYYMM'))
                .replace(/YYYY/i, moment(startTime).format('YYYY'));

        const newEntity = await this.tournamentEntityMapper.templateToEntity(template, launchTime, startTime);
        let tournament = this.tournamentEntityMapper.fromEntity(newEntity);

        const expireTime = this.cache.getExpireTime(tournament);

        if (newEntity.leaderboardMode !== TournamentLeaderboardMode.Disabled) {
            const info = await this.createLeaderboard(tournament);
            newEntity.leaderboardId = info.id;
        }

        const created = await this.tournamentRepository.add(newEntity);
        tournament = this.tournamentEntityMapper.fromEntity(created);

        await this.cache.store(tournament, expireTime);

        await this.eventDispatcher.send(new TournamentCreatedEvent({
            id: created.id,
            chatEnabled: created.chatEnabled,
            chatChannel: created.chatChannel,
            name: created.name
        }));

        return tournament;
    }

    public async update(id: number, update: TournamentUpdate): Promise<void> {
        await this.cache.lock(id, async () => {
            const tournament = await this.get(id);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            const startTimeChanged = update.startTime && !moment(update.startTime).isSame(tournament.startTime);
            const endTimeChanged = update.endTime && !moment(update.endTime).isSame(tournament.endTime);

            if (startTimeChanged || endTimeChanged) {
                if (startTimeChanged && update.startTime) {
                    update.startTime = moment(update.startTime).startOf('minute').toDate();

                    if (moment().add(10, 'minutes').isSameOrAfter(update.startTime))
                        throw new BadRequestError('There must be at least 10 minutes before the tournament start time.');
                }

                if (endTimeChanged && update.endTime)
                    update.endTime = moment(update.endTime).startOf('minute').toDate();

                if (update.startTime && update.endTime && moment(update.endTime).isSameOrBefore(update.startTime))
                    throw new BadRequestError('End time cannot be the same or before the start time.');
            }

            const entity = this.tournamentEntityMapper.updateToEntity(id, update);
            await this.tournamentRepository.update(entity);
            await this.refreshCacheById(id);

            await this.eventDispatcher.send(new TournamentUpdatedEvent({
                id,
                endTimeChanged,
                endTime: update.endTime
            }));
        });
    }

    public async updatePrizes(id: number, prizes: RankedPrize[]): Promise<void> {
        await this.cache.lock(id, async () => {
            let tournament = await this.get(id);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            if (tournament.state > TournamentState.Running)
                throw new BadRequestError('Tournament has ended.');

            prizes = _.orderBy(prizes, e => e.startRank, 'asc');

            const entities = prizes.map(p => this.tournamentEntityMapper.prizeToEntity(p));
            await this.tournamentRepository.updatePrizes(id, entities);
            tournament = await this.refreshCacheById(id);

            if (!tournament.leaderboardId)
                return;

            await this.leaderboardManager.updatePrizes(tournament.leaderboardId, prizes);
        });
    }

    public async updateEntryCosts(id: number, entryCosts: number[]): Promise<void> {
        await this.cache.lock(id, async () => {
            let tournament = await this.get(id);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            if (tournament.state > TournamentState.Running)
                throw new BadRequestError('Tournament has ended.');

            const entities = entryCosts.map(c => this.tournamentEntityMapper.entryCostToEntity(c));
            await this.tournamentRepository.updateEntryCosts(id, entities);
            tournament = await this.refreshCacheById(id);
        });
    }

    public async updateJackpotTriggers(id: number, triggers: JackpotTrigger[]): Promise<void> {
        await this.cache.lock(id, async () => {
            const tournament = await this.get(id);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            if (tournament.state > TournamentState.Running)
                throw new BadRequestError('Tournament has ended.');

            triggers = _.orderBy(triggers, e => e.threshold, 'desc');

            const entities = triggers.map(p => this.tournamentEntityMapper.jackpotTriggerToEntity(p));
            await this.tournamentRepository.updateJackpotTriggers(id, entities);
            await this.refreshCacheById(id);
        });
    }

    public async setState(id: number, state: TournamentState): Promise<void> {
        await this.cache.lock(id, async () => {
            const tournament = await this.get(id);

            if (!tournament || tournament.state === state)
                return;

            await this.tournamentRepository.setState(id, state);

            tournament.state = state;
            tournament.updateTime = new Date();

            const expireTime = this.cache.getExpireTime(tournament);

            if (state >= TournamentState.Ended) {
                tournament.completeTime = new Date();

                if (tournament.leaderboardId)
                    await this.leaderboardManager.expire(tournament.leaderboardId, expireTime);

                await this.eventDispatcher.send(new TournamentCompleteEvent({
                    id,
                    state
                }));
            }

            await this.cache.store(tournament, expireTime);
        });
    }

    public async updatePlayerCount(id: number): Promise<void> {
        await this.cache.lock(id, async () => {
            const tournament = await this.get(id);

            if (!tournament)
                return;

            const count = await this.tournamentRepository.updatePlayerCount(id);
            tournament.playerCount = count;
            tournament.updateTime = new Date();
            await this.cache.store(tournament);
        });
    }

    public async addTaskId(id: number, taskId: string): Promise<void> {
        await this.tournamentRepository.addTaskId(id, taskId);
    }

    public async getTaskId(id: number): Promise<string | undefined> {
        return this.tournamentRepository.getTaskId(id);
    }

    public async removeTaskId(id: number): Promise<void> {
        await this.tournamentRepository.removeTaskId(id);
    }

    public async getTaskDefinition(type: TournamentType): Promise<string | undefined> {
        const definition = await this.tournamentRepository.getTaskDefinition(type);

        if (!definition)
            return;

        return definition;
    }

    public async refreshCache(): Promise<void> {
        await this.cache.clear();

        const result = await this.getAll({
            enabled: true,
            states: TournamentStateGroups.Active
        });

        if (result.totalCount === 0)
            return;

        for (const tournament of result.items)
            await this.cache.store(tournament);
    }

    public async refreshCacheById(id: number): Promise<Tournament> {
        const entity = await this.tournamentRepository.get(id);

        if (!entity)
            throw new NotFoundError('Tournament not found.');

        const tournament = this.tournamentEntityMapper.fromEntity(entity);
        await this.cache.store(tournament);
        return tournament;
    }

    private async createLeaderboard(tournament: Tournament): Promise<LeaderboardInfo> {
        Logger.debug(`Adding leaderboard...`);
        const leaderboard = await this.leaderboardManager.add({
            type: LeaderboardType.Tournament,
            pointConfig: tournament.leaderboardPointConfig,
            prizes: tournament.prizes
        });
        return leaderboard;
    }

    public async getByLeaderboardId(leaderboardId: number): Promise<Tournament | undefined> {
        const entity = await this.tournamentRepository.getByLeaderboardId(leaderboardId);

        if (!entity)
            throw new NotFoundError('Tournament not found.');

        const tournament = this.tournamentEntityMapper.fromEntity(entity);

        return tournament;

    }
}

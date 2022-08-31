import { TournamentEntryRepository } from './repositories';
import { Singleton, Inject } from '../core/ioc';
import { TournamentEntryValidator } from './utilities';
import { NotFoundError, ForbiddenError } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { TournamentEnteredEvent, TournamentEntryActivatedEvent, TournamentEntryRefundedEvent, TournamentLeftEvent } from './events';
import { TournamentState } from './tournament-state';
import Logger, { UserLog, LogClass } from '../core/logging';
import { LeaderboardManager, LeaderboardProgressManager } from '../leaderboard';
import { TournamentEntryAllocationUpdate } from './tournament-entry-allocation-update';
import { Websocket } from '../websocket';
import _ from 'lodash';
import { TournamentModelMapper } from './models';
import { TournamentEntry } from './tournament-entry';
import { TournamentEntryEntityMapper } from './entities/mappers';
import { TournamentEntryCache } from './cache';
import moment from 'moment';
import { TournamentManager } from './tournament-manager';
import { Tournament } from './tournament';
import { Prize } from '../prize';
import { NewTournamentEntryAllocation } from './new-tournament-entry-allocation';
import { TournamentEntryAllocation } from './tournament-entry-allocation';
import { Ledger, PlatformWallets, RequesterType, TransactionPurpose, UserWalletAccounts } from '../banking';
import { TournamentLeaderboardPointMode } from './tournament-leaderboard-point-mode';

export interface TournamentEntryAllocationResult {
    allocation?: TournamentEntryAllocation;
    remaining?: number;
    added: boolean;
}

@Singleton
@LogClass()
export class TournamentEntryManager {
    constructor(
        @Inject private readonly cache: TournamentEntryCache,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly entryRepository: TournamentEntryRepository,
        @Inject private readonly entryValidator: TournamentEntryValidator,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly progressManager: LeaderboardProgressManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly userLog: UserLog,
        @Inject private readonly websocket: Websocket,
        @Inject private readonly entityMapper: TournamentEntryEntityMapper,
        @Inject private readonly modelMapper: TournamentModelMapper,
        @Inject private readonly ledger: Ledger) {
    }

    public async get(tournamentId: number, userId: number, cachedOnly: boolean = false): Promise<TournamentEntry | undefined> {
        const cachedEntry = await this.cache.get(tournamentId, userId);

        if (cachedEntry || cachedOnly)
            return cachedEntry;

        const entryEntity = await this.entryRepository.get(tournamentId, userId);

        if (!entryEntity)
            return undefined;

        return this.entityMapper.fromEntity(entryEntity);
    }

    public async getById(id: number, cachedOnly: boolean = false): Promise<TournamentEntry | undefined> {
        const cachedEntry = await this.cache.getById(id);

        if (cachedEntry || cachedOnly)
            return cachedEntry;

        const entryEntity = await this.entryRepository.getById(id);

        if (!entryEntity)
            return undefined;

        return this.entityMapper.fromEntity(entryEntity);
    }

    public async getByToken(token: string, cachedOnly: boolean = false): Promise<TournamentEntry | undefined> {
        const cachedEntry = await this.cache.getByToken(token);

        if (cachedEntry || cachedOnly)
            return cachedEntry;

        const entryEntity = await this.entryRepository.getByToken(token);

        if (!entryEntity)
            return undefined;

        return this.entityMapper.fromEntity(entryEntity);
    }

    public async getAll(tournamentId: number, cachedOnly: boolean = false): Promise<TournamentEntry[]> {
        const cachedEntries = await this.cache.getAll(tournamentId);

        if (cachedEntries.length > 0 || cachedOnly)
            return cachedEntries;

        const entryEntities = await this.entryRepository.getAll(tournamentId);

        if (entryEntities.length === 0)
            return [];

        return entryEntities.map(e => this.entityMapper.fromEntity(e));
    }

    public async getMultiple(tournamentId: number, userIds: number[], cachedOnly: boolean = false): Promise<TournamentEntry[]> {
        const cachedEntries = await this.cache.getMultiple(tournamentId, userIds);

        if (cachedEntries.length > 0 || cachedOnly)
            return cachedEntries;

        const entryEntities = await this.entryRepository.getMultiple(tournamentId, userIds);

        if (entryEntities.length === 0)
            return [];

        return entryEntities.map(e => this.entityMapper.fromEntity(e));
    }

    public async getRefundable(tournamentId: number, count: number = 100): Promise<TournamentEntry[]> {
        const entryEntities = await this.entryRepository.getRefundable(tournamentId, count);

        if (entryEntities.length === 0)
            return [];

        return entryEntities.map(e => this.entityMapper.fromEntity(e));
    }

    public async getWinners(tournamentId: number): Promise<TournamentEntry[]> {
        const entities = await this.entryRepository.getWinners(tournamentId);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async exists(tournamentId: number, userId: number, cachedOnly: boolean = false): Promise<boolean> {
        const existsInCache = await this.cache.exists(tournamentId, userId);

        if (existsInCache || cachedOnly)
            return existsInCache;

        return this.entryRepository.exists(tournamentId, userId);
    }

    public async activate(id: number): Promise<void> {
        await this.cache.lock(id, async () => {
            const entry = await this.getById(id);

            if (!entry)
                throw new NotFoundError('Entry not found.');

            if (entry.activatedTime) {
                Logger.warn(`Entry ${id} is already activated, ignoring.`);
                return;
            }

            entry.activatedTime = new Date();
            entry.updateTime = new Date();

            await this.entryRepository.setActivatedTime(id, entry.activatedTime);
            await this.cache.store(entry);

            await this.eventDispatcher.send(new TournamentEntryActivatedEvent({
                id: entry.id,
                userId: entry.userId,
                tournamentId: entry.tournamentId
            }));
        });
    }

    public async setKnockedOut(tournamentId: number, userId: number, knockedOut: boolean): Promise<void> {
        const entryEntity = await this.entryRepository.get(tournamentId, userId);

        if (!entryEntity)
            throw new NotFoundError(`Entry for user ${userId} in tournament ${tournamentId} not found.`);

        await this.cache.lock(entryEntity.id, async () => {
            await this.entryRepository.setKnockedOut(tournamentId, userId, knockedOut);
            entryEntity.knockedOut = true;
            entryEntity.updateTime = new Date();
            const entry = this.entityMapper.fromEntity(entryEntity);
            await this.cache.store(entry);
        });
    }

    public async refund(id: number): Promise<void>;
    public async refund(entry: TournamentEntry): Promise<void>;
    public async refund(idOrEntry: number | TournamentEntry): Promise<void> {
        let entry: TournamentEntry | undefined;

        if (typeof idOrEntry === 'number')
            entry = await this.getById(idOrEntry);
        else
            entry = idOrEntry;

        if (!entry)
            throw new NotFoundError(`Entry ${idOrEntry} not found.`);

        if (!entry.totalCost)
            return;

        if (entry.refundTime) {
            Logger.error(`Entry ${entry.id} has already been refunded!`);
            return;
        }

        await this.ledger.transfer(entry.totalCost, 'DIA')
            .purpose(TransactionPurpose.Refund)
            .requestedBy(RequesterType.User, entry.userId)
            .memo(`Refund for tournament ${entry.tournamentId} entry ${entry.id}`)
            .fromPlatform(PlatformWallets.Corporate)
            .toUser(entry.userId, UserWalletAccounts.Diamonds)
            .commit();

        entry.refundTime = new Date();
        await this.entryRepository.setRefundTime(entry.id, entry.refundTime);

        if (await this.cache.exists(entry.tournamentId, entry.userId))
            await this.cache.store(entry);

        await this.eventDispatcher.send(new TournamentEntryRefundedEvent({
            id: entry.id,
            userId: entry.userId,
            tournamentId: entry.tournamentId,
            refundedCost: entry.totalCost
        }));
    }

    public async addPrize(entryId: number, prize: Prize): Promise<void> {
        const prizeEntity = this.entityMapper.prizeToEntity(entryId, prize);
        await this.entryRepository.addPrize(prizeEntity);
    }

    public async addPrizes(entryId: number, prizes: Prize[]): Promise<Prize[]> {
        const prizeEntities = prizes.map(prize => this.entityMapper.prizeToEntity(entryId, prize));
        await this.entryRepository.addPrizes(prizeEntities);
        return prizes;
    }

    public async add(tournamentId: number, userId: number, bypassChecks: boolean = false): Promise<TournamentEntry> {
        return this.userLog.handle(userId, 'Tournament:Entry:Create', async (logData) => {
            logData.tournamentId = tournamentId;

            const tournament = await this.tournamentManager.get(tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            let cost = 0;

            if (!bypassChecks) {
                await this.entryValidator.validate(tournament, userId);

                cost = tournament.entryCosts?.length > 0 ? tournament.entryCosts[0] : 0;

                if (cost > 0)
                    await this.ledger.transfer(cost, 'DIA')
                        .purpose(TransactionPurpose.BuyIn)
                        .requestedBy(RequesterType.User, userId)
                        .memo(`Entry allocation for tournament ${tournament.id}`)
                        .fromUser(userId, UserWalletAccounts.Diamonds)
                        .toPlatform(PlatformWallets.Corporate)
                        .commit();
            }

            const entryEntity = await this.entryRepository.add(tournamentId, userId, tournament.entryAllocationRounds, tournament.entryAllocationCredit, cost);
            const entry = this.entityMapper.fromEntity(entryEntity);
            await this.cache.store(entry, this.getCacheExpireTime(tournament));

            if (tournament.leaderboardId)
                await this.leaderboardManager.addEntry(tournament.leaderboardId, entryEntity.userId);

            logData.tournamentEntryId = entryEntity.id;

            await this.tournamentManager.updatePlayerCount(tournamentId);
            await this.eventDispatcher.send(new TournamentEnteredEvent({
                entryId: entryEntity.id,
                id: tournamentId,
                userId
            }));

            return entry;
        });
    }

    public async getOrAddAllocation(tournament: Tournament, entry: TournamentEntry): Promise<TournamentEntryAllocationResult> {
        let completedCount = 0;

        const result: TournamentEntryAllocationResult = {
            added: false
        };

        if (entry.allocations && entry.allocations.length > 0) {
            completedCount = _.countBy(entry.allocations, a => a.complete).true;
            result.allocation = this.getCurrentAllocation(entry);
        }

        if (!result.allocation && (!tournament.maxEntryAllocations || completedCount < tournament.maxEntryAllocations)) {
            result.allocation = await this.addAllocation(entry.id, {
                credit: tournament.entryAllocationCredit,
                rounds: tournament.entryAllocationRounds
            });
            result.added = true;
        }

        if (tournament.maxEntryAllocations)
            result.remaining = tournament.maxEntryAllocations - completedCount;

        return result;
    }

    public getCurrentAllocation(entry: TournamentEntry): TournamentEntryAllocation | undefined {
        if (!entry.allocations || entry.allocations.length === 0)
            return undefined;

        return _.chain(entry.allocations)
            .filter(a => !a.complete)
            .sortBy(a => a.createTime)
            .first()
            .value();
    }

    public async addAllocation(entryId: number, newAlloc: NewTournamentEntryAllocation): Promise<TournamentEntryAllocation> {
        return this.cache.lock(entryId, async () => {
            const entry = await this.getById(entryId);

            if (!entry)
                throw new NotFoundError('Entry not found.');

            const tournament = await this.tournamentManager.get(entry.tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            const cost = tournament.entryCosts ? tournament.entryCosts[entry.allocations.length] ?? _.last(tournament.entryCosts) : 0;

            if (cost > 0)
                await this.ledger.transfer(cost, 'DIA')
                    .purpose(TransactionPurpose.BuyIn)
                    .requestedBy(RequesterType.User, entry.userId)
                    .memo(`Entry allocation for tournament ${tournament.id} entry ${entryId}`)
                    .fromUser(entry.userId, UserWalletAccounts.Diamonds)
                    .toPlatform(PlatformWallets.Corporate)
                    .commit();

            if (tournament.leaderboardId) {
                if (tournament.leaderboardPointMode === TournamentLeaderboardPointMode.Highest)
                    await this.leaderboardManager.adjustPoints(tournament.leaderboardId, {
                        userId: entry.userId,
                        points: 0,
                        reset: 'Running'
                    });

                await this.progressManager.reset(tournament.leaderboardId, entry.userId);
            }

            const entity = await this.entryRepository.addAllocation(entryId, newAlloc.rounds, newAlloc.credit, cost);
            if (cost > 0)
                await this.entryRepository.incrementCost(entry.id, cost);
            const allocation = this.entityMapper.allocationFromEntity(entity);

            if (!entry.allocations)
                entry.allocations = [];

            entry.allocations.push(allocation);
            entry.totalCost = (entry.totalCost || 0) + cost;
            await this.cache.store(entry);

            await this.websocket.send({
                type: 'User',
                userId: entry.userId
            }, 'Tournament:Entry:Update',
                this.modelMapper.mapEntry(entry));

            return allocation;
        });
    }

    public async updateAllocation(entryId: number, allocationId: number, update: TournamentEntryAllocationUpdate): Promise<void> {
        await this.cache.lock(entryId, async () => {
            const entry = await this.getById(entryId);

            if (!entry)
                throw new NotFoundError('Entry not found.');

            const currentAllocation = entry.allocations.find(a => a.id === allocationId);

            if (!currentAllocation)
                throw new NotFoundError('Allocation not found.');

            if (update.credit !== undefined)
                currentAllocation.credit = update.credit;

            if (update.rounds !== undefined)
                currentAllocation.rounds = update.rounds;

            if (update.complete !== undefined)
                currentAllocation.complete = update.complete;

            await this.entryRepository.updateAllocation(allocationId, update);
            await this.cache.store(entry);

            await this.websocket.send({
                type: 'User',
                userId: entry.userId
            }, 'Tournament:Entry:Update',
                this.modelMapper.mapEntry(entry));
        });
    }

    public async remove(tournamentId: number, userId: number): Promise<void> {
        await this.userLog.handle(userId, 'Tournament:Entry:Delete', async (logData) => {
            logData.tournamentId = tournamentId;

            const entryEntity = await this.entryRepository.get(tournamentId, userId);

            if (!entryEntity)
                throw new NotFoundError('Tournament entry not found.');

            const entry = this.entityMapper.fromEntity(entryEntity);

            logData.tournamentEntryId = entryEntity.id;

            const tournament = await this.tournamentManager.get(tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            if (tournament.state > TournamentState.Running)
                throw new ForbiddenError('Tournament has ended.');

            await this.entryRepository.remove(entryEntity.id);

            if (tournament.leaderboardId)
                await this.leaderboardManager.removeEntry(tournament.leaderboardId, userId);

            await Promise.all([
                this.tournamentManager.updatePlayerCount(tournamentId),
                this.cache.delete(entry),
                this.eventDispatcher.send(new TournamentLeftEvent({
                    entryId: entryEntity.id,
                    id: tournamentId,
                    userId
                }))
            ]);
        });
    }

    public async restoreCache(tournamentId: number): Promise<void> {
        const tournament = await this.tournamentManager.get(tournamentId);

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        const entities = await this.entryRepository.getAll(tournamentId);

        if (entities.length === 0)
            return;

        const entries = entities.map(e => this.entityMapper.fromEntity(e));
        const cacheExpiry = this.getCacheExpireTime(tournament);

        for (const entry of entries)
            await this.cache.store(entry, cacheExpiry);
    }

    private getCacheExpireTime(tournament: Tournament): Date {
        let expireTime = moment(tournament.startTime).add(90, 'days');

        if (tournament.endTime)
            expireTime = moment(tournament.endTime).add(3, 'days');

        return expireTime.toDate();
    }
}
import { Singleton, Inject } from '../core/ioc';
import { LeaderboardPointConfigEventRule } from './leaderboard-point-config';
import { LeaderboardManager } from './leaderboard-manager';
import { NotFoundError, Redis, ForbiddenError } from '../core';
import { LeaderboardInfo } from './leaderboard-info';
import { CacheKeyResolver, PointRuleMatcher, PointRuleCalculator } from './utilities';
import Logger, { LogClass } from '../core/logging';
import { Websocket } from '../websocket';
import { LeaderboardProgressManager } from './leaderboard-progress-manager';

export interface LeaderboardPointAwardResult {
    awarded: boolean;
    points?: number;
    rule?: LeaderboardPointConfigEventRule;
}

const UNMATCHED_RESULT: LeaderboardPointAwardResult = {
    awarded: false
};

export interface LeaderboardPointAwardOptions {
    createEntry?: boolean;
    sendWebsocketMessage?: boolean;
}

const DEFAULT_OPTIONS: LeaderboardPointAwardOptions = {
    createEntry: false,
    sendWebsocketMessage: true
};

@Singleton
@LogClass()
export class LeaderboardPointAwarder {
    constructor(
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly progressManager: LeaderboardProgressManager,
        @Inject private readonly redis: Redis,
        @Inject private readonly cacheKeyResolver: CacheKeyResolver,
        @Inject private readonly ruleMatcher: PointRuleMatcher,
        @Inject private readonly pointCalculator: PointRuleCalculator,
        @Inject private readonly websocket: Websocket) {
        }

    public async award(leaderboardId: number, userId: number, eventName: string, input?: number, options?: LeaderboardPointAwardOptions): Promise<LeaderboardPointAwardResult> {
        options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        if (input && !Number.isInteger(input))
            throw new Error('Input value must be an integer.');

        Logger.debug(`Leaderboard '${leaderboardId}': Attempting to award points...`, {
            userId,
            eventName,
            input
        });

        const leaderboard = await this.leaderboardManager.getInfo(leaderboardId);

        if (!leaderboard)
            throw new NotFoundError(`Leaderboard '${leaderboardId}' does not exist.`);

        if (leaderboard.finalised)
            throw new ForbiddenError('Leaderboard has been finalised.');

        const config = leaderboard.pointConfig;

        if (!leaderboard.pointConfig)
            throw new Error(`Leaderboard '${leaderboard.id}' must have a point configuration.`);

        if (typeof config !== 'object' || Object.keys(config).length === 0)
            throw new Error(`Leaderboard '${leaderboard.id}' point config is invalid.`);

        Logger.debug(`Point config`, config);

        const eventConfig = config[eventName];

        if (!eventConfig) {
            Logger.warn(`Config for event '${eventName} was not found.`);
            return UNMATCHED_RESULT;
        }

        let entry = await this.leaderboardManager.getEntry(leaderboardId, userId);

        if (!entry) {
            if (!options.createEntry)
                return UNMATCHED_RESULT;

            entry = await this.leaderboardManager.addEntry(leaderboardId, userId);
        }

        Logger.debug(`${eventName} config`, eventConfig);

        await this.addEventToIndex(leaderboard, eventName);
        const eventCount = await this.progressManager.incrementCount(leaderboard, userId, eventName, eventConfig.resetCounts);

        Logger.debug(`User ${userId} ${eventName} count is ${eventCount}`);
        Logger.debug(`Attempting to match rule...`, {
            eventCount,
            input
        });
        const rule = this.ruleMatcher.match(eventConfig.rules, eventCount, input);

        if (!rule) {
            Logger.debug('No rule matched, nothing will be awarded.');
            return UNMATCHED_RESULT;
        }

        Logger.debug(`Rule matched`, rule);

        const points = this.pointCalculator.calculate(rule, eventCount, input);

        if (points === 0)
            return {
                points,
                awarded: false,
                rule
            };

        await this.leaderboardManager.adjustPoints(leaderboardId, {
            userId,
            points
        });

        const result = {
            points,
            awarded: true,
            rule
        };

        if (options.sendWebsocketMessage)
            await this.websocket.send({
                type: 'User',
                userId
            }, 'Leaderboard:EventPoints', {
                timestamp: Date.now(),
                leaderboardId,
                points,
                description: rule.description,
                eventName
            });

        return result;
    }

    private async addEventToIndex(leaderboard: LeaderboardInfo, eventName: string): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboard.id);

        if (await this.redis.cluster.sismember(cacheKeys.events, eventName))
            return;

        Logger.debug(`Adding ${eventName} event to index...`);

        const pipeline = this.redis.cluster.pipeline().sadd(cacheKeys.events, eventName);
        await pipeline.exec();
    }
}
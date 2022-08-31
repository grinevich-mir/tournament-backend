import { Singleton, Inject } from '../../core/ioc';
import { Leaderboard } from '../leaderboard';
import { UserManager } from '../../user';
import { LeaderboardEntry } from '../leaderboard-entry';
import { LeaderboardInfo } from '../leaderboard-info';
import _ from 'lodash';
import { Redis } from '../../core';
import Logger, { LogClass } from '../../core/logging';
import { CacheKeyResolver } from './cache-key-resolver';
import { AvatarUrlResolver } from '../../user/utilities';
import { PointsFormatter } from './points-formatter';
import moment from 'moment';

@Singleton
@LogClass()
export class LeaderboardMapper {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver,
        @Inject private readonly cacheKeyResolver: CacheKeyResolver,
        @Inject private readonly pointsFormatter: PointsFormatter,
        @Inject private readonly redis: Redis) {
    }

    public async map(info: LeaderboardInfo, data: string[]): Promise<Leaderboard> {
        const entries = await this.mapEntries(info.id, data);

        return {
            id: info.id,
            type: info.type,
            prizes: info.prizes,
            entryCount: info.entryCount,
            pointConfig: info.pointConfig,
            payoutTime: info.payoutTime,
            finalised: info.finalised,
            createTime: info.createTime,
            entries
        };
    }

    public async mapEntries(id: number, data: string[]): Promise<LeaderboardEntry[]> {
        if (!data || data.length === 0)
            return [];

        const chunks = _.chunk(data, 2);
        const entries: LeaderboardEntry[] = [];

        for (const chunk of chunks) {
            const entryUserId = Number(chunk[0]);
            const entryPoints = chunk[1];

            const entry = await this.mapEntry(id, entryUserId, entryPoints);

            if (entry)
                entries.push(entry);
        }

        return entries;
    }

    public async mapEntry(leaderboardId: number, userId: number, score: string): Promise<LeaderboardEntry | undefined> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        const entryUserId = userId;
        const [entryPoints, tieBreaker] = this.pointsFormatter.parse(score);
        let runningPoints = entryPoints;
        let runningTieBreaker = tieBreaker;

        const rank = await this.redis.cluster.zrevrank(cacheKeys.entries, entryUserId.toString());

        if (rank === null)
            return;

        const rawRunningPoints = await this.redis.cluster.zscore(cacheKeys.runningEntries, entryUserId.toString());

        if (rawRunningPoints)
            [runningPoints, runningTieBreaker] = this.pointsFormatter.parse(rawRunningPoints);

        const timestamp = await this.redis.cluster.hget(cacheKeys.activeEntries, entryUserId.toString());
        const isActive = moment(timestamp).isAfter(moment().subtract(2, 'minutes'));

        let displayName = 'Anonymous';
        let avatarUrl: string | undefined;
        let country = 'US';

        const user = await this.userManager.get(entryUserId);

        if (!user)
            Logger.error(`Could not get user ${entryUserId} when mapping leaderboard entry.`);
        else {
            if (user.displayName)
                displayName = user.displayName;
            if (user.country)
                country = user.country;

            avatarUrl = this.avatarUrlResolver.resolve(user);
        }

        return {
            rank: rank + 1,
            userId: entryUserId,
            displayName,
            avatarUrl,
            country,
            points: entryPoints,
            tieBreaker,
            runningPoints,
            runningTieBreaker,
            active: isActive
        };
    }
}
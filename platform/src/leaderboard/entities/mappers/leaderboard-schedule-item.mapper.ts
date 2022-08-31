import { Singleton } from '../../../core/ioc';
import { LeaderboardScheduleItemEntity } from '../leaderboard-schedule-item.entity';
import { LeaderboardScheduleItem, NewLeaderboardScheduleItem } from '../../leaderboard-schedule-item';

@Singleton
export class LeaderboardScheduleItemEntityMapper {
    public fromEntity(source: LeaderboardScheduleItemEntity): LeaderboardScheduleItem {
        return {
            id: source.id,
            scheduleName: source.scheduleName,
            leaderboardId: source.leaderboardId,
            frequency: source.frequency,
            minLevel: source.minLevel,
            startTime: source.startTime,
            endTime: source.endTime,
            autoPayout: source.autoPayout,
            enabled: source.enabled,
            finalised: source.finalised,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(source: NewLeaderboardScheduleItem): LeaderboardScheduleItemEntity {
        const entity = new LeaderboardScheduleItemEntity();
        entity.scheduleName = source.scheduleName;
        entity.leaderboardId = source.leaderboardId;
        entity.frequency = source.frequency;
        entity.startTime = source.startTime;
        entity.endTime = source.endTime;
        entity.minLevel = source.minLevel;
        entity.autoPayout = source.autoPayout;
        entity.enabled = source.enabled;
        return entity;
    }
}
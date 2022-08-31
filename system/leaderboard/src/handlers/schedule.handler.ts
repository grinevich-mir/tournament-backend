import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { LeaderboardScheduleManager, LeaderboardManager, LeaderboardSchedule, LeaderboardScheduleFrequency, NewLeaderboardScheduleItem, NewLeaderboard, LeaderboardType } from '@tcom/platform/lib/leaderboard';
import moment from 'moment';

@Singleton
@LogClass()
class ScheduleHandler {
    constructor(
        @Inject private readonly scheduleManager: LeaderboardScheduleManager,
        @Inject private readonly leaderboardManager: LeaderboardManager) {
        }

    public async execute(): Promise<void> {
        const schedules = await this.scheduleManager.getAll({
            enabled: true
        });

        if (schedules.length === 0)
            return;

        for (const lbSchedule of schedules)
            try {
                await this.process(lbSchedule);
            } catch (err) {
                Logger.error(`Failed process schedule '${lbSchedule.name}'`, err);
            }
    }

    private async process(lbSchedule: LeaderboardSchedule): Promise<void> {
        Logger.info(`Processing schedule '${lbSchedule.name}'...`);

        const lastItem = await this.scheduleManager.getLastItem(lbSchedule.name);

        if (!lastItem) {
            Logger.info(`Schedule has no previous items, one will be created for the start of the current ${lbSchedule.frequency} period.`);
            await this.createScheduleItem(lbSchedule);
            return;
        }

        const threshold = moment(lastItem.endTime).subtract(15, 'minutes');

        if (moment().isBefore(threshold))
            return;

        await this.createScheduleItem(lbSchedule, lastItem.endTime);
    }

    private async createScheduleItem(lbSchedule: LeaderboardSchedule, from?: Date): Promise<void> {
        const unit = this.mapFrequency(lbSchedule.frequency);
        const context = from ? moment(from).utc() : moment.utc();
        const startTime = context.startOf(unit === 'week' ? 'isoWeek' : unit).add(lbSchedule.offset, 'hours');
        const endTime = moment(startTime).add(1, unit);

        const expireTime = moment(endTime).add(7, 'days').toDate();

        const newLeaderboard: NewLeaderboard = {
            type: LeaderboardType.Scheduled,
            prizes: lbSchedule.prizes,
            pointConfig: lbSchedule.pointConfig
        };

        const leaderboard = await this.leaderboardManager.add(newLeaderboard);
        await this.leaderboardManager.expire(leaderboard.id, expireTime);

        try {
            const newItem: NewLeaderboardScheduleItem = {
                scheduleName: lbSchedule.name,
                frequency: lbSchedule.frequency,
                leaderboardId: leaderboard.id,
                minLevel: lbSchedule.minLevel,
                autoPayout: lbSchedule.autoPayout,
                startTime: startTime.toDate(),
                endTime: endTime.toDate(),
                enabled: true
            };

            Logger.info('Creating schedule item...', newItem);

            await this.scheduleManager.addItem(newItem);
        } catch (err) {
            Logger.warn('Failed to add schedule item, removing leaderboard...');
            await this.leaderboardManager.remove(leaderboard.id);
            throw err;
        }
    }

    private mapFrequency(frequency: LeaderboardScheduleFrequency): moment.unitOfTime.DurationConstructor {
        switch (frequency) {
            case LeaderboardScheduleFrequency.Daily:
                return 'day';

            case LeaderboardScheduleFrequency.Weekly:
                return 'week';

            case LeaderboardScheduleFrequency.Monthly:
                return 'month';

            case LeaderboardScheduleFrequency.Annually:
                return 'year';
        }
    }
}

export const schedule = lambdaHandler(() => IocContainer.get(ScheduleHandler).execute());
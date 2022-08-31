import { Inject, Singleton } from '../core/ioc';
import { UpgradeRepository } from './repositories';
import { ScheduledUpgradeEntity } from './entities';
import { UpgradeStatus } from './upgrade-status';
import moment from 'moment';
import { NotFoundError, ConflictError, BadRequestError } from '../core';
import { UserLog, LogClass } from '../core/logging';
import { UserManager } from '../user';
import { ScheduledUpgrade } from './upgrade';
import { UpgradeEntityMapper } from './entities/mappers';
import { UpgradeManagerBase } from './upgrade-manager-base';

@Singleton
@LogClass()
export class ScheduledUpgradeManager extends UpgradeManagerBase {
    constructor(
        @Inject upgradeRepository: UpgradeRepository,
        @Inject userManager: UserManager,
        @Inject private readonly entityMapper: UpgradeEntityMapper,
        @Inject private readonly userLog: UserLog) {
            super(upgradeRepository, userManager);
    }

    public async create(userId: number, level: number, startTime: Date, endTime: Date): Promise<ScheduledUpgrade> {
        return this.userLog.handle(userId, 'Upgrade:Scheduled:Create', async (logData) => {
            logData.requestedLevel = level;
            logData.startTime = startTime.toISOString();
            logData.endTime = endTime.toISOString();
            const started = moment().utc().isSameOrAfter(startTime);

            const user = await this.userManager.get(userId);

            if (!user)
                throw new NotFoundError('User not found.');

            if (started && level <= user.level)
                throw new ConflictError('Cannot add an upgrade with a level less than or equal to the users current level.');

            if (startTime >= endTime)
                throw new BadRequestError('Start time cannot be the same or after the end time.');

            let entity = new ScheduledUpgradeEntity();
            entity.userId = userId;
            entity.level = level;
            entity.startTime = startTime;
            entity.endTime = endTime;
            entity.status = !started ? UpgradeStatus.Pending : UpgradeStatus.Active;
            entity = await this.upgradeRepository.addScheduled(entity);

            if (started)
                logData.userLevel = await this.updateUserLevel(userId);

            return this.entityMapper.fromEntity(entity);
        });
    }

    public async cancel(id: number): Promise<void> {
        const upgrade = await this.upgradeRepository.get(id);

        if (!upgrade)
            throw new NotFoundError('Upgrade not found.');

        await this.userLog.handle(upgrade.userId, 'Upgrade:Scheduled:Cancel', async (logData) => {
            logData.scheduledUpgradeId = id;

            await this.upgradeRepository.setStatus(id, UpgradeStatus.Expired);
            logData.userLevel = await this.updateUserLevel(upgrade.userId);
        });
    }

    public async activate(count: number): Promise<void> {
        const upgrades = await this.upgradeRepository.getStarted(count);

        if (upgrades.length === 0)
            return;

        for (const upgrade of upgrades) {
            await this.upgradeRepository.setStatus(upgrade.id, UpgradeStatus.Active);
            await this.updateUserLevel(upgrade.userId);
        }
    }

    public async expire(count: number): Promise<void> {
        const upgrades = await this.upgradeRepository.getEnded(count);

        if (upgrades.length === 0)
            return;

        for (const upgrade of upgrades) {
            await this.upgradeRepository.setStatus(upgrade.id, UpgradeStatus.Expired);
            await this.updateUserLevel(upgrade.userId);
        }
    }
}
import { Singleton, Inject } from '../../core/ioc';
import { InventoryClaimAwarder } from './inventory-claim-awarder';
import { ScheduledUpgradeManager } from '../../upgrade';
import moment from 'moment';
import { UpgradeInventoryItem } from '../inventory-item';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UpgradeInventoryClaimAwarder implements InventoryClaimAwarder {
    constructor(
        @Inject private readonly upgradeManager: ScheduledUpgradeManager) {
        }

    public async award(item: UpgradeInventoryItem): Promise<void> {
        const startTime = moment().utc().toDate();
        const endTime = moment(startTime).add(item.validDays, 'days').toDate();
        await this.upgradeManager.create(item.userId, item.level, startTime, endTime);
    }
}
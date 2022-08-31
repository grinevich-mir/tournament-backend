import { UpgradeCodeRepository } from './repositories';
import { Inject, Singleton } from '../core/ioc';
import { UpgradeCode } from './upgrade-code';
import { UpgradeConfigManager } from './upgrade-config-manager';
import { UserManager } from '../user';
import { NotFoundError, BadRequestError, PagedResult } from '../core';
import { UpgradeCodeGenerator } from './utilities';
import moment from 'moment';
import { LogClass } from '../core/logging';
import { InventoryItem, InventoryItemType, InventoryManager } from '../inventory';
import { UpgradeCodeFilter } from './upgrade-code-filter';
import { PlatformEventDispatcher } from '../core/events';
import { UpgradeCodeProcessedEvent } from './events';

@Singleton
@LogClass()
export class UpgradeCodeManager {
    constructor(
        @Inject private readonly repository: UpgradeCodeRepository,
        @Inject private readonly configManager: UpgradeConfigManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly codeGenerator: UpgradeCodeGenerator,
        @Inject private readonly inventoryManager: InventoryManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async getAll(filter?: UpgradeCodeFilter): Promise<PagedResult<UpgradeCode>> {
        return this.repository.getAll(filter);
    }

    public async get(code: string): Promise<UpgradeCode | undefined> {
        return this.repository.get(code);
    }

    public async getByUserId(userId: number): Promise<UpgradeCode | undefined> {
        return this.repository.getByUserId(userId);
    }

    public async generate(userId: number): Promise<UpgradeCode> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const config = await this.configManager.get(user.skinId);

        if (!config)
            throw new NotFoundError(`Upgrade code config not found for skin ${user.skinId}.`);

        let newCode = this.codeGenerator.generate();

        while (await this.repository.exists(newCode))
            newCode = this.codeGenerator.generate();

        const expiry = moment.utc().add(config.codeExpiry, 'hours').toDate();
        const processExpiry = moment.utc().add(config.codeProcessExpiry, 'days').toDate();

        return this.repository.add({
            code: newCode,
            userId,
            expireTime: expiry,
            processExpireTime: processExpiry,
            upgradeLevel: config.codeUpgradeLevel,
            upgradeDuration: config.codeUpgradeDuration,
            diamonds: config.codeDiamonds
        });
    }

    public async process(code: string, employeeId: string): Promise<UpgradeCode> {
        const item = await this.repository.get(code);

        if (!item)
            throw new NotFoundError('Upgrade code not found.');

        if (item.processTime)
            throw new BadRequestError('Upgrade code has already been used.');

        if (moment(item.processExpireTime).isSameOrBefore())
            throw new BadRequestError('Upgrade code has expired.');

        const user = await this.userManager.get(item.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const enabled = item.upgradeLevel > user.level;
        const awardedItems: InventoryItem[] = [];

        if (item.upgradeDuration > 0 && item.upgradeLevel > 0) {
            const upgradeItem = await this.inventoryManager.add({
                type: InventoryItemType.Upgrade,
                userId: item.userId,
                level: item.upgradeLevel,
                validDays: item.upgradeDuration,
                expiresIn: 7, // TODO: Should be configurable somewhere
                enabled
            });
            awardedItems.push(upgradeItem);
        }

        if (item.diamonds > 0) {
            const diamondsItem = await this.inventoryManager.add({
                type: InventoryItemType.Diamonds,
                userId: item.userId,
                amount: item.diamonds,
                expiresIn: 7, // TODO: Should be configurable somewhere
                enabled: true
            });
            awardedItems.push(diamondsItem);
        }

        const now = new Date();
        item.processTime = now;
        item.processedBy = employeeId;
        item.inventoryItemIds = awardedItems.map(i => i.id);
        await this.repository.setProcessed(code, item.inventoryItemIds, now, employeeId);
        await this.eventDispatcher.send(new UpgradeCodeProcessedEvent(item, awardedItems));
        return item;
    }

    public async deleteUnused(): Promise<void> {
        await this.repository.deleteUnused();
    }
}
import { Singleton, Inject } from '../core/ioc';
import { InventoryRepository } from './repositories';
import { NotFoundError, ForbiddenError, PagedResult } from '../core';
import { InventoryClaimAwarderFactory } from './awarding';
import { InventoryFilter, InventoryGetAllFilter } from './inventory-filter';
import { UserLog, LogClass } from '../core/logging';
import { InventoryItem } from './inventory-item';
import { NewInventoryItem } from './new-inventory-item';

@Singleton
@LogClass()
export class InventoryManager {
    constructor(
        @Inject private readonly repository: InventoryRepository,
        @Inject private readonly awarderFactory: InventoryClaimAwarderFactory,
        @Inject private readonly userLog: UserLog) {
    }

    public async getAll(filter?: InventoryGetAllFilter): Promise<PagedResult<InventoryItem>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<InventoryItem | undefined> {
        return this.repository.get(id);
    }

    public async add(newItem: NewInventoryItem): Promise<InventoryItem> {
        const added = await this.repository.add(newItem);
        // TODO: Send platform event ?
        return added;
    }

    public async count(filter?: InventoryFilter): Promise<number> {
        return this.repository.count(filter);
    }

    public async claim(id: number): Promise<void> {
        const item = await this.get(id);

        if (!item || !item.enabled)
            throw new NotFoundError('Inventory item not found.');

        await this.userLog.handle(item.userId, 'Inventory:Claim', async (logData) => {
            logData.inventoryItemId = id;

            const awarder = this.awarderFactory.create(item.type);
            await awarder.award(item);

            await this.repository.setClaimed(item.id, true);
        });
    }

    public async claimForUser(id: number, userId: number): Promise<void> {
        const item = await this.get(id);

        if (!item || !item.enabled)
            throw new NotFoundError('Inventory item not found.');

        await this.userLog.handle(userId, `Inventory:Claim`, async (logData) => {
            logData.inventoryItemId = id;

            if (item.userId !== userId)
                throw new ForbiddenError('Item does not belong to user.');

            const awarder = this.awarderFactory.create(item.type);
            await awarder.award(item);

            await this.repository.setClaimed(item.id, true);
        });
    }

    public async enable(...ids: number[]): Promise<void> {
        await this.repository.enable(...ids);
    }

    public async disable(...ids: number[]): Promise<void> {
        await this.repository.disable(...ids);
    }
}
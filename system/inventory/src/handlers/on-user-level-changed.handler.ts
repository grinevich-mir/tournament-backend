import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { InventoryItemType, InventoryManager, UpgradeInventoryItem } from '@tcom/platform/lib/inventory';
import { UserLevelChangedEvent } from '@tcom/platform/lib/user/events';

@Singleton
@LogClass()
class OnUserLevelChangedHandler extends PlatformEventHandler<UserLevelChangedEvent> {
    constructor(
        @Inject private readonly inventoryManager: InventoryManager) {
            super();
    }

    protected async process(event: Readonly<UserLevelChangedEvent>): Promise<void> {
        const result = await this.inventoryManager.getAll({
            userId: event.id,
            claimed: false,
            type: InventoryItemType.Upgrade
        });

        if (result.totalCount === 0)
            return;

        const upgradeItems = result.items as UpgradeInventoryItem[];
        const claimable = upgradeItems.filter(i => i.level > event.to).map(i => i.id);
        const unclaimable = upgradeItems.filter(i => i.level <= event.to).map(i => i.id);

        if (claimable.length > 0)
            await this.inventoryManager.enable(...claimable);

        if (unclaimable.length > 0)
            await this.inventoryManager.disable(...unclaimable);
    }
}

export const onUserLevelChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserLevelChangedHandler).execute(event));
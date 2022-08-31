import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { ScheduledUpgradeManager } from '@tcom/platform/lib/upgrade';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ActivateScheduledUpgradesHandler {
    constructor(
        @Inject private readonly upgradeManager: ScheduledUpgradeManager) {
        }

    public async process(): Promise<void> {
        await this.upgradeManager.activate(100);
    }
}

export const activateScheduled = lambdaHandler(() => IocContainer.get(ActivateScheduledUpgradesHandler).process());
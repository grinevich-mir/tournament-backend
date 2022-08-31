import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { ScheduledUpgradeManager } from '@tcom/platform/lib/upgrade';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ExpireScheduledUpgradesHandler {
    constructor(
        @Inject private readonly upgradeRepository: ScheduledUpgradeManager) {
        }

    public async process(): Promise<void> {
        await this.upgradeRepository.expire(100);
    }
}

export const expireScheduled = lambdaHandler(() => IocContainer.get(ExpireScheduledUpgradesHandler).process());
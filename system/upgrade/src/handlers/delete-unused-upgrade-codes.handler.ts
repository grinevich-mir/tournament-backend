import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { UpgradeCodeManager } from '@tcom/platform/lib/upgrade';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class DeleteUnusedUpgradeCodesHandler {
    constructor(
        @Inject private readonly codeManager: UpgradeCodeManager) {
        }

    public async execute(): Promise<void> {
        await this.codeManager.deleteUnused();
    }
}

export const deleteUnusedCodes = lambdaHandler(() => IocContainer.get(DeleteUnusedUpgradeCodesHandler).execute());
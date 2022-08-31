import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager } from '@tcom/platform/lib/user';

@Singleton
@LogClass()
export class RefreshDisplayNameCache {
    constructor(@Inject private readonly userManager: UserManager) {
    }

    public async execute(): Promise<void> {
        await this.userManager.refreshDisplayNameCache();
    }
}

export const refreshDisplayNameCache = lambdaHandler(() => IocContainer.get(RefreshDisplayNameCache).execute());
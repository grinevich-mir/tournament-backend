import { Tags, Get, Route, Security, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import _ from 'lodash';
import { UpgradeCodeModel } from '@tcom/platform/lib/upgrade/models';
import { UpgradeCodeManager } from '@tcom/platform/lib/upgrade';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Route('upgrade')
@Security('cognito')
@LogClass()
export class UpgradeController extends ClientController {
    constructor(
        @Inject private readonly manager: UpgradeCodeManager) {
            super();
        }

    /**
     * Gets the upgrade code for the authenticated user.
     */
    @Tags('Code')
    @Get('code')
    public async getCode(): Promise<UpgradeCodeModel> {
        let upgradeCode = await this.manager.getByUserId(this.user.id);

        if (!upgradeCode)
            upgradeCode = await this.manager.generate(this.user.id);

        return {
            code: upgradeCode.code,
            expireTime: upgradeCode.expireTime,
            processExpireTime: upgradeCode.processExpireTime
        };
    }
}
import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserLevelChangedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralUserManager } from '@tcom/platform/lib/referral';

@Singleton
@LogClass()
class OnUserLevelChangedHandler extends PlatformEventHandler<UserLevelChangedEvent> {
    constructor(
        @Inject private readonly referralUserManager: ReferralUserManager) {
            super();
    }

    protected async process(event: Readonly<UserLevelChangedEvent>): Promise<void> {
        let referralUser = await this.referralUserManager.get(event.id);

        // TODO: Make configurable
        if (event.to < 2 && referralUser && referralUser.active) {
            await this.referralUserManager.deactivate(referralUser.userId);
            return;
        }

        if (!referralUser) {
            referralUser = await this.referralUserManager.add(event.id, true);
            return;
        }

        await this.referralUserManager.activate(referralUser.userId);
    }
}

export const onUserLevelChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserLevelChangedHandler).execute(event));
import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralUserManager } from '@tcom/platform/lib/referral';
import { UserManager } from '@tcom/platform/lib/user';

@Singleton
@LogClass()
class OnUserUpdatedHandler extends PlatformEventHandler<UserUpdatedEvent> {
    constructor(
        @Inject private readonly referralUserManager: ReferralUserManager,
        @Inject private readonly userManager: UserManager) {
            super();
    }

    protected async process(event: Readonly<UserUpdatedEvent>): Promise<void> {
        const payload = event.payload;

        if (payload.enabled === undefined)
            return;

        const user = await this.userManager.get(payload.id);

        if (!user) {
            Logger.error('User not found.');
            return;
        }


        if (user.enabled === false) {
            await this.referralUserManager.deactivate(user.id);
            return;
        }

        await this.referralUserManager.activate(user.id);
    }
}

export const onUserUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserUpdatedHandler).execute(event));
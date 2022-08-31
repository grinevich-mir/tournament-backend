import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserCreatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { ReferralManager, ReferralUserManager, ReferralEventType, ReferralRuleProcessor } from '@tcom/platform/lib/referral';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnUserCreatedHandler extends PlatformEventHandler<UserCreatedEvent> {
    constructor(
        @Inject private readonly referralUserManager: ReferralUserManager,
        @Inject private readonly referralManager: ReferralManager,
        @Inject private readonly referralRuleProcessor: ReferralRuleProcessor) {
            super();
    }

    protected async process(event: Readonly<UserCreatedEvent>): Promise<void> {
        await this.referralUserManager.add(event.user.id, true);

        if (!event.referredCode)
            return;

        const referralUser = await this.referralUserManager.getByCode(event.referredCode);

        if (!referralUser)
            return;

        const referral = await this.referralManager.add(referralUser.userId, event.user.id);
        await this.referralRuleProcessor.process(ReferralEventType.SignUp, referral);
    }
}

export const onUserCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserCreatedHandler).execute(event));
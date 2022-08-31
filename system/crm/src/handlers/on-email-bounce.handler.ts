import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { JsonSerialiser, lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager, UserNotificationSettingManager } from '@tcom/platform/lib/user';
import { SESBounceNotification, SESBounceNotificationRecipient } from '../models';
import { UserNotificationChannel } from '@tcom/platform/lib/user/user-notification-channel';

@Singleton
@LogClass()
class OnEmailBounceHandler {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly notificationSettingManager: UserNotificationSettingManager,
        @Inject private readonly serialiser: JsonSerialiser) {}

    public async execute(event: SNSEvent): Promise<void> {
        const notification = this.serialiser.deserialise<SESBounceNotification>(event.Records[0].Sns.Message);

        Logger.info('SES Notification', notification);

        if (notification.bounce.bounceType !== 'Permanent')
            return;

        for (const recipient of notification.bounce.bouncedRecipients)
            try {
                await this.processRecipient(recipient);
            } catch (err) {
                Logger.error(err);
            }
    }

    private async processRecipient(recipient: SESBounceNotificationRecipient): Promise<void> {
        const profile = await this.userManager.getProfileByEmail(recipient.emailAddress);

        if (!profile)
            throw new NotFoundError(`Error processing bounce recipient, profile with email address ${recipient.emailAddress} was not found.`);

        await this.notificationSettingManager.set(profile.userId, UserNotificationChannel.Email, { enabled: false });
    }
}

export const onEmailBounce = lambdaHandler((event: SNSEvent) => IocContainer.get(OnEmailBounceHandler).execute(event));
import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { JsonSerialiser, lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager, UserNotificationSettingManager } from '@tcom/platform/lib/user';
import { SESComplaintNotification, SESNotificationRecipient } from '../models';
import { UserNotificationChannel } from '@tcom/platform/lib/user/user-notification-channel';

@Singleton
@LogClass()
class OnEmailComplaintHandler {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly notificationSettingManager: UserNotificationSettingManager,
        @Inject private readonly serialiser: JsonSerialiser) {}

    public async execute(event: SNSEvent): Promise<void> {
        const notification = this.serialiser.deserialise<SESComplaintNotification>(event.Records[0].Sns.Message);

        Logger.info('SES Notification', notification);

        for (const recipient of notification.complaint.complainedRecipients)
            try {
                await this.processRecipient(recipient);
            } catch (err) {
                Logger.error(err);
            }
    }

    private async processRecipient(recipient: SESNotificationRecipient): Promise<void> {
        const profile = await this.userManager.getProfileByEmail(recipient.emailAddress);

        if (!profile)
            throw new NotFoundError(`Error processing bounce recipient, profile with email address ${recipient.emailAddress} was not found.`);

        await this.notificationSettingManager.set(profile.userId, UserNotificationChannel.Email, { enabled: false });
    }
}

export const onEmailComplaint = lambdaHandler((event: SNSEvent) => IocContainer.get(OnEmailComplaintHandler).execute(event));
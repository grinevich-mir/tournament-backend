import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserNotificationSettingChangedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager, CRMChannel, CRMChannelOptions, CRMChannelOptOuts } from '@tcom/platform/lib/crm';
import { UserNotificationSetting, UserNotificationType } from '@tcom/platform/lib/user';
import { UserNotificationChannel } from '@tcom/platform/lib/user/user-notification-channel';

@Singleton
@LogClass()
class OnUserNotificationSettingChangedHandler extends PlatformEventHandler<UserNotificationSettingChangedEvent> {
    constructor(
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<UserNotificationSettingChangedEvent>): Promise<void> {
        const channel = this.getChannel(event.setting);

        const options: CRMChannelOptions = {
            enabled: event.setting.enabled,
            optOuts: this.getOptOuts(event.setting)
        };

        await this.crmManager.setChannelOptions(event.userId, channel, options);
    }

    private getOptOuts(setting: UserNotificationSetting): CRMChannelOptOuts | undefined {
        const optOuts: { [key: string]: boolean } = {};

        if (setting.account !== undefined)
            optOuts[UserNotificationType.Account] = setting.account;

        if (setting.prize !== undefined)
            optOuts[UserNotificationType.Prize] = setting.prize;

        if (setting.marketing !== undefined)
            optOuts[UserNotificationType.Marketing] = setting.marketing;

        if (Object.keys(optOuts).length === 0)
            return undefined;

        return optOuts;
    }

    private getChannel(setting: UserNotificationSetting): CRMChannel {
        switch (setting.channel) {
            case UserNotificationChannel.Email:
                return CRMChannel.Email;
        }
    }
}

export const onUserNotificationSettingChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserNotificationSettingChangedHandler).execute(event));
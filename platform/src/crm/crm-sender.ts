import AWS from 'aws-sdk';
import { SendUsersMessagesRequest, TemplateConfiguration } from 'aws-sdk/clients/pinpoint';
import _ from 'lodash';
import uuid from 'uuid';
import { Config, DEFAULT_REGION, NotFoundError, ParameterStore } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { UserManager, UserNotificationSetting, UserNotificationSettingManager, UserNotificationType, UserType } from '../user';
import { UserNotificationChannel } from '../user/user-notification-channel';
import { CRMChannel } from './crm-channel';
import { CRMMessageData } from './crm-message-data';
import { CRMTemplateName } from './crm-template-name';

type Substitutions = { [key: string]: string[] };

export interface SendMessageOptions {
    data?: CRMMessageData;
}

export interface CRMRecipient {
    userId: number;
    data?: CRMMessageData;
}

@Singleton
@LogClass()
export class CRMSender {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly notificationSettingManager: UserNotificationSettingManager,
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async send(userId: number, notificationType: UserNotificationType, templateName: CRMTemplateName, options?: SendMessageOptions): Promise<void> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError(`User ${userId} not found.`);

        if (!user.enabled)
            return;

        // Do not send to bot users
        if (user.type === UserType.Bot)
            return;

        const settings = await this.notificationSettingManager.getAll(userId);
        const channels: CRMChannel[] = this.getChannels(settings, notificationType);

        if (channels.length === 0)
            return;

       const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });

       const templateConfiguration: TemplateConfiguration = {};
       const formattedTemplateName = this.formatTemplateName(user.skinId, templateName);

       if (channels.includes(CRMChannel.Email))
            templateConfiguration.EmailTemplate = {
                Name: formattedTemplateName
            };

        if (channels.includes(CRMChannel.SMS))
            templateConfiguration.SMSTemplate = {
                Name: formattedTemplateName
            };

        const substitutions = this.mapData(options?.data);
        const appId = await this.getAppId();

        const request: SendUsersMessagesRequest = {
            ApplicationId: appId,
            SendUsersMessageRequest: {
                MessageConfiguration: {},
                TemplateConfiguration: templateConfiguration,
                Users: {
                    [userId.toString()]: {
                        Substitutions: substitutions
                    }
                },
                TraceId: uuid()
            }
        };

        await pinpoint.sendUsersMessages(request).promise();
    }

    public async sendAll(recipients: CRMRecipient[], notificationType: UserNotificationType, templateName: CRMTemplateName, options?: SendMessageOptions): Promise<void> {
        for (const recipient of recipients) {
            const data = options ? { ...options.data, ...recipient.data } : recipient.data;
            await this.send(recipient.userId, notificationType, templateName, {
                data
            });
        }
    }

    private mapData(data?: CRMMessageData): Substitutions | undefined {
        if (!data)
            return undefined;

        return _.transform(data, (result: Substitutions, value, key) => {
            if (_.isArray(value))
                result[_.upperFirst(key)] = value.map(v => this.formatDataValue(v));
            else
                result[_.upperFirst(key)] = [this.formatDataValue(value)];
        });
    }

    private formatDataValue(value: number | string | Date): string {
        if (value instanceof Date)
            return value.toISOString();

        return value.toString();
    }

    private formatTemplateName(skinId: string, templateName: CRMTemplateName): string {
        return `SYSTEM-${skinId}-${templateName}`;
    }

    private async getAppId(): Promise<string> {
        const key = `/${Config.stage}/pinpoint/app-id`;
        return this.parameterStore.get(key, false, true);
    }

    private getChannels(settings: UserNotificationSetting[], type: UserNotificationType): CRMChannel[] {
        const channels: CRMChannel[] = [];
        const enabled = settings.filter(s => s.enabled);

        for (const setting of enabled) {
            let match = false;

            switch (type) {
                case UserNotificationType.Account:
                    match = setting.account;
                    break;

                case UserNotificationType.Prize:
                    match = setting.prize;
                    break;

                case UserNotificationType.Marketing:
                    match = setting.marketing;
                    break;
            }

            if (match)
                channels.push(this.mapNotificationChannel(setting.channel));
        }

        return channels;
    }

    private mapNotificationChannel(channel: UserNotificationChannel): CRMChannel {
        switch (channel) {
            case UserNotificationChannel.Email:
                return CRMChannel.Email;
        }
    }
}
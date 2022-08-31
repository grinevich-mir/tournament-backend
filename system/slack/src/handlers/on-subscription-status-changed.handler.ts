import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, ParameterStore, Config } from '@tcom/platform/lib/core';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { UserManager } from '@tcom/platform/lib/user';
import { SNSEvent } from 'aws-lambda';
import { IncomingWebhook } from '@slack/webhook';
import { SubscriptionStatusChangedEvent } from '@tcom/platform/lib/subscription/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { SubscriptionStatus } from '@tcom/platform/lib/subscription';
import moment from 'moment';

@Singleton
@LogClass()
export class OnSubscriptionStatusChangedHandler extends PlatformEventHandler<SubscriptionStatusChangedEvent> {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    public async process(event: SubscriptionStatusChangedEvent): Promise<void> {
        const subscription = event.subscription;
        const user = await this.userManager.get(subscription.userId);

        if (!user) {
            Logger.error('Subscription user not found!');
            return;
        }

        let title = `Subscription ${subscription.id} ${event.to}`;

        if (event.from === SubscriptionStatus.Pending && event.to === SubscriptionStatus.Active)
            title = `Subscription Created`;
        else if (event.from === SubscriptionStatus.Active && event.to === SubscriptionStatus.Cancelled)
            title = `Subscription Cancelling`;
        else if (event.from === SubscriptionStatus.Cancelled && event.to === SubscriptionStatus.Active)
            title = `Subscription Reactivated`;
        else if (event.from === SubscriptionStatus.Cancelled && event.to === SubscriptionStatus.Expired)
            title = 'Subscription Cancelled';
        else if (event.to === SubscriptionStatus.PastDue)
            title = 'Subscription Past Due';
        else if (event.to === SubscriptionStatus.Expired)
            title = 'Subscription Expired';

        const webhookUrl = await this.parameterStore.get(`/${Config.stage}/integration/slack/webhook-url`, true, true);

        const webhook = new IncomingWebhook(webhookUrl, {
            channel: '#operations',
            icon_emoji: ':rocket:',
            username: 'Subscription'
        });

        const header = `${title} (${Config.stage.toUpperCase()})`;

        await webhook.send({
            text: header,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: header,
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*User:*\n<https://admin.${Config.stage}.tgaming.io/users/${user.id}|${user.displayName}>`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*ID:* ${subscription.id}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Provider:* ${subscription.provider} (Ref: ${subscription.providerRef})`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Tier ID:* ${subscription.tierId}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Tier Variant ID:* ${subscription.tierVariantId}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Status:* ${event.from} -> ${event.to}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Level:* ${subscription.level}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Trial:* ${subscription.trialling}`,
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Amount:* ${formatMoney(subscription.amount, subscription.currencyCode)} / ${subscription.frequency} ${subscription.period}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Date:*\n${moment(subscription.createTime).format('YYYY-MM-DD HH:mm:ss UTC')}`
                        }
                    ]
                }
            ]
        });
    }
}

export const onSubscriptionStatusChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionStatusChangedHandler).execute(event));

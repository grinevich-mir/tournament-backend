import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, ParameterStore, Config, NotFoundError } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { WithdrawalManager } from '@tcom/platform/lib/banking';
import { UserManager } from '@tcom/platform/lib/user';
import { WithdrawalRequestStatusChangedEvent } from '@tcom/platform/lib/banking/events';
import { SNSEvent } from 'aws-lambda';
import { IncomingWebhook } from '@slack/webhook';
import moment from 'moment';

@Singleton
@LogClass()
export class OnWithdrawalRequestStatusChangedHandler extends PlatformEventHandler<WithdrawalRequestStatusChangedEvent> {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly manager: WithdrawalManager,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    public async process(event: WithdrawalRequestStatusChangedEvent): Promise<void> {
        const webhookUrl = await this.parameterStore.get(`/${Config.stage}/integration/slack/webhook-url`, true, true);
        const request = await this.manager.get(event.id);

        if (!request)
            throw new NotFoundError(`Withdrawal request ${event.id} not found.`);

        const user = await this.userManager.get(request.userId);

        if (!user)
            throw new NotFoundError(`User ${request.userId} not found.`);

        const webhook = new IncomingWebhook(webhookUrl, {
            channel: '#operations',
            icon_emoji: ':moneybag:',
            username: 'Banking'
        });

        const header = `Withdrawal ${event.status} (${Config.stage.toUpperCase()})`;

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
                    text: {
                        type: 'mrkdwn',
                        text: `*ID:* ${request.id}`
                    }
                },
                {
                    type: 'divider'
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
                            text: `*Date:*\n${moment(request.createTime).format('YYYY-MM-DD HH:mm:ss UTC')}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Amount:*\n ${request.currencyCode} ${request.amount}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Target Date:*\n${moment(request.targetCompletionTime).format('YYYY-MM-DD HH:mm:ss UTC')}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Requested by:*\n${request.requesterType}`
                        }
                    ]
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                emoji: true,
                                text: 'View Withdrawal Requests'
                            },
                            url: `https://admin.${Config.stage}.tgaming.io/banking/withdrawals`
                        }
                    ]
                }
            ]
        });
    }
}

export const onWithdrawalRequestStatusChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnWithdrawalRequestStatusChangedHandler).execute(event));
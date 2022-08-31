import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, ParameterStore, Config } from '@tcom/platform/lib/core';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { UserManager } from '@tcom/platform/lib/user';
import { SNSEvent } from 'aws-lambda';
import { IncomingWebhook } from '@slack/webhook';
import { SectionBlock } from '@slack/types';
import { JackpotManager } from '@tcom/platform/lib/jackpot';
import { JackpotPaidOutEvent } from '@tcom/platform/lib/jackpot/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';

@Singleton
@LogClass()
export class OnJackpotPaidOutHandler extends PlatformEventHandler<JackpotPaidOutEvent> {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly jackpotManager: JackpotManager,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    public async process(event: JackpotPaidOutEvent): Promise<void> {
        const jackpot = await this.jackpotManager.get(event.id);

        if (!jackpot) {
            Logger.error(`Jackpot ${event.id} not found.`);
            return;
        }

        const webhookUrl = await this.parameterStore.get(`/${Config.stage}/integration/slack/webhook-url`, true, true);

        const webhook = new IncomingWebhook(webhookUrl, {
            channel: '#jackpots',
            icon_emoji: ':moneybag:',
            username: 'Jackpot'
        });

        const header = `Jackpot Paid Out (${Config.stage.toUpperCase()})`;

        const payoutBlocks: SectionBlock[] = [];

        for (const payout of event.payouts) {
            const user = await this.userManager.get(payout.userId);

            if (!user) {
                Logger.error(`User ${payout.userId} not found.`);
                continue;
            }

            const section: SectionBlock = {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*User:*\n<https://admin.${Config.stage}.tgaming.io/users/${user.id}|${user.displayName}>`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Amount:*\n${formatMoney(payout.amount, 'USD')}`
                    }
                ]
            };

            payoutBlocks.push(section);
        }

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
                            text: `*ID:* ${event.id}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Name:* ${jackpot.name}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Type:* ${jackpot.type}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Total Amount:* ${formatMoney(event.amount, 'USD')}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Source:* ${event.source}`
                        }
                    ]
                },
                {
                    type: 'divider'
                },
                ...payoutBlocks
            ]
        });
    }
}

export const onJackpotPaidOut = lambdaHandler((event: SNSEvent) => IocContainer.get(OnJackpotPaidOutHandler).execute(event));

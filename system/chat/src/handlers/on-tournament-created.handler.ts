import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager } from '@tcom/platform/lib/chat';
import { TournamentCreatedEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnTournamentCreatedHandler extends PlatformEventHandler<TournamentCreatedEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager) {
            super();
    }

    protected async process(event: Readonly<TournamentCreatedEvent>): Promise<void> {
        const payload = event.payload;

        if (!payload.chatEnabled) {
            Logger.info(`Chat not enabled for tournament ${payload.id}, skipping.`);
            return;
        }

        const channelName = payload.chatChannel || `Tournament_${payload.id}`;
        const topic = payload.chatChannel || `${payload.name} (${payload.id})`;
        const existing = await this.chatManager.getChannel(channelName);

        if (!existing) {
            await this.chatManager.createChannel(channelName, topic);
            Logger.info(`SendBird chat channel ${channelName} created.`);
            return;
        }

        if (existing.frozen)
            await this.chatManager.unfreezeChannel(channelName);
    }
}

export const onTournamentCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentCreatedHandler).execute(event));
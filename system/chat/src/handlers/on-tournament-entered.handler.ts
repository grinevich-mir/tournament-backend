import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager } from '@tcom/platform/lib/chat';
import { TournamentEnteredEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { TournamentState, TournamentManager } from '@tcom/platform/lib/tournament';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnTournamentEnteredHandler extends PlatformEventHandler<TournamentEnteredEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager,
        @Inject private readonly tournamentManager: TournamentManager) {
            super();
    }

    protected async process(event: Readonly<TournamentEnteredEvent>): Promise<void> {
        const payload = event.payload;

        const tournament = await this.tournamentManager.get(payload.id);

        if (!tournament)
            throw new Error(`Tournament ${payload.id} does not exist.`);

        if (!tournament.chatEnabled || tournament.state >= TournamentState.Ended)
            return;

        const channelName = `Tournament_${payload.id}`;
        await this.chatManager.addUserToChannel(channelName, payload.userId.toString());
        Logger.info(`Added user ${payload.userId} to SendBird channel ${channelName}`);
    }
}

export const onTournamentEntered = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentEnteredHandler).execute(event));
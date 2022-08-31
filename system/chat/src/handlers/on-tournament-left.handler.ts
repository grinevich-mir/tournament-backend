import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { ChatManager } from '@tcom/platform/lib/chat';
import { TournamentLeftEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { TournamentState, TournamentManager } from '@tcom/platform/lib/tournament';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnTournamentLeftHandler extends PlatformEventHandler<TournamentLeftEvent> {
    constructor(
        @Inject private readonly chatManager: ChatManager,
        @Inject private readonly tournamentManager: TournamentManager) {
            super();
    }

    protected async process(event: Readonly<TournamentLeftEvent>): Promise<void> {
        const payload = event.payload;

        const tournament = await this.tournamentManager.get(payload.id);

        if (!tournament)
            throw new Error(`Tournament ${payload.id} does not exist.`);

        if (!tournament.chatEnabled || tournament.state >= TournamentState.Ended)
            return;

        const channelName = `Tournament_${payload.id}`;
        await this.chatManager.removeUserFromChannel(channelName, payload.userId.toString());
        Logger.info(`Removed user ${payload.userId} from SendBird channel ${channelName}`);
    }
}

export const onTournamentLeft = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentLeftHandler).execute(event));
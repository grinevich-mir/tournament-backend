import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler, Config } from '@tcom/platform/lib/core';
import { TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import { EmailSender } from '../email-sender';
import { TournamentCompleteEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { SNSEvent } from 'aws-lambda';
import { EmailGroup } from '../email-group';

@Singleton
@LogClass()
export class OnTournamentFailedHandler extends PlatformEventHandler<TournamentCompleteEvent> {

    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly emailSender: EmailSender) {
        super();
    }

    protected async process(event: Readonly<TournamentCompleteEvent>): Promise<void> {
        const { id, state } = event.payload;
        const tournament = await this.tournamentManager.get(id);

        if (!tournament) {
            Logger.error(`Tournament ${id} not found.`);
            return;
        }

        if (state !== TournamentState.Failed)
            return;

        const data = {
            env: {
                stage: Config.stage
            },
            tournament: {
                id: tournament.id,
                name: tournament.name,
                playerCount: tournament.playerCount,
                startTime: tournament.startTime.toISOString(),
                endTime: tournament.endTime && tournament.endTime.toISOString(),
                completeTime: tournament.completeTime && tournament.completeTime.toISOString(),
            }
        };

        await this.emailSender.send('TournamentFailed', data, EmailGroup.Alerts);
    }
}

export const onTournamentFailed = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentFailedHandler).execute(event));

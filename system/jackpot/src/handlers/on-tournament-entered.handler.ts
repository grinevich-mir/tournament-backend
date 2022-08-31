import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentEnteredEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { TournamentManager } from '@tcom/platform/lib/tournament';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { JackpotContributor } from '@tcom/platform/lib/jackpot';

@Singleton
@LogClass()
class OnTournamentEnteredHandler extends PlatformEventHandler<TournamentEnteredEvent> {
    constructor(
        @Inject private readonly jackpotContributor: JackpotContributor,
        @Inject private readonly tournamentManager: TournamentManager) {
            super();
    }

    protected async process(event: Readonly<TournamentEnteredEvent>): Promise<void> {
        const payload = event.payload;

        const tournament = await this.tournamentManager.get(payload.id);

        if (!tournament) {
            Logger.error(`Tournament ${payload.id} does not exist.`);
            return;
        }

        if (!tournament.public || !tournament.contributionGroups)
            return;

        await this.jackpotContributor.contribute(tournament.contributionGroups, 1, `TournamentEntry:${payload.entryId}`);
    }
}

export const onTournamentEntered = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentEnteredHandler).execute(event));
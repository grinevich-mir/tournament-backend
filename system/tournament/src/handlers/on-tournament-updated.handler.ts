import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentUpdatedEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { TournamentRuntimeManager } from '@tcom/platform/lib/tournament';

@Singleton
@LogClass()
class OnTournamentUpdatedHandler extends PlatformEventHandler<TournamentUpdatedEvent> {
    constructor(
        @Inject private readonly tournamentRuntimeManager: TournamentRuntimeManager) {
        super();
    }

    protected async process(event: Readonly<TournamentUpdatedEvent>): Promise<void> {
        const payload = event.payload;

        if (payload.endTimeChanged && payload.endTime)
            await this.tournamentRuntimeManager.updateEndTime(payload.id, payload.endTime);
    }
}

export const onTournamentUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentUpdatedHandler).execute(event));
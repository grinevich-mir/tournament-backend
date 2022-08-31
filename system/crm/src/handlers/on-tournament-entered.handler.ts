import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentEnteredEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ContactUpdate, CRMManager } from '@tcom/platform/lib/crm';
import { UserManager, UserType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';
import { TournamentEntryManager } from '@tcom/platform/lib/tournament';

@Singleton
@LogClass()
class OnTournamentEnteredHandler extends PlatformEventHandler<TournamentEnteredEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmManager: CRMManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager) {
        super();
    }

    protected async process(event: Readonly<TournamentEnteredEvent>): Promise<void> {
        const payload = event.payload;

        const user = await this.userManager.get(event.payload.userId);

        if (!user || user.type === UserType.Bot)
            return;

        const entry = await this.tournamentEntryManager.getById(event.payload.entryId);

        const update: ContactUpdate = {
            hasPlayed: true,
            lastPlayed: new Date(event.timestamp)
        };

        if (entry && entry.totalCost > 0)
            update.hasPaidToPlayTournament = true;

        await this.crmManager.updateContact(payload.userId, update);

        await this.crmManager.addEvent(payload.userId, CRMEventType.TournamentEntered, {
            tournamentId: payload.id,
            entryId: payload.entryId
        });
    }
}

export const onTournamentEntered = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentEnteredHandler).execute(event));

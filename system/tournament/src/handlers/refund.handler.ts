import { lambdaHandler } from '@tcom/platform/lib/core';
import { Inject, Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { TournamentEntryManager } from '@tcom/platform/lib/tournament';
import { LogClass } from '@tcom/platform/lib/core/logging';

interface RefundEvent {
    tournamentId: number;
    processed: number;
}

interface RefundResult {
    tournamentId: number;
    processed: number;
    complete: boolean;
}

@Singleton
@LogClass()
class RefundHandler {
    constructor(
        @Inject private readonly entryManager: TournamentEntryManager) {
        }

    public async execute(event: RefundEvent): Promise<RefundResult> {
        let processed = event.processed || 0;

        const batch = await this.entryManager.getRefundable(event.tournamentId);

        if (batch.length === 0)
            return {
                tournamentId: event.tournamentId,
                processed,
                complete: true
            };

        for (const entry of batch) {
            await this.entryManager.refund(entry);
            processed++;
        }

        return {
            tournamentId: event.tournamentId,
            processed,
            complete: false
        };
    }
}

export const refund = lambdaHandler((event: RefundEvent) => IocContainer.get(RefundHandler).execute(event));
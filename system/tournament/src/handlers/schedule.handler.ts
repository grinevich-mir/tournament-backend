import { lambdaHandler } from '@tcom/platform/lib/core';
import { TournamentScheduler } from '../utilities/tournament-scheduler';
import { IocContainer, Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ScheduleHandler {
    constructor(
        @Inject private readonly scheduler: TournamentScheduler) {
        }

    public async execute(): Promise<void> {
        await this.scheduler.run();
    }
}

export const schedule = lambdaHandler(() => IocContainer.get(ScheduleHandler).execute());
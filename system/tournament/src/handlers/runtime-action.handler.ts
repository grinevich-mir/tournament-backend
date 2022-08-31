import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { BadRequestError, GeneralError, lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import Logger, { LogClass, LogLevel } from '@tcom/platform/lib/core/logging';
import { Tournament, TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import { TournamentLifecycleActionResult, TournamentLifecycleManagerFactory } from '@tcom/platform/lib/tournament/lifecycle';

enum RuntimeAction {
    Launch = 'Launch',
    Start = 'Start',
    Finalise = 'Finalise',
    End = 'End'
}

interface RuntimeActionEvent {
    executionName: string;
    tournamentId: number;
    action: RuntimeAction;
    startTime?: Date;
    endTime?: Date;
}

interface RuntimActionResult {
    tournamentId: number;
    startTime: Date;
    endTime: Date;
}

class LifecycleStopError extends GeneralError {
    constructor() {
        super('Lifecycle stopped by lifecycle action result.');
    }
}

@Singleton
@LogClass({ level: LogLevel.Info })
class RuntimeActionHandler {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly lifecycleManagerFactory: TournamentLifecycleManagerFactory) {
    }

    public async execute(event: RuntimeActionEvent): Promise<RuntimActionResult> {
        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament)
            throw new NotFoundError(`Tournament ${event.tournamentId} not found.`);

        try {
            Logger.info(`Running ${TournamentState[tournament.type]} ${event.action} lifecycle action`);

            const result = await this.runLifecycleAction(tournament, event.action);

            if (result.nextState)
                await this.tournamentManager.setState(tournament.id, result.nextState);

            if (result.stop)
                throw new LifecycleStopError();

            const endTime = result.endTime || event.endTime || tournament.endTime;

            if (!endTime)
                throw new BadRequestError(`An end time must be set, failing tournament ${tournament.id}`);

            return {
                tournamentId: tournament.id,
                startTime: result.startTime || event.startTime || tournament.startTime,
                endTime
            };
        } catch (err) {
            if (!(err instanceof LifecycleStopError))
                await this.tournamentManager.setState(tournament.id, TournamentState.Failed);

            throw err;
        }
    }

    private async runLifecycleAction(tournament: Tournament, action: RuntimeAction): Promise<TournamentLifecycleActionResult> {
        const lifecycleManager = this.lifecycleManagerFactory.create(tournament.type);

        switch (action) {
            case RuntimeAction.Launch:
                return lifecycleManager.launch(tournament);

            case RuntimeAction.Start:
                return lifecycleManager.start(tournament);

            case RuntimeAction.Finalise:
                return lifecycleManager.finalise(tournament);

            case RuntimeAction.End:
                return lifecycleManager.end(tournament);
        }
    }
}

export const runtimeAction = lambdaHandler((event: RuntimeActionEvent) => IocContainer.get(RuntimeActionHandler).execute(event), {
    errorHandler: err => {
        if (!(err instanceof LifecycleStopError))
            Logger.error(`Invoke Error`, err);
        throw err;
    }
});
import { Config, lambdaHandler } from '@tcom/platform/lib/core';
import { Inject, Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { TournamentManager, TournamentRuntimeManager } from '@tcom/platform/lib/tournament';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class LaunchHandler {
    constructor(
        @Inject private readonly manager: TournamentManager,
        @Inject private readonly runtimeManager: TournamentRuntimeManager) {
        }

    public async execute(): Promise<void> {
        await this.cleanup();
        await this.launch();
    }

    private async cleanup(): Promise<void> {
        Logger.info('Cleaning up...');
        const tournaments = await this.manager.getUnlaunched(Config.region);

        if (tournaments.length === 0) {
            Logger.info('Nothing to clean up.');
            return;
        }

        Logger.info(`Cleaning up ${tournaments.length} tournament(s)...`);

        for (const tournament of tournaments) {
            Logger.error(`Tournament ${tournament.id} failed to launch, setting to failed state.`);
            await this.runtimeManager.fail(tournament);
        }

        Logger.info('Cleanup complete.');
    }

    private async launch(): Promise<void> {
        Logger.info('Launching tournaments...');
        const tournaments = await this.manager.getForLaunch(Config.region);

        if (tournaments.length === 0) {
            Logger.info(`Nothing to launch.`);
            return;
        }

        for (const tournament of tournaments)
            await this.runtimeManager.launch(tournament);

        Logger.info('Launch complete.');
    }
}

export const launch = lambdaHandler(() => IocContainer.get(LaunchHandler).execute());
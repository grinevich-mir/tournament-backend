import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentCompleteEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { Config, lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import AWS from 'aws-sdk';
import { TournamentManager } from '@tcom/platform/lib/tournament';

const FREEZE_DELAY = 300;

@Singleton
@LogClass()
class OnTournamentCompleteHandler extends PlatformEventHandler<TournamentCompleteEvent> {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager) {
            super();
        }

    protected async process(event: Readonly<TournamentCompleteEvent>): Promise<void> {
        const payload = event.payload;

        const tournament = await this.tournamentManager.get(payload.id);

        if (!tournament) {
            Logger.error(`Tournament ${payload.id} not found.`);
            return;
        }

        if (tournament.chatChannel)
            return;

        await this.scheduleChannelFreeze(tournament.id);
    }

    private async scheduleChannelFreeze(id: number): Promise<void> {
        const stepFunctions = new AWS.StepFunctions();
        const stateMachineArn = `arn:aws:states:${Config.region}:${Config.accountId}:stateMachine:scheduleChannelFreeze`;
        const channelName = `Tournament_${id}`;
        await stepFunctions.startExecution({
            name: `ChannelFreeze_${channelName}`,
            stateMachineArn,
            input: JSON.stringify({
                channelName,
                delay: FREEZE_DELAY
            })
        }).promise();
    }
}

export const onTournamentComplete = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentCompleteHandler).execute(event));
import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { TournamentManager, TournamentState, TournamentStateGroups } from '@tcom/platform/lib/tournament';
import { ECS } from 'aws-sdk';
import _ from 'lodash';

interface CloudwatchECSTaskEvent {
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: ECS.Task;
}

@Singleton
@LogClass()
class TaskEndMonitorHandler {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager) {}

    public async execute(event: CloudwatchECSTaskEvent): Promise<void> {
        Logger.debug('EVENT', event);

        const taskArn = event.detail.taskArn;

        if (!taskArn)
            throw new Error('Task ARN was not present.');

        const taskId = _.last(taskArn.split('/'));

        if (!taskId)
            throw new Error('Could not extract task ID');

        if (!event.detail.containers || event.detail.containers.length === 0)
            throw new Error(`Task ${taskId} had no containers in event data.`);

        const container = event.detail.containers[0];

        if (container.exitCode === 0)
            return;

        const tournament = await this.tournamentManager.getByTaskId(taskId);

        if (!tournament) {
            Logger.error(`Tournament task '${taskId}' stopped with exit code ${container.exitCode}`);
            return;
        } else
            Logger.error(`Tournament ${tournament.id} task '${taskId}' stopped with exit code ${container.exitCode}`);

        if (TournamentStateGroups.Ended.includes(tournament.state))
            return;

        await this.tournamentManager.setState(tournament.id, TournamentState.Failed);
    }
}

export const onTaskEnded = lambdaHandler((event: CloudwatchECSTaskEvent) => IocContainer.get(TaskEndMonitorHandler).execute(event));
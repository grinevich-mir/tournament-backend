import AWS from 'aws-sdk';
import env from 'env-var';
import _ from 'lodash';
import moment from 'moment';
import { BadRequestError, Config } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { Tournament } from '../tournament';
import { TournamentManager } from '../tournament-manager';
import { TournamentState } from '../tournament-state';
import { TournamentRuntime } from './tournament-runtime';

const minLaunchMinutes = 3;

@Singleton
@LogClass()
export class FargateTournamentRuntime implements TournamentRuntime {
    constructor(
        @Inject private readonly manager: TournamentManager) {
    }

    public async launch(tournament: Tournament): Promise<void> {
        try {
            Logger.info(`Launching Tournament ${tournament.id} using Fargate runtime...`);

            if (tournament.state !== TournamentState.Scheduled) {
                Logger.error(`Tournament ${tournament.id} has already been launched, aborting.`);
                return;
            }

            const currentTaskId = await this.manager.getTaskId(tournament.id);

            if (currentTaskId) {
                Logger.error(`Tournament ${tournament.id} has already got a task ID assigned to it, aborting.`);
                return;
            }

            const diff = moment(tournament.startTime).diff(moment.utc(), 'minutes');

            if (diff <= minLaunchMinutes)
                throw new Error(`Not enough time to launch tournament ${tournament.id}.`);

            const taskId = await this.runTask(tournament);
            Logger.info(`Task ID: ${taskId}`);

            await this.manager.addTaskId(tournament.id, taskId);
            Logger.info(`Tournament ${tournament.id} task created.`);
            await this.manager.setState(tournament.id, TournamentState.Launching);
        } catch (err) {
            Logger.error(err);
            await this.manager.setState(tournament.id, TournamentState.Failed);
        }
    }

    public async complete(tournament: Tournament): Promise<void> {
        if (tournament.state !== TournamentState.Running)
            throw new BadRequestError(`Tournament ${tournament.id} is not in a Running state and cannot be completed.`);

        const taskId = await this.manager.getTaskId(tournament.id);

        if (taskId) {
            const ecs = new AWS.ECS({
                region: tournament.region
            });
            const cluster = 'tournament-cluster';
            const tasksResult = await ecs.describeTasks({
                tasks: [taskId],
                cluster
            }).promise();

            if (tasksResult.tasks && tasksResult.tasks.length > 0 && tasksResult.tasks[0].lastStatus !== 'STOPPED')
                await ecs.stopTask({
                    task: taskId,
                    cluster
                }).promise();
        }

        await this.manager.setState(tournament.id, TournamentState.Ended);
    }

    public async cancel(tournament: Tournament): Promise<void> {
        if (tournament.state > TournamentState.Running)
            throw new BadRequestError(`Tournament ${tournament.id} is in a ${TournamentState[tournament.state]} state and cannot be cancelled.`);

        const taskId = await this.manager.getTaskId(tournament.id);

        if (taskId) {
            const ecs = new AWS.ECS({
                region: tournament.region
            });
            const cluster = 'tournament-cluster';
            const tasksResult = await ecs.describeTasks({
                tasks: [taskId],
                cluster
            }).promise();

            if (tasksResult.tasks && tasksResult.tasks.length > 0 && tasksResult.tasks[0].lastStatus !== 'STOPPED')
                await ecs.stopTask({
                    task: taskId,
                    cluster
                }).promise();
        }

        await this.manager.setState(tournament.id, TournamentState.Cancelled);
    }

    public async fail(tournament: Tournament): Promise<void> {
        await this.manager.setState(tournament.id, TournamentState.Failed);

        const taskId = await this.manager.getTaskId(tournament.id);

        if (!taskId)
            return;

        const ecs = new AWS.ECS({
            region: Config.region
        });

        try {
            await ecs.stopTask({
                cluster: 'tournament-cluster',
                task: taskId,
                reason: 'Tournament was still in Launching state past its start time.'
            }).promise();
        } catch (err) {
        }
    }

    public async updateEndTime(tournament: Tournament, endTime: Date): Promise<void> {
        if (tournament.state !== TournamentState.Scheduled)
            throw new BadRequestError('Tournament must be in a scheduled state to update start or end time.');
    }

    private async runTask(tournament: Tournament): Promise<string> {
        const taskDefinition = await this.manager.getTaskDefinition(tournament.type);

        if (!taskDefinition)
            throw new Error(`Tournament ${tournament.id} task definition is missing!`);

        const ecs = new AWS.ECS({
            region: Config.region
        });

        const subnets = env.get('SUBNETS').required().asArray(',');

        const result = await ecs.runTask({
            cluster: 'tournament-cluster',
            count: 1,
            taskDefinition,
            launchType: 'FARGATE',
            startedBy: `Tournament:${tournament.id}`,
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: 'DISABLED',
                    subnets
                }
            },
            overrides: {
                containerOverrides: [
                    {
                        name: taskDefinition,
                        environment: [
                            {
                                name: 'TOURNAMENT_ID',
                                value: tournament.id.toString()
                            }
                        ]
                    }
                ]
            }
        }).promise();

        if (result.failures && result.failures.length > 0)
            throw new Error(`Tournament ${tournament.id} launch failed: ${result.failures[0].reason}`);

        if (!result.tasks || result.tasks.length === 0 || !result.tasks[0].taskArn)
            throw new Error(`Tournament ${tournament.id} launch failed: Task was not created!`);

        const taskArn = result.tasks[0].taskArn;
        const taskId = _.last(taskArn.split('/'));

        if (!taskId)
            throw new Error(`Tournament ${tournament.id} task ID could not be parsed from ${taskArn}.`);

        return taskId;
    }
}
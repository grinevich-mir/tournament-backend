import AWS from 'aws-sdk';
import _ from 'lodash';
import { Config, JsonSerialiser } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass, LogLevel } from '../../core/logging';
import { Tournament } from '../tournament';
import { TournamentManager } from '../tournament-manager';
import { TournamentState } from '../tournament-state';
import { TournamentType } from '../tournament-type';
import { TournamentRuntime } from './tournament-runtime';

@Singleton
@LogClass({ level: LogLevel.Info })
export class StepFunctionTournamentRuntime implements TournamentRuntime {
    constructor(
        @Inject private readonly manager: TournamentManager,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async launch(tournament: Tournament): Promise<void> {
        try {
            Logger.info(`Launching Tournament ${tournament.id} using StepFunction runtime...`);

            const currentExecutionId = await this.manager.getTaskId(tournament.id);

            if (currentExecutionId) {
                Logger.error(`Tournament ${tournament.id} has already got a execution ID assigned to it, aborting.`);
                return;
            }

            const stepFunctions = new AWS.StepFunctions();
            const stateMachineArn = `arn:aws:states:${Config.region}:${Config.accountId}:stateMachine:runTournament`;
            const response = await stepFunctions.startExecution({
                stateMachineArn,
                input: this.serialiser.serialise({
                    tournamentId: tournament.id,
                    type: TournamentType[tournament.type],
                    name: tournament.name,
                    templateId: tournament.templateId
                })
            }).promise();

            const executionId = _.last(response.executionArn.split(':'));

            if (!executionId || executionId.length !== 36)
                throw new Error('Could not get execution ID');

            Logger.info(`Execution ID: ${executionId}`);
            await this.manager.addTaskId(tournament.id, executionId);
        } catch (err) {
            Logger.error(err);
            await this.manager.setState(tournament.id, TournamentState.Failed);
        }
    }

    public async complete(tournament: Tournament): Promise<void> {
        await this.stopExecution(tournament);
        await this.manager.setState(tournament.id, TournamentState.Ended);
    }

    public async cancel(tournament: Tournament): Promise<void> {
        await this.stopExecution(tournament);
        await this.manager.setState(tournament.id, TournamentState.Cancelled);
    }

    public async fail(tournament: Tournament): Promise<void> {
        await this.stopExecution(tournament);
        await this.manager.setState(tournament.id, TournamentState.Failed);
    }

    public async updateEndTime(tournament: Tournament, endTime: Date): Promise<void> {
        await this.stopExecution(tournament);
        await this.manager.removeTaskId(tournament.id);
        await this.launch(tournament);
    }

    private async getExecutionArn(tournamentId: number): Promise<string | undefined> {
        const taskId = await this.manager.getTaskId(tournamentId);

        if (!taskId) {
            Logger.error(`Could not find task ID for tournament ${tournamentId}`);
            return undefined;
        }

        return `arn:aws:states:${Config.region}:${Config.accountId}:execution:runTournament:${taskId}`;
    }

    private async stopExecution(tournament: Tournament): Promise<void> {
        const stepFunctions = new AWS.StepFunctions({
            region: tournament.region
        });
        const executionArn = await this.getExecutionArn(tournament.id);

        if (!executionArn)
            return;

        try {
            const execution = await stepFunctions.describeExecution({
                executionArn
            }).promise();

            if (execution.status === 'RUNNING')
                await stepFunctions.stopExecution({
                    executionArn
                }).promise();
        } catch (err) {
            const awsError = err as AWS.AWSError;

            if (awsError.code !== 'ExecutionDoesNotExist')
                throw err;
        }
    }
}
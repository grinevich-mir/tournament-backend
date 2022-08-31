import { BadRequestError, NotFoundError } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { TournamentRuntimeFactory } from './runtime/tournament-runtime.factory';
import { Tournament } from './tournament';
import { TournamentManager } from './tournament-manager';
import { TournamentRuntimeType } from './tournament-runtime-type';
import { TournamentState } from './tournament-state';

@Singleton
@LogClass()
export class TournamentRuntimeManager {
    constructor(
        @Inject private readonly manager: TournamentManager,
        @Inject private readonly runtimeFactory: TournamentRuntimeFactory) {
    }

    public async launch(id: number): Promise<void>;
    public async launch(tournament: Tournament): Promise<void>;
    public async launch(tournamentOrId: number | Tournament): Promise<void> {
        const tournament = typeof tournamentOrId === 'number' ? await this.manager.get(tournamentOrId) : tournamentOrId;

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        const runtime = this.runtimeFactory.create(tournament.runtime || TournamentRuntimeType.Fargate);
        await runtime.launch(tournament);
    }

    public async complete(id: number): Promise<void>;
    public async complete(tournament: Tournament): Promise<void>;
    public async complete(tournamentOrId: number | Tournament): Promise<void> {
        const tournament = typeof tournamentOrId === 'number' ? await this.manager.get(tournamentOrId) : tournamentOrId;

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        if (tournament.state !== TournamentState.Running)
            throw new BadRequestError(`Tournament ${tournament.id} is in a ${TournamentState[tournament.state]} state and cannot be completed.`);

        const runtime = this.runtimeFactory.create(tournament.runtime || TournamentRuntimeType.Fargate);
        await runtime.complete(tournament);
    }

    public async cancel(id: number): Promise<void>;
    public async cancel(tournament: Tournament): Promise<void>;
    public async cancel(tournamentOrId: number | Tournament): Promise<void> {
        const tournament = typeof tournamentOrId === 'number' ? await this.manager.get(tournamentOrId) : tournamentOrId;

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        if (tournament.state > TournamentState.Running)
            throw new BadRequestError(`Tournament ${tournament.id} is in a ${TournamentState[tournament.state]} state and cannot be cancelled.`);

        const runtime = this.runtimeFactory.create(tournament.runtime || TournamentRuntimeType.Fargate);
        await runtime.cancel(tournament);
    }

    public async fail(id: number): Promise<void>;
    public async fail(tournament: Tournament): Promise<void>;
    public async fail(tournamentOrId: number | Tournament): Promise<void> {
        const tournament = typeof tournamentOrId === 'number' ? await this.manager.get(tournamentOrId) : tournamentOrId;

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        const runtime = this.runtimeFactory.create(tournament.runtime || TournamentRuntimeType.Fargate);
        await runtime.fail(tournament);
    }

    public async updateEndTime(id: number, endTime: Date): Promise<void>;
    public async updateEndTime(tournament: Tournament, endTime: Date): Promise<void>;
    public async updateEndTime(tournamentOrId: number | Tournament, endTime: Date): Promise<void> {
        const tournament = typeof tournamentOrId === 'number' ? await this.manager.get(tournamentOrId) : tournamentOrId;

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        const runtime = this.runtimeFactory.create(tournament.runtime || TournamentRuntimeType.Fargate);
        await runtime.updateEndTime(tournament, endTime);
    }
}
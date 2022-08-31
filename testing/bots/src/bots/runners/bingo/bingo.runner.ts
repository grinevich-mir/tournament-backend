import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { Runner } from '../runner';
import { BingoClient } from './bingo-client';
import { TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import _ from 'lodash';

@Singleton
export class BingoRunner extends Runner {
    private checkTimer?: NodeJS.Timer;

    constructor(
        @Inject private readonly client: BingoClient,
        @Inject private readonly tournamentManager: TournamentManager) {
        super();
    }

    public async start(): Promise<void> {
        this.log('Starting Bingo Runner...');
        this.running = true;
        await this.join();
        this.scheduleCheck();
    }

    private async checkTournament(): Promise<void> {
        const tournament = await this.tournamentManager.get(this.tournament.id);

        if (tournament && tournament.state < TournamentState.Finalising) {
            this.scheduleCheck();
            return;
        }

        this.log(`Tournament ${this.tournament.id} has ended.`);
        await this.stop();
    }

    private scheduleCheck(): void {
        const delay = _.random(5000, 10000);
        this.checkTimer = setTimeout(async () => this.checkTournament(), delay);
    }

    public async stop(): Promise<void> {
        if (this.checkTimer)
            clearTimeout(this.checkTimer);

        this.checkTimer = undefined;
        const delay = _.random(5000, 1000);
        setTimeout(() => this.running = false, delay);
    }

    private async join(): Promise<void> {
        try {
            this.log('Joining Bingo game...');
            await this.client.join(this.tournament.id, this.entry.token);
        } catch (err) {
            this.log(`Join Error`, err);
            await this.stop();
        }
    }
}
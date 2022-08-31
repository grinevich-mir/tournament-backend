import { UserEntity } from '@tcom/platform/lib/user/entities/user.entity';
import { Runner } from './runners/runner';
import { scheduleJob, cancelJob, Job } from 'node-schedule';
import _ from 'lodash';
import { TournamentState, TournamentEntryManager, TournamentManager, Tournament } from '@tcom/platform/lib/tournament';
import { RunnerFactory } from './runners/runner.factory';
import { Inject } from '@tcom/platform/lib/core/ioc';
import moment from 'moment';
import { Chatter } from './chatter';

export class Bot {
    public user!: UserEntity;

    private blocked = false;
    private runner?: Runner;
    private nextJob?: Job;
    private firstRun = true;
    private tournamentType?: number;
    private played: number[] = [];

    constructor(
        @Inject private readonly runnerFactory: RunnerFactory,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly chatter: Chatter) {
        this.chatter.bot = this;
    }

    public async start(tournamentType?: number): Promise<void> {
        this.log('Starting...');
        this.tournamentType = tournamentType;
        await this.next();

        this.nextJob = scheduleJob('*/5 * * * * *', async () => this.next());
    }

    private async next(): Promise<void> {
        if (this.blocked || (this.runner && this.runner.running))
            return;

        this.blocked = true;

        if (this.chatter)
            this.chatter.stop();

        this.log('Getting next tournament to play...');
        let tournaments = await this.tournamentManager.getActive();

        if (!tournaments || tournaments.length === 0)
            return;

        const type = this.tournamentType || _.sample([1, 2]);

        const timeRemaining = this.firstRun ? 60 : 15;
        this.firstRun = false;

        const canPlay = (t: Tournament) => {
            if (t.name.includes('Astro'))
                return false;

            if (this.played.includes(t.id))
                return false;

            if (t.type !== type)
                return false;

            if (t.state < TournamentState.Waiting || t.state > TournamentState.Running)
                return false;

            if (!t.allowJoinAfterStart) {
                if (t.state !== TournamentState.Waiting)
                    return false;

                if (moment().isAfter(moment(t.startTime).subtract(timeRemaining, 'seconds')))
                    return false;
            } else if (t.endTime)
                if (moment().isAfter(moment(t.endTime).subtract(3, 'minutes')))
                    return false;

            return true;
        };

        tournaments = tournaments
            .filter(t => canPlay(t))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || a.id - b.id);

        const tournament = _.sample(_.take(tournaments, 2));

        if (!tournament) {
            this.blocked = false;
            this.log(`Could not select tournament.`);
            return;
        }

        this.log(`Joining tournament ${tournament.id}...`);
        this.played.push(tournament.id);

        try {
            let entry = await this.tournamentEntryManager.get(tournament.id, this.user.id, true);

            if (!entry)
                entry = await this.tournamentEntryManager.add(tournament.id, this.user.id, true);

            this.runner = this.runnerFactory.create(this, tournament, entry);
        } catch (error) {
            this.log(`Failed to join tournament ${tournament.id}!`, error);
            return;
        }

        if (!this.runner)
            return;

        await this.runner.start();

        if (tournament.chatEnabled)
            this.chatter.start(tournament.chatChannel || `Tournament_${tournament.id}`);

        this.blocked = false;
    }

    public async stop(): Promise<void> {
        if (this.nextJob)
            cancelJob(this.nextJob);

        this.nextJob = undefined;

        if (this.runner) {
            await this.runner.stop();
            this.runner.dispose();
        }

        this.runner = undefined;

        this.chatter.stop();
    }

    public log(...messages: string[]): void {
        console.log(`Bot: ${this.user.id}:`, ...messages);
    }
}
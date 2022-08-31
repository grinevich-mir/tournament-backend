import { Runner } from '../runner';
import { Job, scheduleJob, cancelJob } from 'node-schedule';
import moment from 'moment';
import { HiloClient } from './hilo-client';
import { Inject } from '@tcom/platform/lib/core/ioc';
import _ from 'lodash';
import { JoinResponse } from './interfaces';
import { TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import Chance from 'chance';

export class HiLoRunner extends Runner {
    private mode: 0 | 1 = 0;
    private checkTimer?: NodeJS.Timer;
    private playJob?: Job;
    private joinResponse!: JoinResponse;
    private sessionToken!: string;
    private currentRound = 0;
    private lastNumber = 0;
    private direction: 0 | 1 = 0;
    private minNumber = 1;
    private maxNumber = 21;
    private livesPerEntry = 3;
    private lives = 0;

    constructor(
        @Inject private readonly client: HiloClient,
        @Inject private readonly tournamentManager: TournamentManager) {
        super();
    }

    public async start(): Promise<void> {
        this.log('Starting HiLo Runner...');
        this.running = true;
        await this.join();
        this.scheduleCheck();
    }

    public async stop(): Promise<void> {
        if (this.checkTimer)
            clearTimeout(this.checkTimer);

        this.checkTimer = undefined;

        if (this.playJob)
            cancelJob(this.playJob);

        this.playJob = undefined;

        const delay = _.random(500, 1000);
        setTimeout(() => this.running = false, delay);
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

    private async join(): Promise<void> {
        try {
            this.log('Joining HiLo game...');
            this.joinResponse = await this.client.join(this.tournament.id, this.entry.token);
            if (this.joinResponse.roundNumber)
                this.currentRound = this.joinResponse.roundNumber;
            this.sessionToken = this.joinResponse.userToken;
            this.minNumber = this.joinResponse.minNumber;
            this.maxNumber = this.joinResponse.maxNumber;
            this.livesPerEntry = this.joinResponse.livesPerEntry;
            this.lives = this.joinResponse.livesCount;
            this.mode = this.joinResponse.mode;

            if ([1, 2].includes(this.mode) && !this.joinResponse.inPlay && this.lives === this.livesPerEntry) {
                this.log(`Reached maximum lives of ${this.livesPerEntry}, stopping...`);
                await this.stop();
                return;
            }

            this.log('Joined', JSON.stringify(this.joinResponse));

            let startTime = this.joinResponse.nextRoundStartTime || this.joinResponse.startTime;

            if (!startTime)
                startTime = this.tournament.startTime.getTime();

            this.schedulePlay(new Date(startTime));
        } catch (err) {
            this.log(`Join Error`, err);
            await this.stop();
        }
    }

    private schedulePlay(time: Date): void {
        const offset = _.random(3, 10);
        const playTime = moment(time).add(offset, 'seconds').toDate();

        this.log(`Play scheduled for ${playTime}`);

        this.playJob = scheduleJob(playTime, async () => this.play());
    }

    private async play(): Promise<void> {
        try {
            this.currentRound++;

            const round = await this.client.getRound(this.tournament.id, this.sessionToken, this.currentRound);

            this.log('Round', JSON.stringify(round));
            this.sessionToken = round.userToken;

            if (this.lastNumber > 0) {
                let correct = false;

                if (round.currentNumber > this.lastNumber && this.direction === 1)
                    correct = true;

                if (round.currentNumber < this.lastNumber && this.direction === 0)
                    correct = true;

                if (!correct) {
                    this.log('Chose incorrectly, knocked out.');
                    await this.retryOrStop();
                    return;
                }
            }

            this.lastNumber = round.currentNumber;

            if (round.winners) {
                await this.stop();
                return;
            }

            if (this.lastNumber === this.minNumber)
                this.direction = 1;
            else if (this.lastNumber === this.maxNumber)
                this.direction = 0;
            else {
                const chance = new Chance();
                const lastNumberIndex = this.lastNumber - 1;
                const higherWeight = Math.max(1 - (lastNumberIndex/this.maxNumber), 0);
                const lowerWeight = 1 - higherWeight;
                this.direction = chance.weighted([1, 0], [higherWeight, lowerWeight]);
            }

            this.log(`Choosing ${this.direction === 0 ? 'LOW' : 'HIGH'}`);
            const play = await this.client.play(this.tournament.id, this.sessionToken, this.currentRound, this.direction);
            this.sessionToken = play.userToken;

            this.schedulePlay(new Date(round.nextRoundStartTime));
        } catch (err) {
            this.log(`Play Error`, err);
            await this.retryOrStop();
        }
    }

    private async retryOrStop(): Promise<void> {
        if (this.playJob)
            cancelJob(this.playJob);

        if (this.mode === 0) {
            await this.stop();
            return;
        }

        if (this.livesPerEntry === this.lives) {
            this.log(`Reached maxmimum lives of ${this.livesPerEntry}, stopping.`);
            await this.stop();
            return;
        }

        this.log(`Lives remaining: ${this.livesPerEntry - this.lives}, retrying...`);
        await this.join();
    }
}
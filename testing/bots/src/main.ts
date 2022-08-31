Error.stackTraceLimit = Number.POSITIVE_INFINITY;

import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import _ from 'lodash';
import { UserEntity } from '@tcom/platform/lib/user/entities/user.entity';
import { UserType } from '@tcom/platform/lib/user/user-type';
import { Bot } from './bots/bot';
import moment from 'moment';
import { scheduleJob } from 'node-schedule';

const tournamentTypes = [1, 2];

@Singleton
class BotRunner {
    private botCount = 100;
    private randomBots = false;
    private randomType = false;
    private bots: Bot[] = [];

    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async start(): Promise<void> {
        console.log('Starting up...');
        const stopTime = moment().add(1, 'hour').toDate();
        console.log(`Stop scheduled for ${stopTime}.`);
        scheduleJob('stop', stopTime, async () => this.stop());

        process.on('uncaughtException', async (err) => {
            console.error('Uncaught Exception', err.message);
            await this.stop();
        });

        process.on('unhandledRejection', async (reason) => {
            console.error('Unhandled Rejection', reason);
            await this.stop();
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM was sent, cancelling...');
            await this.stop();
        });

        const botUsers = await this.getBots();
        console.log(`Bots: ${botUsers.length}`);

        if (this.randomType)
            for (const user of botUsers)
                await this.createBot(user);
        else {
            const typeGroups = _.chunk(botUsers, botUsers.length / tournamentTypes.length);

            for (let i = 0; i < typeGroups.length; i++) {
                console.log(`Bots for Tournament Type ${tournamentTypes[i]}: ${typeGroups[i].length}`);

                for (const user of typeGroups[i])
                    await this.createBot(user, tournamentTypes[i]);
            }
        }
    }

    private async stop(): Promise<void> {
        console.log('Stopping...');

        for (const bot of this.bots)
            await bot.stop();

        process.exit(0);
    }

    private async getBots(): Promise<UserEntity[]> {
        const connection = await this.db.getConnection();

        let query = connection.createQueryBuilder(UserEntity, 'user')
            .where({ type: UserType.Bot })
            .take(this.botCount);

        if (this.randomBots)
            query = query.orderBy('RAND()');

        const users = await query.getMany();
        return users;
    }

    private async createBot(user: UserEntity, tournamentType?: number): Promise<void> {
        const bot = IocContainer.get(Bot);
        bot.user = user;
        await bot.start(tournamentType);
        this.bots.push(bot);
    }
}

IocContainer.get(BotRunner).start().catch(err => { throw err; });
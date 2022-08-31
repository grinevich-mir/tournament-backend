import moment from 'moment';
import { parseExpression } from 'cron-parser';
import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { Config } from '@tcom/platform/lib/core';
import { TournamentState, TournamentManager, TournamentTemplateManager, TournamentTemplate, Tournament, TournamentRuntimeType } from '@tcom/platform/lib/tournament';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

const minScheduledCount = 1;
const preLaunchMinutes: { [runtime in TournamentRuntimeType]: number } = {
    Fargate: 6,
    StepFunction: 3
};

@Singleton
@LogClass()
export class TournamentScheduler {
    constructor(
        @Inject private readonly templateRepository: TournamentTemplateManager,
        @Inject private readonly tournamentManager: TournamentManager) {
        }

    public async run(): Promise<void> {
        Logger.info('Scheduling tournaments...');

        let templates = await this.templateRepository.getAll({
            enabled: true,
            region: Config.region,
            scheduleType: 'cron'
        });

        templates = _.shuffle(templates);

        const scheduledTournaments = await this.tournamentManager.getAll({
            region: Config.region,
            states: [TournamentState.Scheduled]
        });

        for (const template of templates)
            try {
                const templateTournaments = scheduledTournaments.items.filter(t => t.templateId === template.id);
                await this.processTemplate(template, templateTournaments);
            } catch (err) {
                Logger.error(`Could not create tournament from template ${template.id}`, err);
            }
    }

    private async processTemplate(template: TournamentTemplate, scheduledTournaments: Tournament[]): Promise<void> {
        if (!template.cronPattern) {
            console.error(`Tournament Template ${template.id} does not have a cron pattern!`);
            return;
        }

        let startDate = moment.utc();

        if (scheduledTournaments.length > 0) {
            const lastTournament = scheduledTournaments[0];
            startDate = moment(lastTournament.startTime);
        }

        const interval = parseExpression(template.cronPattern, {
            currentDate: startDate.toDate(),
            utc: true
        });

        const requiredTournamentCount =  minScheduledCount - scheduledTournaments.length;

        if (requiredTournamentCount <= 0) {
            Logger.info(`Template ${template.id} - Nothing to create.`);
            return;
        }

        Logger.info(`Template ${template.id} - Creating ${requiredTournamentCount} tournament(s)...`);
        let createdCount = 0;

        while (createdCount < requiredTournamentCount) {
            const startTime = moment(interval.next().toDate()).toDate();
            const minMins = preLaunchMinutes[template.runtime];
            const launchTime = moment(startTime).subtract(minMins, 'minutes').toDate();

            if (moment(launchTime).isSameOrBefore(moment())) {
                Logger.warn(`Skipping scheduling for ${launchTime}, not enough launch time available.`);
                continue;
            }

            await this.tournamentManager.addFromTemplate(template, launchTime, startTime);
            createdCount++;
        }

        Logger.info(`Template: ${template.id} - ${createdCount} Tournament(s) created.`);
    }
}
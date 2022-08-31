import { Runner } from './runner';
import { Bot } from '../bot';
import { HiLoRunner } from './hilo/hilo.runner';
import { Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { BingoRunner } from './bingo/bingo.runner';
import { Tournament, TournamentEntry, TournamentType } from '@tcom/platform/lib/tournament';

@Singleton
export class RunnerFactory {
    public create(bot: Bot, tournament: Tournament, entry: TournamentEntry): Runner | undefined {
        let runner: Runner | undefined;

        switch (tournament.type) {
            case TournamentType.HiLo:
                runner = IocContainer.get(HiLoRunner);
                break;

            case TournamentType.Bingo:
                runner = IocContainer.get(BingoRunner);
                break;
        }

        if (runner) {
            runner.bot = bot;
            runner.tournament = tournament;
            runner.entry = entry;
        }

        return runner;
    }
}
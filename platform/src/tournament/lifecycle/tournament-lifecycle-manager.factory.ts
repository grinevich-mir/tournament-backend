import { IocContainer, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { TournamentType } from '../tournament-type';
import { BingoTournamentLifecycleManager } from './bingo-tournament-lifecycle-manager';
import { BlackjackTournamentLifecycleManager } from './blackjack-tournament-lifecycle-manager';
import { CrashTournamentLifecycleManager } from './crash-tournament-lifecycle-manager';
import { DefaultTournamentLifecycleManager } from './default-tournament-lifecycle-manager';
import { HiLoTournamentLifecycleManager } from './hilo-tournament-lifecycle-manager';
import { TournamentLifecycleManager } from './tournament-lifecycle-manager';

@Singleton
@LogClass()
export class TournamentLifecycleManagerFactory {
    public create(type: TournamentType): TournamentLifecycleManager {
        switch (type) {
            case TournamentType.HiLo:
                return IocContainer.get(HiLoTournamentLifecycleManager);

            case TournamentType.Blackjack:
                return IocContainer.get(BlackjackTournamentLifecycleManager);

            case TournamentType.Crash:
                return IocContainer.get(CrashTournamentLifecycleManager);

            case TournamentType.Bingo:
                return IocContainer.get(BingoTournamentLifecycleManager);

            default:
                return IocContainer.get(DefaultTournamentLifecycleManager);
        }
    }
}
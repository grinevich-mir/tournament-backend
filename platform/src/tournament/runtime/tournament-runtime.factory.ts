import { IocContainer, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { TournamentRuntimeType } from '../tournament-runtime-type';
import { FargateTournamentRuntime } from './fargate-tournament-runtime';
import { StepFunctionTournamentRuntime } from './step-function-tournament-runtime';
import { TournamentRuntime } from './tournament-runtime';

@Singleton
@LogClass()
export class TournamentRuntimeFactory {
    public create(runtime: TournamentRuntimeType): TournamentRuntime {
        switch (runtime) {
            case TournamentRuntimeType.Fargate:
                return IocContainer.get(FargateTournamentRuntime);

            case TournamentRuntimeType.StepFunction:
                return IocContainer.get(StepFunctionTournamentRuntime);
        }
    }
}
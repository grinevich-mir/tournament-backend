import { NewFixedJackpot, NewProgressiveJackpot, NewTangibleJackpot } from './new-jackpot';

type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

export type FixedJackpotUpdate = OptionalExceptFor<NewFixedJackpot, 'type'>;
export type ProgressiveJackpotUpdate = OptionalExceptFor<NewProgressiveJackpot, 'type'>;
export type TangibleJackpotUpdate = OptionalExceptFor<NewTangibleJackpot, 'type'>;

export type JackpotUpdate = FixedJackpotUpdate | ProgressiveJackpotUpdate | TangibleJackpotUpdate;
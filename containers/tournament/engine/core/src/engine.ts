import { EventEmitter } from 'events';
import { EngineManager } from './engine-manager';
import { TournamentRoundResult } from '@tcom/platform/lib/tournament';

export abstract class Engine extends EventEmitter {
    public manager!: EngineManager;

    public abstract name: string;

    public abstract init(): Promise<void>;
    public abstract start(): Promise<void>;
    public abstract cancel(): Promise<void>;
    public abstract complete(): Promise<void>;
    public abstract shutdown(): Promise<void>;
    public abstract roundResults(results: TournamentRoundResult[]): Promise<void>;
}
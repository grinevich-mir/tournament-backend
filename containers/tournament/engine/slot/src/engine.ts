import { Engine, Ignition } from '@tcom/tournament-engine-core';
import { Provides } from '@tcom/platform/lib/core/ioc';
import { TournamentRoundResult } from '@tcom/platform/lib/tournament';
import _ from 'lodash';
import Logger from '@tcom/platform/lib/core/logging';

@Provides(Engine)
export class SlotEngine extends Engine {
    public name = 'slot';

    public async init(): Promise<void> {
        Logger.info('Slot Engine: Init');
    }

    public async start(): Promise<void> {
        Logger.info('Slot Engine: Start');
    }

    public async cancel(): Promise<void> {
        Logger.info('Slot Engine: Cancel');
    }

    public async complete(): Promise<void> {
        Logger.info('Slot Engine: Complete');
    }

    public async shutdown(): Promise<void> {
        Logger.info('Slot Engine: Shutdown');
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info('Slot Engine: Round Results', results);
    }
}

Ignition.start().catch(err => { throw err; });
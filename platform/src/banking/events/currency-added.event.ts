import { PlatformEvent } from '../../core/events';

export class CurrencyAddedEvent extends PlatformEvent {
    constructor(public readonly code: string, public readonly rate: number) {
        super('Banking:CurrencyAdded');
    }
}
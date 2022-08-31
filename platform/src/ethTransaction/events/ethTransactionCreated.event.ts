import { PlatformEvent } from '../../core/events';

export class EthTransactionCreatedEvent extends PlatformEvent {
    constructor(public readonly id: number) {
        super('EthTransaction:Created');
    }
}
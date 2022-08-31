import { Inject } from '@tcom/platform/lib/core/ioc';
import { MessageDispatcherFactory } from './message-dispatcher.factory';
import { Message } from '@tcom/platform/lib/websocket';
import Logger from '@tcom/platform/lib/core/logging';

export class MessageController {
    constructor(
        @Inject private readonly dispatcherFactory: MessageDispatcherFactory) {
        }

    public async processMessage(message: Message): Promise<void> {
        if (!message.$target)
            throw new Error('Message does not have a target!');

        const dispatcher = this.dispatcherFactory.create(message.$target);

        if (!dispatcher) {
            Logger.warn(`Unsupported message target '${JSON.stringify(message.$target)}'.`);
            return;
        }

        await dispatcher.dispatch(message);
    }
}
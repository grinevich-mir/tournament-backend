import { Inject } from '@tcom/platform/lib/core/ioc';
import { WebsocketManager, ConnectionTarget } from '@tcom/platform/lib/websocket';
import { MessageSender } from '../message-sender';
import { TargettedMessage } from '@tcom/platform/lib/websocket';
import { IMessageDispatcher } from '../message.interfaces';

export class ConnectionMessageDispatcher implements IMessageDispatcher<ConnectionTarget> {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly messageSender: MessageSender) {
        }

    public async dispatch(message: TargettedMessage<ConnectionTarget>): Promise<void> {
        const connection = await this.manager.get(message.$target.connectionId);

        if (!connection)
            return;

        await this.messageSender.send(message, connection);
    }
}
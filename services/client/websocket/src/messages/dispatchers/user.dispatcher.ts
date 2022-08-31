import { Inject } from '@tcom/platform/lib/core/ioc';
import { WebsocketManager, UserTarget } from '@tcom/platform/lib/websocket';
import { MessageSender } from '../message-sender';
import { TargettedMessage } from '@tcom/platform/lib/websocket';
import { IMessageDispatcher } from '../message.interfaces';

export class UserMessageDispatcher implements IMessageDispatcher<UserTarget> {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly messageSender: MessageSender) {
        }

    public async dispatch(message: TargettedMessage<UserTarget>): Promise<void> {
        const connections = await this.manager.getByUserId(message.$target.userId);
        await this.messageSender.sendAll(message, connections);
    }
}
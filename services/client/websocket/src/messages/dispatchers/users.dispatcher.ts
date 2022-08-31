import { Inject } from '@tcom/platform/lib/core/ioc';
import { WebsocketManager, UsersTarget } from '@tcom/platform/lib/websocket';
import { MessageSender } from '../message-sender';
import { TargettedMessage } from '@tcom/platform/lib/websocket';
import { IMessageDispatcher } from '../message.interfaces';

export class UsersMessageDispatcher implements IMessageDispatcher<UsersTarget> {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly messageSender: MessageSender) {
        }

    public async dispatch(message: TargettedMessage<UsersTarget>): Promise<void> {
        for (const userId of message.$target.userIds) {
            const connections = await this.manager.getByUserId(userId);
            await this.messageSender.sendAll(message, connections);
        }
    }
}
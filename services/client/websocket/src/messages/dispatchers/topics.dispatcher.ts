import { Inject } from '@tcom/platform/lib/core/ioc';
import { WebsocketManager, TopicsTarget } from '@tcom/platform/lib/websocket';
import { MessageSender } from '../message-sender';
import { TargettedMessage } from '@tcom/platform/lib/websocket';
import { IMessageDispatcher } from '../message.interfaces';

export class TopicsMessageDispatcher implements IMessageDispatcher<TopicsTarget> {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly messageSender: MessageSender) {
        }

    public async dispatch(message: TargettedMessage<TopicsTarget>): Promise<void> {
        const connections = await this.manager.getByTopics(...message.$target.topics);
        await this.messageSender.sendAll(message, connections);
    }
}
import { /* Inject, */ Singleton } from '@tcom/platform/lib/core/ioc';
import { BroadcastTarget, /* WebsocketManager */ } from '@tcom/platform/lib/websocket';
// import { MessageSender } from '../message-sender';
import { TargettedMessage } from '@tcom/platform/lib/websocket';
import { IMessageDispatcher } from '../message.interfaces';

// NOTE: Cannot support broadcast using API gateway, too costly
@Singleton
export class BroadcastMessageDispatcher implements IMessageDispatcher<BroadcastTarget> {
    constructor(
        /*@Inject private readonly manager: WebsocketManager,
        @Inject private readonly messageSender: MessageSender*/) {
        }

    public async dispatch(message: TargettedMessage<BroadcastTarget>): Promise<void> {
        // const connections = await this.manager.getAll();
        // await this.messageSender.sendAll(message, connections);
    }
}
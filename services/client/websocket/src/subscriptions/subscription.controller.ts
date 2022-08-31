import { Inject } from '@tcom/platform/lib/core/ioc';
import { WebsocketManager } from '@tcom/platform/lib/websocket';
import { SubscribeRequest, UnsubscribeRequest } from './subscription.interfaces';

export class SubscriptionController {
    constructor(
        @Inject private readonly manager: WebsocketManager) {
        }

    public async subscribe(id: string, request: SubscribeRequest): Promise<void> {
        console.log(`Subscribing connection ID ${id} to topic ${request.topic} with settings`, request.topicSettings || '<none>');
        await this.manager.subscribe(id, request.topic);
    }

    public async unsubscribe(id: string, request: UnsubscribeRequest): Promise<void> {
        console.log(`Unsubscribing connection ID ${id} from topic ${request.topic}`);
        await this.manager.unsubscribe(id, request.topic);
    }
}
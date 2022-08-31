import { Config } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { WebsocketManager } from '@tcom/platform/lib/websocket';

export class ConnectionController {
    constructor(
        @Inject
        private manager: WebsocketManager) {
    }

    public async connected(event: APIGatewayEvent): Promise<void> {
        if (!event.requestContext.connectionId)
            throw new Error('Connection ID must be supplied.');

        if (!event.queryStringParameters || !event.queryStringParameters.skin)
            throw new Error('Skin must be supplied.');

        const skin = event.queryStringParameters.skin;

        console.log(`Connected: ${event.requestContext.connectionId} on skin ${skin}`);
        await this.manager.add(event.requestContext.connectionId, skin, Config.region, event.requestContext.apiId);
    }

    public async disconnected(event: APIGatewayEvent): Promise<void> {
        if (!event.requestContext.connectionId)
            throw new Error('Connection ID must be supplied.');

        console.log(`Disconnected: ${event.requestContext.connectionId}`);
        await this.manager.remove(event.requestContext.connectionId);
    }
}

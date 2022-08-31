import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { ApiGatewayManagementApi } from 'aws-sdk';
import { WebsocketManager, WebsocketConnection, Message } from '@tcom/platform/lib/websocket';
import { JsonSerialiser, Config } from '@tcom/platform/lib/core';

const gatewayApiCache: { [key: string]: ApiGatewayManagementApi } = {};

@Singleton
export class MessageSender {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async sendAll(message: Message, connectionIds: WebsocketConnection[]): Promise<void> {
        const promises = connectionIds.map(c => this.send(message, c));
        await Promise.all(promises);
    }

    public async send(message: Message, connection: WebsocketConnection): Promise<void> {
        if (!connection)
            return;

        if (message.$target.region && message.$target.region !== connection.region)
            return;

        const body = this.serialiser.serialise(message, (key, val) => {
            if (key !== '$target')
                return val;
        });

        console.log(`Sending websocket message to ${connection.id}`, body);
        await this.doSend(body, connection);
    }

    private async doSend(body: string, connection: WebsocketConnection): Promise<void> {
        const api = this.getClient(connection);
        console.log('API Endpoint', api.endpoint);

        try {
            await api.postToConnection({
                ConnectionId: connection.id,
                Data: body
            }).promise();
        } catch (err) {
            if (err.statusCode === 410) {
                console.log(`Removing stale connection ${connection.id}`);
                await this.manager.remove(connection.id);
            } else
                console.error(`Error sending message to connection ${connection.id}`, err.message);
        }
    }

    private getClient(connection: WebsocketConnection): ApiGatewayManagementApi {
        const cacheKey = `${connection.apiId}-${connection.region}-${Config.stage}`;

        if (!gatewayApiCache[cacheKey])
            gatewayApiCache[cacheKey] = new ApiGatewayManagementApi({
                apiVersion: '2029',
                endpoint: this.getEndpoint(connection)
            });

        return gatewayApiCache[cacheKey];
    }

    private getEndpoint(connection: WebsocketConnection): string {
        return `${connection.apiId}.execute-api.${connection.region}.amazonaws.com/${Config.stage}`;
    }
}
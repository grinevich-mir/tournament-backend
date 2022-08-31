import { Container } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { ConnectionController } from './connection.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

const EventType = {
    Connect: 'CONNECT',
    Disconnect: 'DISCONNECT'
};

const controller = Container.get(ConnectionController) as ConnectionController;

export const connectionHandler = lambdaHandler(async (event: APIGatewayEvent) => {
    const eventType = event.requestContext.eventType;

    try {
        if (eventType === EventType.Connect)
            await controller.connected(event);
        else
            await controller.disconnected(event);

        return {
            statusCode: 200
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500
        };
    }
});
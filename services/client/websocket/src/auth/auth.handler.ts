import { Container } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { AuthController } from './auth.controller';
import { AuthRequest } from './auth.interfaces';
import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';

const controller = Container.get(AuthController) as AuthController;

export const authHandler = lambdaHandler(async (event: APIGatewayEvent) => {
    if (!event.body)
        throw new Error('No body supplied.');
    if (!event.requestContext.connectionId)
        throw new Error('Connection ID missing.');

    const serialiser = new JsonSerialiser();

    const request = serialiser.deserialise<AuthRequest>(event.body);

    switch (request.action) {
        case 'login':
            await controller.login(event.requestContext.connectionId, request);
            break;

        case 'logout':
            await controller.logout(event.requestContext.connectionId);
            break;
    }

    return {
        statusCode: 200
    };
});
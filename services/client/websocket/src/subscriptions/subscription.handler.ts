import { Container } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionRequest } from './subscription.interfaces';
import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';

const controller = Container.get(SubscriptionController) as SubscriptionController;

export const subscriptionHandler = lambdaHandler(async (event: APIGatewayEvent) => {
    if (!event.body)
        throw new Error('No body supplied.');
    if (!event.requestContext.connectionId)
        throw new Error('Connection ID missing.');

    const serialiser = new JsonSerialiser();

    const request = serialiser.deserialise<SubscriptionRequest>(event.body);

    switch (request.action) {
        case 'subscribe':
            await controller.subscribe(event.requestContext.connectionId, request);
            break;

        case 'unsubscribe':
            await controller.unsubscribe(event.requestContext.connectionId, request);
            break;
    }

    return {
        statusCode: 200
    };
});
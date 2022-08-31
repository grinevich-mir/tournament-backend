import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { AuthorizationController } from './controllers/authorization.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

export const processAuthorization = lambdaHandler((event: APIGatewayEvent) => IocContainer.get(AuthorizationController).process(event));

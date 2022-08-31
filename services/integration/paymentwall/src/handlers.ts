import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { PingbackController } from './controllers/pingback.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

export const processPingback = lambdaHandler((event: APIGatewayEvent) => IocContainer.get(PingbackController).process(event));

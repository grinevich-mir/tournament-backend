import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent } from 'aws-lambda';
import { NotificationController } from './controllers/notification.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

export const processNotification = lambdaHandler((event: APIGatewayEvent) => IocContainer.get(NotificationController).process(event));
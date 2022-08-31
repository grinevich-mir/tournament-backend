import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { VerificationController } from './controllers/verification.controller';
import { StatusController } from './controllers/status.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

export const processVerification = lambdaHandler((event: APIGatewayEvent) => IocContainer.get(VerificationController).process(event));
export const processStatus = lambdaHandler((event: APIGatewayEvent): Promise<ProxyResult> => IocContainer.get(StatusController).process(event));
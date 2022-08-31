import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { SaleController } from './controllers/sale.controller';
import { AccountController } from './controllers/account.controller';
import { lambdaHandler } from '@tcom/platform/lib/core';

export const getAccounts = lambdaHandler((event: APIGatewayEvent): Promise<ProxyResult> => IocContainer.get(AccountController).process(event));
export const getSales = lambdaHandler((event: APIGatewayEvent) => IocContainer.get(SaleController).process(event));
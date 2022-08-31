import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { ok } from '@tcom/platform/lib/core/lambda';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { PaymentwallPingbackVerifier } from '@tcom/platform/lib/integration/paymentwall/utilities';
import { PingbackProcessorFactory } from '../pingback';

@Singleton
@LogClass()
export class PingbackController {
    constructor(
        @Inject private readonly verifier: PaymentwallPingbackVerifier,
        @Inject private readonly processorFactory: PingbackProcessorFactory) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        Logger.info('Paymentwall Pingback Event', event);

        try {
            const pingback = await this.verifier.verify(event.queryStringParameters, event.requestContext.identity.sourceIp);
            const processor = this.processorFactory.create(pingback.type);
            await processor.process(pingback);

        } catch (err) {
            Logger.error('Paymentwall Pingback Error', err);
        }

        return ok();
    }
}
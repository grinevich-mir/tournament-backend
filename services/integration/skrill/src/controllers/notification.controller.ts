import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { ok } from '@tcom/platform/lib/core/lambda';
import { SkrillTransactionStatus } from '@tcom/platform/lib/integration/skrill';
import { NotificationVerifier, NotificationProcessorFactory } from '../notifications';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';

const ALLOWED_TRANSACTION_STATUSES = [
    SkrillTransactionStatus.Processed,
    SkrillTransactionStatus.Failed
];

@Singleton
@LogClass()
export class NotificationController {
    constructor(
        @Inject private readonly verifier: NotificationVerifier,
        @Inject private readonly processorFactory: NotificationProcessorFactory, ) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        Logger.info('Skrill Webhook Event', event);

        try {
            const report = await this.verifier.verify(event.body);

            if (!ALLOWED_TRANSACTION_STATUSES.includes(report.status)) {
                Logger.info(`Ignoring Skrill Webhook Transaction Status '${report.status}'`);
                return ok();
            }

            const processor = this.processorFactory.create(report.status);
            await processor.process(report);

        } catch (err) {
            Logger.error('Skrill Webhook Error', err);
        }

        return ok();
    }
}
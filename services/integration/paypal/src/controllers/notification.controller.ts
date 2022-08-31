import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { IdempotencyCache } from '@tcom/platform/lib/api';
import { ok } from '@tcom/platform/lib/core/lambda';
import { PayPalWebhookEventType } from '@tcom/platform/lib/integration/paypal';
import { NotificationVerifier } from '../notifications';
import { NotificationProcessorFactory } from '../notifications/notification-processor-factory';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';

const ALLOWED_EVENT_TYPES = [
    PayPalWebhookEventType.PaymentCaptureRefunded,
    PayPalWebhookEventType.PaymentCaptureReversed,
    PayPalWebhookEventType.PaymentCaptureCompleted,
    PayPalWebhookEventType.PaymentCaptureDenied,
    PayPalWebhookEventType.PaymentCapturePending
];

@Singleton
@LogClass()
export class NotificationController {
    constructor(
        @Inject private readonly verifier: NotificationVerifier,
        @Inject private readonly processorFactory: NotificationProcessorFactory,
        @Inject private readonly idempotency: IdempotencyCache) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        Logger.info('PayPal Webhook Event', event);

        try {
            const notification = await this.verifier.verify(event.body, event.headers);

            await this.idempotency.get(notification.id, async () => {
                if (!ALLOWED_EVENT_TYPES.includes(notification.event_type))
                    return;

                const processor = this.processorFactory.create(notification.event_type);
                await processor.process(notification);
            });
        } catch (err) {
            Logger.error('PayPal Webhook Error', err);
        }

        return ok();
    }
}
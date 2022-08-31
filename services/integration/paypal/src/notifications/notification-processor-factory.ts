import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PayPalWebhookEventType } from '@tcom/platform/lib/integration/paypal';
import { NotificationProcessor } from './notification-processor';
import { OrderNotificationProcessor, RefundNotificationProcessor, CaptureNotificationProcessor } from './processors';

@Singleton
@LogClass({ result: false })
export class NotificationProcessorFactory {
    public create(type: PayPalWebhookEventType): NotificationProcessor {
        switch (type) {
            case PayPalWebhookEventType.CheckoutOrderApproved:
                return IocContainer.get(OrderNotificationProcessor);

            case PayPalWebhookEventType.PaymentCaptureRefunded:
            case PayPalWebhookEventType.PaymentCaptureReversed:
                return IocContainer.get(RefundNotificationProcessor);

            case PayPalWebhookEventType.PaymentCaptureCompleted:
            case PayPalWebhookEventType.PaymentCaptureDenied:
            case PayPalWebhookEventType.PaymentCapturePending:
                return IocContainer.get(CaptureNotificationProcessor);

            default:
                throw new Error(`PayPal webhook event type '${type}' not supported.`);
        }
    }
}
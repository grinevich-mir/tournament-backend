import { PayPalWebhookEvent } from '@tcom/platform/lib/integration/paypal';

export interface NotificationProcessor {
    process(notification: PayPalWebhookEvent): Promise<void>;
}
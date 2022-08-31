import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, ParameterStore } from '@tcom/platform/lib/core';
import { JsonSerialiser, UnauthorizedError } from '@tcom/platform/lib/core';
import { PayPalClientFactory, PayPalWebhookEvent, PayPalWebhookVerificationParams, PayPalWebhookVerificationStatus } from '@tcom/platform/lib/integration/paypal';

@Singleton
@LogClass()
export class NotificationVerifier {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly serializer: JsonSerialiser,
        @Inject private readonly clientFactory: PayPalClientFactory) {
    }

    public async verify(body: string | null, headers: { [name: string]: string }): Promise<PayPalWebhookEvent> {
        if (!body)
            throw new Error('Body cannot be empty.');

        const authAlgorithme = this.getHeaderValue(headers, 'PAYPAL-AUTH-ALGO');
        const certificateUrl = this.getHeaderValue(headers, 'PAYPAL-CERT-URL');
        const transmissionId = this.getHeaderValue(headers, 'PAYPAL-TRANSMISSION-ID');
        const transmissionSig = this.getHeaderValue(headers, 'PAYPAL-TRANSMISSION-SIG');
        const transmissionTime = this.getHeaderValue(headers, 'PAYPAL-TRANSMISSION-TIME');

        const notification = this.serializer.deserialise<PayPalWebhookEvent>(body);

        if (!notification)
            throw new Error('Failed to deserialise PayPal webhook event.');

        Logger.info('Processing PayPal Webhook Event:', notification);

        const webhookId = await this.parameterStore.get(`/${Config.stage}/integration/paypal/webhook-id`, false, true);

        const params: PayPalWebhookVerificationParams = {
            auth_algo: authAlgorithme,
            cert_url: certificateUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: webhookId,
            webhook_event: notification
        };

        Logger.info('Verifying PayPal Webhook Event:', params);

        const client = await this.clientFactory.create();
        const response = await client.webhook.verify(params);

        if (response === PayPalWebhookVerificationStatus.Failure)
            throw new UnauthorizedError('Invalid Paypal webhook event.');

        return notification;
    }

    private getHeaderValue(headers: { [name: string]: string }, key: string): string {
        const value = headers[key];

        if (!value)
            throw new Error(`${key} header missing.`);

        return value;
    }
}
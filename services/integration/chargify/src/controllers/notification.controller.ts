import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import qs from 'qs';
import { Config, NotFoundError, ParameterStore } from '@tcom/platform/lib/core';
import crypto from 'crypto';
import { NotificationModel, NotificationType } from '../models';
import { NotificationProcessorFactory } from '../notifications';
import { ChargifyClientFactory, ChargifySubscription } from '@tcom/platform/lib/integration/chargify';
import { Subscription, SubscriptionManager, SubscriptionStatus } from '@tcom/platform/lib/subscription';
import { SubscriptionStatusChangedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventDispatcher } from '@tcom/platform/lib/core/events';
import { ChargifySubscriptionMapper } from '@tcom/platform/lib/subscription/providers/chargify';
import { SubscriptionSynchroniser } from '@tcom/platform/lib/subscription/utilities';
import { PaymentProvider } from '@tcom/platform/lib/payment';

@Singleton
@LogClass()
export class NotificationController {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly clientFactory: ChargifyClientFactory,
        @Inject private readonly subscriptionManager: SubscriptionManager,
        @Inject private readonly subscriptionSynchroniser: SubscriptionSynchroniser,
        @Inject private readonly mapper: ChargifySubscriptionMapper,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly processorFactory: NotificationProcessorFactory) {
        }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        if (!event.body)
            throw new Error('Body cannot be empty.');

        if (!event.pathParameters)
            throw new Error('Path parameters cannot be empty.');

        const skinId = event.pathParameters.skinId;

        if (!skinId)
            throw new Error('Skin ID missing from path.');

        await this.verify(skinId, event);

        const notification = qs.parse(event.body) as unknown as NotificationModel;

        Logger.info('Notification:', notification);

        if (!this.hasCustomerReference(notification)) {
            Logger.warn('Notification does not have customer reference.');
            return this.ok();
        }

        Logger.info(`Processing webhook type '${notification.event}' for skin ${skinId}.`);

        let platformSub: Subscription | undefined;

        if (notification.payload.subscription && notification.payload.subscription.product.handle !== 'purchase')
            platformSub = await this.syncSubscription(skinId, notification.payload.subscription);

        const processor = this.processorFactory.create(notification);

        if (!processor) {
            Logger.warn(`No Chargify webhook processor found for event type '${notification.event}'.`);
            return this.ok();
        }

        await processor.process(skinId, notification, platformSub);

        return this.ok();
    }

    private ok(): ProxyResult {
        return {
            body: 'Ok',
            statusCode: 200
        };
    }

    private async verify(skinId: string, event: APIGatewayEvent): Promise<void> {
        const sharedKey = await this.parameterStore.get(`/${Config.stage}/integration/chargify/${skinId}/shared-key`, true, true);
        const requestSignature = event.headers['X-Chargify-Webhook-Signature-Hmac-Sha-256'];

        if (!requestSignature)
            throw new Error('Signature header missing.');

        if (!event.body)
            throw new Error('Body cannot be empty.');

        const expectedSignature = crypto.createHmac('sha256', sharedKey)
            .update(event.body)
            .digest('hex');

        if (expectedSignature !== requestSignature) {
            Logger.warn('Invalid Chargify webhook signature.', {
                requestSignature,
                expectedSignature
            });
            throw new Error('Invalid signature.');
        }
    }

    private async syncSubscription(skinId: string, subscription: ChargifySubscription): Promise<Subscription> {
        const client = await this.clientFactory.create(skinId);
        const chargifySub = await client.subscriptions.get(subscription.id);

        if (!chargifySub)
            throw new NotFoundError(`Chargify subscription ${subscription.id} could not be found.`);

        Logger.info('Synchronising Chargify subscription...');
        let platformSub = await this.subscriptionManager.getByProviderRef(PaymentProvider.Chargify, chargifySub.id.toString());
        const mappedSub = await this.mapper.map(skinId, chargifySub);

        if (!platformSub) {
            Logger.info(`Platform subscription did not exist with provider ref '${chargifySub.id}'`);
            platformSub = await this.subscriptionManager.add(mappedSub);
            await this.eventDispatcher.send(new SubscriptionStatusChangedEvent(platformSub.id, platformSub, SubscriptionStatus.Pending, platformSub.status));
        } else {
            Logger.info(`Updating platform subscription: ${platformSub.id}`);
            await this.subscriptionSynchroniser.sync(platformSub, mappedSub);
        }

        return mappedSub;
    }

    private hasCustomerReference(notification: NotificationModel): boolean {
        if (notification.event === NotificationType.RefundSuccess)
            return !!notification.payload.customer_reference;

        return !!notification.payload.subscription?.customer?.reference;
    }
}

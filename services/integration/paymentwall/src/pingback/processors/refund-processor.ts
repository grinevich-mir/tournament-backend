import { NotFoundError } from '@tcom/platform/lib/core';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentwallPingback, PaymentwallClientFactory } from '@tcom/platform/lib/integration/paymentwall';
import { PaymentManager, PaymentProvider } from '@tcom/platform/lib/payment';
import { PingbackProcessor } from '../pingback-processor';

@Singleton
@LogClass()
export class RefundProcessor implements PingbackProcessor {
    constructor(
        @Inject private readonly clientFactory: PaymentwallClientFactory,
        @Inject private readonly paymentManager: PaymentManager) {
    }

    public async process(pingback: PaymentwallPingback): Promise<void> {
        Logger.info('Running Paymentwall Refund Processor:', pingback);

        if (!pingback.referenceId)
            throw new NotFoundError('Paymentwall pingback missing reference ID.');

        const client = await this.clientFactory.create();
        const providerPayment = await client.payment.get(pingback.referenceId);

        if (!providerPayment)
            throw new NotFoundError(`Paymentwall payment for ref '${pingback.referenceId}' not found.`);

        Logger.info('Refunding Paymentwall Payment...', providerPayment);

        if (!providerPayment.refunded)
            return;

        const payment = await this.paymentManager.getByProviderRef(PaymentProvider.Paymentwall, providerPayment.id);

        if (!payment)
            throw new NotFoundError(`Platform payment for providerRef ${pingback.referenceId} not found.`);

        await this.paymentManager.refund(payment.id);
    }
}
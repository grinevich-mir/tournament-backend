import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { RefundSuccessNotificationModel } from '../../models';
import { NotificationProcessor } from '../notification-processor';
import { PaymentManager, PaymentProvider, PaymentStatus } from '@tcom/platform/lib/payment';

@Singleton
@LogClass()
export class RefundNotificationProcessor implements NotificationProcessor<RefundSuccessNotificationModel> {
    constructor(
        @Inject private readonly paymentManager: PaymentManager) {
        }

    public async process(_skinId: string, notification: RefundSuccessNotificationModel): Promise<void> {
        if (!notification.payload.payment_id) {
            Logger.error(`Chargify payment notification transaction is missing.`);
            return;
        }

        const platformPayment = await this.paymentManager.getByProviderRef(PaymentProvider.Chargify, notification.payload.payment_id);

        if (!platformPayment)
            throw new Error(`Platform payment does not exist with provider ref ${notification.payload.payment_id}`);

        if (platformPayment.status !== PaymentStatus.Successful) {
            Logger.warn(`Payment ${platformPayment.id} is not in a 'Successful' state.`);
            return;
        }

        await this.paymentManager.refund(platformPayment.id, notification.payload.memo);
    }
}
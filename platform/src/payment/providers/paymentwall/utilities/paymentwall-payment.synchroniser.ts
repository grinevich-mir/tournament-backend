import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { Payment } from '../../../payment';
import { PaymentManager } from '../../../payment-manager';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentwallPaymentMapper } from '../mappers';
import { PaymentwallPayment } from '../../../../integration/paymentwall';

@Singleton
@LogClass()
export class PaymentwallPaymentSynchroniser {
    constructor(
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMapper: PaymentwallPaymentMapper) {
    }

    public async run(payment: PaymentwallPayment, paymentMethod: PaymentMethod): Promise<Payment> {
        const platform = await this.paymentManager.getByProviderRef(PaymentProvider.Paymentwall, payment.id);

        return platform
            ? this.update(platform, payment, paymentMethod)
            : this.add(payment, paymentMethod);
    }

    private async add(payment: PaymentwallPayment, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Creating new payment for provider ref '${payment.id}'`);

        const added = this.paymentMapper.toNewPayment(payment, paymentMethod);

        return this.paymentManager.add(added);
    }

    private async update(platform: Payment, payment: PaymentwallPayment, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Updating existing payment '${platform.id}' for provider ref '${payment.id}'`);

        const updated = this.paymentMapper.toPayment(platform.id, payment, paymentMethod);

        return this.paymentManager.update(updated);
    }
}
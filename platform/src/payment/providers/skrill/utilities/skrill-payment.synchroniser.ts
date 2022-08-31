import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { Payment } from '../../../payment';
import { PaymentManager } from '../../../payment-manager';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { SkrillPaymentMapper } from '../mappers';
import { SkrillTransaction } from '../../../../integration/skrill';

@Singleton
@LogClass()
export class SkrillPaymentSynchroniser {
    constructor(
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMapper: SkrillPaymentMapper) {
    }

    public async run(transaction: SkrillTransaction, paymentMethod: PaymentMethod): Promise<Payment> {
        const payment = await this.paymentManager.getByProviderRef(PaymentProvider.Skrill, transaction.id);

        return payment
            ? this.update(payment, transaction, paymentMethod)
            : this.add(transaction, paymentMethod);
    }

    private async add(transaction: SkrillTransaction, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Creating new payment for provider ref '${transaction.id}'`);

        const added = this.paymentMapper.toNewPayment(transaction, paymentMethod);

        return this.paymentManager.add(added);
    }

    private async update(payment: Payment, transaction: SkrillTransaction, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Updating existing payment '${payment.id}' for provider ref '${transaction.id}'`);

        const updated = this.paymentMapper.toPayment(payment.id, transaction, paymentMethod);

        return this.paymentManager.update(updated);
    }
}
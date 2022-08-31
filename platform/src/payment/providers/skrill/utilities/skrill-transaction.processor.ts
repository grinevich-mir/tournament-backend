import { Singleton, Inject } from '../../../../core/ioc';
import { ForbiddenError } from '../../../../core';
import { LogClass } from '../../../../core/logging';
import { User } from '../../../../user';
import { Payment } from '../../../payment';
import { SkrillTransaction, SkrillTransactionStatus } from '../../../../integration/skrill';
import { SkrillPaymentMethodSynchroniser } from './skrill-payment-method.synchroniser';
import { SkrillPaymentSynchroniser } from './skrill-payment.synchroniser';

@Singleton
@LogClass()
export class SkrillTransactionProcessor {
    constructor(
        @Inject private readonly paymentMethodSynchroniser: SkrillPaymentMethodSynchroniser,
        @Inject private readonly paymentSynchroniser: SkrillPaymentSynchroniser) {
    }

    public async process(transaction: SkrillTransaction, user: User): Promise<Payment> {
        if (transaction.status === SkrillTransactionStatus.Pending)
            throw new ForbiddenError('Unable to process Skrill transaction in Pending state.');

        const paymentMethod = await this.paymentMethodSynchroniser.run(transaction.customer, user.id);

        return this.paymentSynchroniser.run(transaction, paymentMethod);
    }
}
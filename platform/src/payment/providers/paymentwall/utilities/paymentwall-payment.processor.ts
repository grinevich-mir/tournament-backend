import { ForbiddenError } from '../../../../core';
import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { User } from '../../../../user';
import { Payment } from '../../../payment';
import { PaymentwallTransaction } from '../../../../integration/paymentwall';
import { PaymentwallPaymentMethodSynchroniser } from './paymentwall-payment-method.synchroniser';
import { PaymentwallPaymentSynchroniser } from './paymentwall-payment.synchroniser';

@Singleton
@LogClass()
export class PaymentwallPaymentProcessor {
    constructor(
        @Inject private readonly paymentMethodSynchroniser: PaymentwallPaymentMethodSynchroniser,
        @Inject private readonly paymentSynchroniser: PaymentwallPaymentSynchroniser) {
    }

    public async process(transaction: PaymentwallTransaction, user: User): Promise<Payment> {
        if (!transaction.paymentMethodToken)
            throw new ForbiddenError('Paymentwall payment method token not supplied.');

        Logger.info('Processing Paymentwall Payment Transaction...', transaction);

        const paymentMethod = await this.paymentMethodSynchroniser.run(transaction, user.id);

        return this.paymentSynchroniser.run(transaction, paymentMethod);
    }
}
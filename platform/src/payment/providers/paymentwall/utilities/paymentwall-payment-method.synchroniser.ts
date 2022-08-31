import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { PaymentMethodCache } from '../../../cache';
import { PaymentMethodRepository } from '../../../repositories';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentwallTransaction } from '../../../../integration/paymentwall';
import { PaymentwallPaymentMethodMapper } from '../mappers';

@Singleton
@LogClass()
export class PaymentwallPaymentMethodSynchroniser {
    constructor(
        @Inject private readonly cache: PaymentMethodCache,
        @Inject private readonly repository: PaymentMethodRepository,
        @Inject private readonly paymentMethodMapper: PaymentwallPaymentMethodMapper) {
    }

    public async run(transaction: PaymentwallTransaction, userId: number): Promise<PaymentMethod> {
        const providerRef = transaction.paymentMethodToken;
        const paymentMethod = await this.repository.getByProviderRef(PaymentProvider.Paymentwall, providerRef);

        return paymentMethod
            ? this.update(paymentMethod, transaction)
            : this.add(transaction, userId);
    }

    private async add(transaction: PaymentwallTransaction, userId: number): Promise<PaymentMethod> {
        Logger.info(`Creating new payment method for provider ref '${transaction.paymentMethodToken}'`);

        const mapped = this.paymentMethodMapper.map(transaction, userId, true);
        const added = await this.repository.add(mapped);
        await this.cache.storeActiveForUser(added);

        return added;
    }

    private async update(paymentMethod: PaymentMethod, transaction: PaymentwallTransaction): Promise<PaymentMethod> {
        Logger.info(`Found existing payment method for provider ref '${paymentMethod.providerRef}'`);

        const mapped = this.paymentMethodMapper.mapMetadata(paymentMethod, transaction);
        const updated = await this.repository.update(mapped);
        await this.cache.storeActiveForUser(updated);

        return updated;
    }
}
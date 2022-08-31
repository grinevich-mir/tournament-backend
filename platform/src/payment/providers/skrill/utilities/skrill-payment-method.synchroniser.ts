import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { PaymentMethodCache } from '../../../cache';
import { PaymentMethodRepository } from '../../../repositories';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { SkrillPaymentMethodMapper } from '../mappers';
import { SkrillCustomer } from '../../../../integration/skrill';

@Singleton
@LogClass()
export class SkrillPaymentMethodSynchroniser {
    constructor(
        @Inject private readonly cache: PaymentMethodCache,
        @Inject private readonly repository: PaymentMethodRepository,
        @Inject private readonly paymentMethodMapper: SkrillPaymentMethodMapper) {
    }

    public async run(customer: SkrillCustomer, userId: number): Promise<PaymentMethod> {
        const paymentMethod = await this.repository.getByProviderRef(PaymentProvider.Skrill, customer.id);

        if (paymentMethod) {
            Logger.info(`Found existing payment method for provider ref '${customer.id}'`);

            await this.cache.storeActiveForUser(paymentMethod);

            return paymentMethod;
        }

        return this.add(userId, customer);
    }

    private async add(userId: number, customer: SkrillCustomer): Promise<PaymentMethod> {
        Logger.info(`Creating new payment method for provider ref '${customer.id}'`);

        const paymentMethod = this.paymentMethodMapper.map(customer.email, customer.id, userId);
        const added = await this.repository.add(paymentMethod);

        await this.cache.storeActiveForUser(added);

        return added;
    }
}
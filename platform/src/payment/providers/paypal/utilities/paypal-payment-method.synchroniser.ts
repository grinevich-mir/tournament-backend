import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { PayPalPayer } from '../../../../integration/paypal';
import { PaymentMethodCache } from '../../../cache';
import { PaymentMethodRepository } from '../../../repositories';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PayPalPaymentMethodMapper } from '../mappers';

@Singleton
@LogClass()
export class PayPalPaymentMethodSynchroniser {
    constructor(
        @Inject private readonly cache: PaymentMethodCache,
        @Inject private readonly repository: PaymentMethodRepository,
        @Inject private readonly paymentMethodMapper: PayPalPaymentMethodMapper) {
    }

    public async run(payer: PayPalPayer, userId: number): Promise<PaymentMethod> {
        const paymentMethod = await this.repository.getByProviderRef(PaymentProvider.PayPal, payer.payer_id);

        if (paymentMethod) {
            Logger.info(`Found existing payment method for provider ref '${payer.payer_id}'`);

            await this.cache.storeActiveForUser(paymentMethod);

            return paymentMethod;
        }

        return this.add(userId, payer);
    }

    private async add(userId: number, payer: PayPalPayer): Promise<PaymentMethod> {
        Logger.info(`Creating new payment method for provider ref '${payer.payer_id}'`);

        const paymentMethod = this.paymentMethodMapper.map(payer.email_address, payer.payer_id, userId);
        const added = await this.repository.add(paymentMethod);

        await this.cache.storeActiveForUser(added);

        return added;
    }
}
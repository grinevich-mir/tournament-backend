import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { TrustlyTransaction } from '../../../integration/trustly';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodType } from '../../payment-method-type';
import { PaymentProvider } from '../../payment-provider';

@Singleton
@LogClass()
export class TrustlyPaymentMethodMapper {
    public map(source: TrustlyTransaction, splitToken?: string): PaymentMethod {
        return {
            type: PaymentMethodType.BankAccount,
            accountNumber: source.payment.account.accountNumber,
            rountingNumber: source.payment.account.routingNumber,
            name: source.payment.account.name,
            bankName: source.payment.paymentProvider.name,
            bankId: source.payment.paymentProvider.paymentProviderId,
            provider: PaymentProvider.Trustly,
            providerRef: source.transactionId,
            metadata: splitToken ? {
                splitToken
            } : undefined
        } as Partial<PaymentMethod> as PaymentMethod;
    }
}
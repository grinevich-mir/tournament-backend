import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { PaymentMethodType } from '../../../payment-method-type';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentwallPaymentMethod, PaymentMethod } from '../../../payment-method';
import { PaymentwallTransaction } from '../../../../integration/paymentwall';

@Singleton
@LogClass()
export class PaymentwallPaymentMethodMapper {
    public map(providerRef: string, userId: number, enabled: boolean): PaymentwallPaymentMethod;
    public map(transaction: PaymentwallTransaction, userId: number, enabled: boolean): PaymentwallPaymentMethod;
    public map(providerRefOrTransaction: string | PaymentwallTransaction, userId: number, enabled: boolean = true): PaymentwallPaymentMethod {
        let ref;
        let metadata;

        if (typeof providerRefOrTransaction === 'string')
            ref = providerRefOrTransaction;
        else {
            ref = providerRefOrTransaction.paymentMethodToken;
            metadata = {
                paymentType: providerRefOrTransaction.paymentType,
                paymentSystem: providerRefOrTransaction.payment_system
            };
        }

        return {
            provider: PaymentProvider.Paymentwall,
            type: PaymentMethodType.Paymentwall,
            providerRef: ref,
            userId,
            enabled,
            metadata
        } as Partial<PaymentwallPaymentMethod> as PaymentwallPaymentMethod;
    }

    public mapMetadata(paymentMethod: PaymentMethod, transaction: PaymentwallTransaction): PaymentwallPaymentMethod {
        return {
            ...paymentMethod,
            metadata: {
                paymentType: transaction.paymentType,
                paymentSystem: transaction.payment_system
            }
        } as Partial<PaymentwallPaymentMethod> as PaymentwallPaymentMethod;
    }
}
import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { PayPalPaymentMethod } from '../../../payment-method';
import { PaymentMethodType } from '../../../payment-method-type';
import { PaymentProvider } from '../../../payment-provider';

@Singleton
@LogClass()
export class PayPalPaymentMethodMapper {
    public map(email: string, providerRef: string, userId?: number, enabled: boolean = true): PayPalPaymentMethod {
        return {
            provider: PaymentProvider.PayPal,
            type: PaymentMethodType.PayPal,
            email,
            providerRef,
            userId,
            enabled
        } as Partial<PayPalPaymentMethod> as PayPalPaymentMethod;
    }
}
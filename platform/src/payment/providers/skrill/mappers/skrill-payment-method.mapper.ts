import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { SkrillPaymentMethod } from '../../../payment-method';
import { PaymentMethodType } from '../../../payment-method-type';
import { PaymentProvider } from '../../../payment-provider';

@Singleton
@LogClass()
export class SkrillPaymentMethodMapper {
    public map(email: string, providerRef: string, userId?: number, enabled: boolean = true): SkrillPaymentMethod {
        return {
            provider: PaymentProvider.Skrill,
            type: PaymentMethodType.Skrill,
            email,
            providerRef,
            userId,
            enabled
        } as Partial<SkrillPaymentMethod> as SkrillPaymentMethod;
    }
}
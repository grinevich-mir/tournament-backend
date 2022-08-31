import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { UnipaasAuthorization, UnipaasPaymentOptionType } from '../../../integration/unipaas';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodCardType } from '../../payment-method-card-type';
import { PaymentMethodType } from '../../payment-method-type';
import { PaymentProvider } from '../../payment-provider';

@Singleton
@LogClass()
export class UnipaasPaymentMethodMapper {
    public map(source: UnipaasAuthorization): PaymentMethod {
        switch (source.paymentOption.paymentOptionType) {
            case UnipaasPaymentOptionType.Card:
                return {
                    provider: PaymentProvider.Unipaas,
                    providerRef: source.paymentOption.paymentOptionId,
                    type: PaymentMethodType.CreditCard,
                    cardType: this.mapCardType(source.paymentOption.brand),
                    expiryYear: Number(`20${source.paymentOption.expirationYear}`),
                    expiryMonth: Number(source.paymentOption.expirationMonth),
                    lastFour: source.paymentOption.last4digits,
                    metadata: {
                        consumerId: source.consumer.consumerId
                    }
                } as Partial<PaymentMethod> as PaymentMethod;

            case UnipaasPaymentOptionType.Alternative:
                return this.mapAlternative(source);
        }

        throw new Error(`Payment option type ${source.paymentOption.paymentOptionType} not supported`);
    }

    private mapAlternative(source: UnipaasAuthorization): PaymentMethod {
        const brand = source.transactions[0].brand;

        switch (brand) {
            case 'paypal':
                return {
                    provider: PaymentProvider.Unipaas,
                    providerRef: source.paymentOption.paymentOptionId,
                    type: PaymentMethodType.PayPal,
                    metadata: {
                        consumerId: source.consumer.consumerId
                    }
                } as Partial<PaymentMethod> as PaymentMethod;

            case 'giropay':
                return {
                    provider: PaymentProvider.Unipaas,
                    providerRef: source.paymentOption.paymentOptionId,
                    type: PaymentMethodType.Giropay,
                    metadata: {
                        consumerId: source.consumer.consumerId
                    }
                } as Partial<PaymentMethod> as PaymentMethod;

            case 'paysafecard':
                return {
                    provider: PaymentProvider.Unipaas,
                    providerRef: source.paymentOption.paymentOptionId,
                    type: PaymentMethodType.Paysafecard,
                    metadata: {
                        consumerId: source.consumer.consumerId
                    }
                } as Partial<PaymentMethod> as PaymentMethod;
        }

        throw new Error(`Alternative payment option type ${brand} not supported`);
    }

    private mapCardType(brand?: string): PaymentMethodCardType {
        switch (brand) {
            default:
                return PaymentMethodCardType.Unknown;
            case 'VISA':
                return PaymentMethodCardType.Visa;
            case 'MASTERCARD':
                return PaymentMethodCardType.MasterCard;
            case 'AMEX':
                return PaymentMethodCardType.AmericanExpress;
        }
    }
}
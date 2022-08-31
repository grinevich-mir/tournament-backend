import _ from 'lodash';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ChargifyPaymentProfile, ChargifyPaymentType } from '../../../integration/chargify';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodCardType } from '../../payment-method-card-type';
import { PaymentMethodType } from '../../payment-method-type';
import { PaymentProvider } from '../../payment-provider';

@Singleton
@LogClass()
export class ChargifyPaymentMethodMapper {
    public map(profile: ChargifyPaymentProfile): PaymentMethod {
        switch (profile.payment_type) {
            case ChargifyPaymentType.CreditCard:
                return {
                    provider: PaymentProvider.Chargify,
                    providerRef: profile.id.toString(),
                    type: PaymentMethodType.CreditCard,
                    cardType: this.mapCardType(profile.card_type),
                    lastFour: _.chain(profile.masked_card_number).split('-').last().value(),
                    expiryMonth: profile.expiration_month,
                    expiryYear: profile.expiration_year,
                } as Partial<PaymentMethod> as PaymentMethod;
        }

        throw new Error(`Payment profile type ${profile.payment_type} not supported`);
    }

    private mapCardType(cardType?: string): PaymentMethodCardType {
        switch (cardType) {
            default:
                return PaymentMethodCardType.Unknown;
            case 'bogus':
                return PaymentMethodCardType.Test;
            case 'visa':
                return PaymentMethodCardType.Visa;
            case 'master':
                return PaymentMethodCardType.MasterCard;
            case 'discover':
                return PaymentMethodCardType.Discover;
            case 'american_express':
                return PaymentMethodCardType.AmericanExpress;
            case 'diners_club':
                return PaymentMethodCardType.DinersClub;
            case 'jcb':
                return PaymentMethodCardType.JCB;
            case 'switch':
                return PaymentMethodCardType.Switch;
            case 'solo':
                return PaymentMethodCardType.Solo;
            case 'dankort':
                return PaymentMethodCardType.Dankort;
            case 'maestro':
                return PaymentMethodCardType.Maestro;
            case 'forbrugsforeningen':
                return PaymentMethodCardType.Forbrugsforeningen;
            case 'laser':
                return PaymentMethodCardType.Laser;
        }
    }
}
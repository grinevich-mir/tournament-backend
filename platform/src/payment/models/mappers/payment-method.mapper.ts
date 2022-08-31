import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodType } from '../../payment-method-type';
import { PaymentMethodModel } from '../payment-method.model';
import { maskEmailAddress } from '../../../core/utilities';

@Singleton
@LogClass()
export class PaymentMethodModelMapper {
    public map(source: PaymentMethod): PaymentMethodModel {
        switch (source.type) {
            case PaymentMethodType.CreditCard:
                return {
                    id: source.id,
                    type: PaymentMethodType.CreditCard,
                    provider: source.provider,
                    cardType: source.cardType,
                    lastFour: source.lastFour,
                    expiryMonth: source.expiryMonth,
                    expiryYear: source.expiryYear,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };

            case PaymentMethodType.BankAccount:
                return {
                    id: source.id,
                    type: PaymentMethodType.BankAccount,
                    provider: source.provider,
                    routingNumber: source.routingNumber,
                    accountNumber: source.accountNumber,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };

            case PaymentMethodType.PayPal:
            case PaymentMethodType.Skrill:
                return {
                    id: source.id,
                    type: source.type,
                    provider: source.provider,
                    email: maskEmailAddress(source.email),
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };

            default:
                return {
                    id: source.id,
                    type: source.type,
                    provider: source.provider,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };
        }
    }
}
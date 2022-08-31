import { PaymentMethod } from '../../payment-method';
import { PaymentMethodType } from '../../payment-method-type';
import { BankAccountPaymentMethodEntity, CreditCardPaymentMethodEntity, PaymentMethodEntity, PayPalPaymentMethodEntity, SkrillPaymentMethodEntity, PaymentwallPaymentMethodEntity } from '../../entities';
import { LogClass } from '../../../core/logging';
import { Singleton } from '../../../core/ioc';

@Singleton
@LogClass()
export class PaymentMethodEntityMapper {
    public fromEntity(source: PaymentMethodEntity): PaymentMethod {
        if (source instanceof CreditCardPaymentMethodEntity)
            return {
                id: source.id,
                userId: source.userId,
                type: PaymentMethodType.CreditCard,
                provider: source.provider,
                providerRef: source.providerRef,
                metadata: source.metadata,
                cardType: source.cardType,
                lastFour: source.lastFour,
                expiryMonth: source.expiryMonth,
                expiryYear: source.expiryYear,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof BankAccountPaymentMethodEntity)
            return {
                id: source.id,
                userId: source.userId,
                type: PaymentMethodType.BankAccount,
                provider: source.provider,
                providerRef: source.providerRef,
                metadata: source.metadata,
                name: source.name,
                bankName: source.bankName,
                bankId: source.bankId,
                routingNumber: source.routingNumber,
                accountNumber: source.accountNumber,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof PayPalPaymentMethodEntity)
            return {
                id: source.id,
                userId: source.userId,
                type: PaymentMethodType.PayPal,
                provider: source.provider,
                providerRef: source.providerRef,
                email: source.email,
                metadata: source.metadata,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof SkrillPaymentMethodEntity)
            return {
                id: source.id,
                userId: source.userId,
                type: PaymentMethodType.Skrill,
                provider: source.provider,
                providerRef: source.providerRef,
                email: source.email,
                metadata: source.metadata,
                enabled: source.enabled,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        switch (source.type) {
            case PaymentMethodType.Paysafecard:
                return {
                    id: source.id,
                    userId: source.userId,
                    type: PaymentMethodType.Paysafecard,
                    provider: source.provider,
                    providerRef: source.providerRef,
                    metadata: source.metadata,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };

            case PaymentMethodType.Giropay:
                return {
                    id: source.id,
                    userId: source.userId,
                    type: PaymentMethodType.Giropay,
                    provider: source.provider,
                    providerRef: source.providerRef,
                    metadata: source.metadata,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };

            case PaymentMethodType.Paymentwall:
                return {
                    id: source.id,
                    userId: source.userId,
                    type: PaymentMethodType.Paymentwall,
                    provider: source.provider,
                    providerRef: source.providerRef,
                    metadata: source.metadata,
                    enabled: source.enabled,
                    createTime: source.createTime,
                    updateTime: source.updateTime
                };
        }

        throw new Error(`Unsupported payment method type ${source.type}`);
    }

    public toEntity(source: PaymentMethod): PaymentMethodEntity {
        switch (source.type) {
            case PaymentMethodType.CreditCard:
                const creditCardEntity = new CreditCardPaymentMethodEntity();
                creditCardEntity.cardType = source.cardType;
                creditCardEntity.lastFour = source.lastFour;
                creditCardEntity.expiryMonth = source.expiryMonth;
                creditCardEntity.expiryYear = source.expiryYear;
                return this.mapBaseEntity(source, creditCardEntity);

            case PaymentMethodType.BankAccount:
                const bankAccountEntity = new BankAccountPaymentMethodEntity();
                bankAccountEntity.name = source.name;
                bankAccountEntity.bankName = source.bankName;
                bankAccountEntity.bankId = source.bankId;
                bankAccountEntity.routingNumber = source.routingNumber;
                bankAccountEntity.accountNumber = source.accountNumber;
                return this.mapBaseEntity(source, bankAccountEntity);

            case PaymentMethodType.PayPal:
                const paypalEntity = new PayPalPaymentMethodEntity();
                paypalEntity.email = source.email;
                return this.mapBaseEntity(source, paypalEntity);

            case PaymentMethodType.Skrill:
                const skrillEntity = new SkrillPaymentMethodEntity();
                skrillEntity.email = source.email;
                return this.mapBaseEntity(source, skrillEntity);

            case PaymentMethodType.Paymentwall:
                const paymentwallEntity = new PaymentwallPaymentMethodEntity();
                return this.mapBaseEntity(source, paymentwallEntity);
        }

        throw new Error(`Unsupported payment method type ${source.type}`);
    }

    private mapBaseEntity(source: PaymentMethod, entity: PaymentMethodEntity): PaymentMethodEntity {
        entity.id = source.id;
        entity.userId = source.userId;
        entity.type = source.type;
        entity.enabled = source.enabled;
        entity.provider = source.provider;
        entity.providerRef = source.providerRef;
        entity.metadata = source.metadata;
        entity.createTime = source.createTime;
        entity.updateTime = source.updateTime;
        return entity;
    }
}
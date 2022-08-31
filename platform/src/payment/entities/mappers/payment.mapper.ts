import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { NewPayment } from '../../new-payment';
import { Payment } from '../../payment';
import { PaymentEntity } from '../payment.entity';
import { PaymentMethodEntityMapper } from './payment-method.mapper';

@Singleton
@LogClass()
export class PaymentEntityMapper {
    constructor(
        @Inject private readonly paymentMethodMapper: PaymentMethodEntityMapper) {
        }

    public fromEntity(source: PaymentEntity): Payment {
        return {
            id: source.id,
            userId: source.userId,
            amount: source.amount,
            currencyCode: source.currencyCode,
            provider: source.provider,
            providerRef: source.providerRef,
            status: source.status,
            memo: source.memo,
            paymentMethodId: source.paymentMethodId,
            paymentMethod: this.paymentMethodMapper.fromEntity(source.paymentMethod),
            type: source.type,
            errorCode: source.errorCode,
            voidTime: source.voidTime,
            refundTime: source.refundTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public toEntity(source: Payment): PaymentEntity {
        const entity = new PaymentEntity();
        entity.id = source.id;
        entity.userId = source.userId;
        entity.paymentMethodId = source.paymentMethodId;
        entity.amount = source.amount;
        entity.currencyCode = source.currencyCode;
        entity.memo = source.memo;
        entity.provider = source.provider;
        entity.providerRef = source.providerRef;
        entity.status = source.status;
        entity.type = source.type;
        entity.errorCode = source.errorCode;
        entity.voidTime = source.voidTime;
        entity.refundTime = source.refundTime;
        return entity;
    }

    public newToEntity(source: NewPayment): PaymentEntity {
        const entity = new PaymentEntity();
        entity.userId = source.userId;
        entity.paymentMethodId = source.paymentMethodId;
        entity.amount = source.amount;
        entity.currencyCode = source.currencyCode;
        entity.provider = source.provider;
        entity.providerRef = source.providerRef;
        entity.memo = source.memo;
        entity.status = source.status;
        entity.type = source.type;
        entity.errorCode = source.errorCode;
        entity.voidTime = source.voidTime;
        return entity;
    }
}
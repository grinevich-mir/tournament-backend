import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { Payment } from '../../payment';
import { PaymentMethodModelMapper } from './payment-method.mapper';
import { PaymentModel } from '../payment.model';

@Singleton
@LogClass()
export class PaymentModelMapper {
    constructor(
        @Inject private readonly paymentMethodMapper: PaymentMethodModelMapper) {
    }

    public map(source: Payment): PaymentModel {
        return {
            id: source.id,
            amount: source.amount,
            currencyCode: source.currencyCode,
            paymentMethod: this.paymentMethodMapper.map(source.paymentMethod),
            status: source.status,
            type: source.type,
            createTime: source.createTime
        };
    }
}
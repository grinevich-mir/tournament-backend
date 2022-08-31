import { PaymentMethod } from './payment-method';
import { NewPayment } from './new-payment';

export interface Payment extends NewPayment {
    id: number;
    paymentMethod: PaymentMethod;
    refundTime?: Date;
    createTime: Date;
    updateTime: Date;
}
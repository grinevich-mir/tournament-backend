import { PaymentStatus } from '../payment-status';
import { PaymentType } from '../payment-type';
import { PaymentMethodModel } from './payment-method.model';

export interface PaymentModel {
    id: number;
    type: PaymentType;
    amount: number;
    currencyCode: string;
    status: PaymentStatus;
    paymentMethod: PaymentMethodModel;
    createTime: Date;
}
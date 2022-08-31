import { PaymentResult } from '@tcom/platform/lib/payment';
import { OrderStatus } from '@tcom/platform/lib/order';

export interface OrderPaymentCompleteModel {
    status: OrderStatus;
    payment?: PaymentResult;
}